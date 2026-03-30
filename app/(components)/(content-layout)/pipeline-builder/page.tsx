"use client";

import RouteProtection from "@/shared/components/RouteProtection";
import Seo from "@/shared/layouts-components/seo/seo";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { Alert, Button, Card, Col, Form, Modal, Offcanvas, Row } from "react-bootstrap";
import ReactFlow, {
  applyEdgeChanges,
  applyNodeChanges,
  addEdge,
  Background,
  Controls,
  Handle,
  MiniMap,
  Position,
  type EdgeChange,
  type Connection,
  type Edge,
  type Node,
  type NodeChange,
  type NodeProps,
  type ReactFlowInstance,
} from "reactflow";
import "reactflow/dist/style.css";

import {
  nodeRegistry,
  nodeTypeIds,
  type NodeFormValues,
  type NodeTypeId,
  type FormField,
  type NodeCategory,
} from "@/shared/pipeline/nodeRegistry";
import type { PipelineEdgeInstance, PipelineNodeInstance } from "@/shared/pipeline/pipelineTypes";
import { exportPipelineToVectorJson } from "@/shared/pipeline/exportPipeline";

type PipelineNodeData = {
  nodeTypeId: NodeTypeId;
  name: string;
  formValues: NodeFormValues;
};

function normalizeNodeName(input: string) {
  // JSON key constraint: lowercase, non-space.
  const normalized = input.trim().toLowerCase().replace(/\s+/g, "_");
  return normalized.replace(/[^a-z0-9_-]/g, "");
}

function getUniqueNodeName(baseName: string, existingNames: Set<string>) {
  if (!existingNames.has(baseName)) return baseName;
  let i = 2;
  while (existingNames.has(`${baseName}_${i}`)) i += 1;
  return `${baseName}_${i}`;
}

const renderFieldControl = (field: FormField, value: string | number, onChange: (next: any) => void) => {
  const inputStyle: React.CSSProperties = {
    background: "var(--form-control-bg)",
    borderColor: "var(--input-border)",
    color: "var(--default-text-color)",
  };

  if (field.kind === "number") {
    return (
      <Form.Control
        type="number"
        value={String(value ?? field.defaultValue)}
        min={field.min}
        step={field.step ?? 1}
        onChange={(e) => onChange(Number(e.target.value))}
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        style={inputStyle}
      />
    );
  }

  if (field.kind === "textarea") {
    return (
      <Form.Control
        as="textarea"
        rows={field.rows ?? 4}
        value={String(value ?? field.defaultValue)}
        placeholder={field.placeholder}
        onChange={(e) => onChange(e.target.value)}
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        style={inputStyle}
      />
    );
  }

  return (
    <Form.Control
      type="text"
      value={String(value ?? field.defaultValue)}
      placeholder={field.placeholder}
      onChange={(e) => onChange(e.target.value)}
      onMouseDown={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
      style={inputStyle}
    />
  );
};

export default function PipelineBuilderPage() {
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const [nodes, setNodes] = useState<Node<PipelineNodeData>[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(new Set());

  const [exportErrors, setExportErrors] = useState<string[]>([]);
  const [exportText, setExportText] = useState<string>("");
  const [connectError, setConnectError] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showNodeLibrary, setShowNodeLibrary] = useState(false);

  const nodesById = useMemo(() => {
    const m = new Map<string, Node<PipelineNodeData>>();
    for (const n of nodes) m.set(n.id, n);
    return m;
  }, [nodes]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setConnectError(null);

      if (!rfInstance || !wrapperRef.current) return;

      const nodeTypeId = event.dataTransfer.getData("application/reactflow") as NodeTypeId;
      const def = nodeRegistry[nodeTypeId];
      if (!def) return;

      const bounds = wrapperRef.current.getBoundingClientRect();
      const position = rfInstance.project({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });

      const existingNames = new Set(nodes.map((n) => n.data.name));
      const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now());
      const name = getUniqueNodeName(def.defaultInstanceName, existingNames);

      const newNode: Node<PipelineNodeData> = {
        id,
        type: "pipelineNode",
        position,
        data: {
          nodeTypeId: def.typeId,
          name,
          formValues: { ...def.defaultFormValues },
        },
      };

      setNodes((prev) => [...prev, newNode]);
    },
    [rfInstance, nodes]
  );

  const updateNodeData = useCallback((nodeId: string, updater: (prev: PipelineNodeData) => PipelineNodeData) => {
    setNodes((prev) => prev.map((n) => (n.id === nodeId ? { ...n, data: updater(n.data) } : n)));
  }, []);

  const handleConnect = useCallback(
    (params: Connection) => {
      setConnectError(null);
      if (!params.source || !params.target) return;

      const sourceNode = nodesById.get(params.source);
      const targetNode = nodesById.get(params.target);
      if (!sourceNode || !targetNode) return;

      const targetDef = nodeRegistry[targetNode.data.nodeTypeId];

      // Block incoming edge if target already has one (single-input rule).
      if (edges.some((e) => e.target === params.target)) {
        setConnectError(`"${targetNode.data.name}" already has an incoming connection (single-input).`);
        return;
      }

      if (targetDef.category === "source") {
        setConnectError(`Cannot connect into a source node ("${targetNode.data.name}").`);
        return;
      }

      // Block invalid compatibility connections from registry.
      const sourceType = sourceNode.data.nodeTypeId;
      if (!targetDef.allowedInputFromNodeTypeIds.includes(sourceType)) {
        setConnectError(
          `Invalid connection: "${sourceNode.data.name}" -> "${targetNode.data.name}". Expected one of: ${targetDef.allowedInputFromNodeTypeIds.join(
            ", "
          )}.`
        );
        return;
      }

      const edgeId =
        typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `e_${Date.now()}`;

      setEdges((prev) =>
        addEdge(
          {
            id: edgeId,
            source: params.source as string,
            target: params.target as string,
            sourceHandle: params.sourceHandle ?? "output",
            targetHandle: params.targetHandle ?? "input",
          },
          prev
        )
      );
    },
    [edges, nodesById]
  );

  const handleExport = useCallback(() => {
    setExportErrors([]);
    setExportText("");
    setConnectError(null);

    const pipelineNodes: PipelineNodeInstance[] = nodes.map((n) => ({
      id: n.id,
      nodeTypeId: n.data.nodeTypeId,
      name: n.data.name,
      category: nodeRegistry[n.data.nodeTypeId].category as NodeCategory,
      formValues: n.data.formValues,
      position: { x: n.position.x, y: n.position.y },
    }));

    const pipelineEdges = edges.map((e) => ({
      id: e.id,
      sourceNodeId: e.source,
      targetNodeId: e.target,
    })) satisfies PipelineEdgeInstance[];

    const res = exportPipelineToVectorJson({
      nodes: pipelineNodes,
      edges: pipelineEdges,
      dataDir: "/var/lib/vector",
    });

    if (!res.ok) {
      setExportErrors(res.errors);
      setShowExportModal(true);
      return;
    }

    setExportText(JSON.stringify(res.json, null, 2));
    setShowExportModal(true);
  }, [nodes, edges]);

  const copyExport = useCallback(async () => {
    if (!exportText) return;
    try {
      await navigator.clipboard.writeText(exportText);
    } catch {
      // Fallback for environments that block clipboard API.
      const ta = document.createElement("textarea");
      ta.value = exportText;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
  }, [exportText]);

  const PipelineNodeCardInner: React.FC<NodeProps<PipelineNodeData>> = ({ id, data }) => {
    const def = nodeRegistry[data.nodeTypeId];
    const isExpanded = expandedNodeIds.has(id);

    return (
      <div
        className="pipelineNodeCard"
      >
        <div className="pipelineNodeCardInner">
          <div
            style={{
              marginBottom: 6,
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
            }}
          >
            <span
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                border: "1px solid var(--default-border)",
                background: "var(--form-control-bg)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <i className={def.iconClass} style={{ fontSize: 18, lineHeight: 1 }} />
            </span>

            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 14, lineHeight: 1.2, marginBottom: 6 }}>
                {data.name || def.defaultInstanceName}
              </div>
              <div style={{ fontSize: 12, opacity: 0.85 }}>
                {def.category} / {def.vectorType}
              </div>
            </div>

            <button
              type="button"
              className="nodeExpandBtn"
              aria-label={isExpanded ? "Collapse node" : "Expand node"}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setExpandedNodeIds((prev) => {
                  const next = new Set(prev);
                  if (next.has(id)) next.delete(id);
                  else next.add(id);
                  return next;
                });
              }}
            >
              <span className={`nodeExpandArrow ${isExpanded ? "isExpanded" : ""}`}>v</span>
            </button>

            <button
              type="button"
              className="nodeDeleteBtn"
              aria-label="Delete node"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setNodes((prev) => prev.filter((n) => n.id !== id));
                setEdges((prev) => prev.filter((edge) => edge.source !== id && edge.target !== id));
                setExpandedNodeIds((prev) => {
                  const next = new Set(prev);
                  next.delete(id);
                  return next;
                });
              }}
            >
              x
            </button>
          </div>
          <div style={{ marginBottom: 10 }} />

          {/* Single input + output handles. */}
          <Handle
            type="target"
            position={Position.Left}
            id="input"
            style={{ background: "var(--form-control-bg)", border: "1px solid var(--input-border)", zIndex: 3 }}
          />
          <Handle
            type="source"
            position={Position.Right}
            id="output"
            style={{ background: "var(--form-control-bg)", border: "1px solid var(--input-border)", zIndex: 3 }}
          />

          {isExpanded ? (
            <div
              style={{
                marginTop: 10,
                paddingTop: 10,
                borderTop: "1px solid rgba(255,255,255,0.12)",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <Form.Group className="mb-0">
                <Form.Label style={{ marginBottom: 6 }}>Node name (JSON key)</Form.Label>
                <Form.Control
                  type="text"
                  value={data.name}
                  onChange={(e) => {
                    const next = normalizeNodeName(e.target.value);
                    updateNodeData(id, (prev) => ({ ...prev, name: next }));
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                  style={{
                    background: "var(--form-control-bg)",
                    borderColor: "var(--input-border)",
                    color: "var(--default-text-color)",
                  }}
                />
                <div className="text-muted" style={{ fontSize: 11, marginTop: 4 }}>
                  lowercase, no spaces
                </div>
              </Form.Group>

              {def.formFields.map((field) => (
                <Form.Group className="mb-0" key={field.name}>
                  <Form.Label style={{ marginBottom: 6 }}>{field.label}</Form.Label>
                  {renderFieldControl(field, data.formValues[field.name], (nextValue) => {
                    updateNodeData(id, (prev) => ({
                      ...prev,
                      formValues: { ...prev.formValues, [field.name]: nextValue },
                    }));
                  })}
                </Form.Group>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  const nodeTypes = useMemo(() => ({ pipelineNode: PipelineNodeCardInner }), [updateNodeData, expandedNodeIds]);
  const defaultEdgeOptions = useMemo(
    () => ({
      type: "smoothstep" as const,
      animated: true,
      style: {
        stroke: "rgba(var(--primary-rgb), 0.9)",
        strokeWidth: 2,
      },
    }),
    []
  );

  const registryByCategory = useMemo(() => {
    const grouped: Record<NodeCategory, typeof nodeTypeIds> = {
      source: [],
      transform: [],
      sink: [],
    };

    for (const typeId of nodeTypeIds) {
      const cat = nodeRegistry[typeId].category;
      grouped[cat].push(typeId);
    }

    return grouped;
  }, []);

  return (
    <RouteProtection>
      <div>
        <style jsx global>{`
          /* Make ReactFlow attribution readable in dark mode. */
          html[data-theme-mode="dark"] .react-flow__attribution {
            background: rgba(0, 0, 0, 0.35) !important;
          }
          html[data-theme-mode="dark"] .react-flow__attribution a {
            color: rgba(var(--light-rgb), 0.75) !important;
          }

          .pipelineNodeCard {
            position: relative;
            overflow: hidden;
            border-radius: 10px;
            padding: 2px;
            min-width: 240px;
            max-width: 360px;
            color: var(--default-text-color);
            background: transparent;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
            border: 1px solid var(--default-border);
          }

          .pipelineNodeCardInner {
            position: relative;
            z-index: 1;
            background: var(--default-body-bg-color);
            border-radius: 8px;
            padding: 10px;
            border: 1px solid var(--default-border);
          }

          .nodeExpandBtn {
            margin-left: auto;
            width: 22px;
            height: 22px;
            border-radius: 9999px;
            border: 1px solid var(--default-border);
            background: var(--form-control-bg);
            color: var(--default-text-color);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            padding: 0;
            opacity: 0.9;
          }

          .nodeExpandBtn:hover {
            opacity: 1;
            border-color: rgba(var(--primary-rgb), 0.5);
          }

          .nodeExpandArrow {
            display: inline-block;
            font-weight: 900;
            font-size: 12px;
            transform: rotate(0deg);
            transition: transform 0.15s ease;
            line-height: 1;
          }

          .nodeExpandArrow.isExpanded {
            transform: rotate(180deg);
          }

          .nodeDeleteBtn {
            width: 22px;
            height: 22px;
            border-radius: 9999px;
            border: 1px solid rgba(var(--danger-rgb), 0.65);
            background: rgba(var(--danger-rgb), 0.12);
            color: rgb(var(--danger-rgb));
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            padding: 0;
            margin-left: 6px;
            font-weight: 800;
            line-height: 1;
            opacity: 0.9;
          }

          .nodeDeleteBtn:hover {
            opacity: 1;
            background: rgba(var(--danger-rgb), 0.22);
            border-color: rgba(var(--danger-rgb), 0.9);
          }

        `}</style>
        <Seo title="Pipeline Builder" />

        <Row className="g-0" style={{ marginLeft: "-1.5rem", marginRight: "-1.5rem" }}>
          <Col xxl={12} xl={12}>
            <Card className="custom-card overflow-hidden" style={{ marginBottom: 0 }}>
              <Card.Header
                className="d-flex align-items-center justify-content-between"
                style={{ paddingTop: "0.75rem", paddingBottom: "0.75rem" }}
              >
                <div>
                  <p className="fw-medium fs-20 mb-0">Pipeline Builder</p>
                  <p className="fs-13 text-muted mb-0">
                    Drag nodes, connect edges, export Vector pipeline JSON.
                  </p>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-wave btn-primary pipelineHeaderBtn"
                    onClick={handleExport}
                    disabled={nodes.length === 0}
                  >
                    Export Pipeline
                  </button>
                  <button type="button" className="btn btn-wave btn-primary pipelineHeaderBtn" onClick={() => {}}>
                    Deploy
                  </button>
                </div>
              </Card.Header>

              <Card.Body style={{ padding: 0, position: "relative" }}>
                <button
                  type="button"
                  className="btn btn-wave btn-primary"
                  style={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    zIndex: 20,
                    width: 34,
                    height: 34,
                    padding: 0,
                  }}
                  onClick={() => setShowNodeLibrary(true)}
                  aria-label="Open node library"
                  title="Open node library"
                >
                  +
                </button>

                {connectError ? (
                  <div style={{ padding: 12 }}>
                    <Alert variant="danger" className="mb-0">
                      {connectError}
                    </Alert>
                  </div>
                ) : null}

                <div
                  ref={wrapperRef}
                  style={{
                    height: "calc(100vh - 180px)",
                    minHeight: 620,
                    background: "var(--default-background)",
                  }}
                >
                  <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    defaultEdgeOptions={defaultEdgeOptions}
                    onInit={(instance) => setRfInstance(instance)}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onConnect={handleConnect}
                    onNodesChange={(changes: NodeChange[]) => setNodes((prev) => applyNodeChanges(changes, prev))}
                    onEdgesChange={(changes: EdgeChange[]) => setEdges((prev) => applyEdgeChanges(changes, prev))}
                    fitView
                    fitViewOptions={{ maxZoom: 1, padding: 0.2 }}
                    style={{ background: "transparent" }}
                  >
                    <Background gap={16} size={1} color="rgba(255,255,255,0.05)" />
                    <Controls />
                  </ReactFlow>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Offcanvas
          id="offcanvasExample"
          show={showNodeLibrary}
          onHide={() => setShowNodeLibrary(false)}
          placement="end"
          backdrop={false}
          scroll
        >
          <Offcanvas.Header closeButton>
            <Offcanvas.Title>Node Library</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body>
            {(["source", "transform", "sink"] as NodeCategory[]).map((cat) => (
              <div key={cat} style={{ marginBottom: 18 }}>
                <div
                  style={{
                    fontWeight: 700,
                    marginBottom: 10,
                    textTransform: "capitalize",
                  }}
                >
                  {cat}
                </div>
                {registryByCategory[cat].map((typeId) => {
                  const def = nodeRegistry[typeId];
                  return (
                    <div
                      key={typeId}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("application/reactflow", typeId);
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      style={{
                        padding: 10,
                        borderRadius: 10,
                        marginBottom: 10,
                        border: "1px solid var(--default-border)",
                        background: "var(--default-body-bg-color)",
                        color: "var(--default-text-color)",
                        cursor: "grab",
                        userSelect: "none",
                      }}
                      title="Drag to canvas"
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 7,
                            border: "1px solid var(--default-border)",
                            background: "var(--form-control-bg)",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <i className={def.iconClass} style={{ fontSize: 17, lineHeight: 1 }} />
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 13, lineHeight: 1.2 }}>{def.defaultInstanceName}</div>
                          <div style={{ fontSize: 12, opacity: 0.85 }}>{def.category} / {def.vectorType}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            <div className="text-muted" style={{ marginTop: 6, fontSize: 12 }}>
              Drag a node from here onto the canvas to create pipeline steps.
            </div>
          </Offcanvas.Body>
        </Offcanvas>

        <Modal
          show={showExportModal}
          onHide={() => setShowExportModal(false)}
          centered
          size="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title>Pipeline Export</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {exportErrors.length > 0 ? (
              <Alert variant="danger">
                <div className="fw-bold mb-2">Fix these issues before exporting:</div>
                <ul className="mb-0">
                  {exportErrors.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </Alert>
            ) : null}

            {exportText ? (
              <>
                <Form.Control
                  as="textarea"
                  readOnly
                  rows={10}
                  value={exportText}
                  style={{ maxHeight: 420, overflowY: "auto" }}
                />
                <div className="d-flex gap-2 mt-2">
                  <Button variant="secondary" size="sm" onClick={copyExport}>
                    Copy
                  </Button>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => {
                      setExportErrors([]);
                      setExportText("");
                      setShowExportModal(false);
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </>
            ) : null}

            {!exportText && exportErrors.length === 0 ? (
              <div className="text-muted">Click Export JSON to generate the pipeline output.</div>
            ) : null}
          </Modal.Body>
        </Modal>
      </div>
    </RouteProtection>
  );
}

