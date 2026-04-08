"use client"
import React, { Fragment, useCallback, useEffect, useState } from "react";
import { Card, Col, Dropdown, Form, Modal, Offcanvas, Row, Spinner } from "react-bootstrap";
import SpkTables from "@/shared/@spk-reusable-components/reusable-tables/spk-tables";
import SpkButton from "@/shared/@spk-reusable-components/reusable-uiElements/spk-buttons";
import SpkDropdown from "@/shared/@spk-reusable-components/reusable-uiElements/spk-dropdown";
import Seo from "@/shared/layouts-components/seo/seo";
import { supabase } from "@/shared/lib/supabase";
import { useTenantContext } from "@/shared/contextapi/TenantContext";

interface ResponseToolRow {
  id: number;
  instance_id?: number | null;
  type?: string | null;
  tool_name?: string | null;
  instance_name?: string | null;
  status?: string | null;
  allowed_role?: string | null;
  approval_required?: boolean | null;
  severity?: string | null;
  scope?: string | null;
  tenant_id?: string | null;
  shared_tenants?: string[] | null;
  [key: string]: unknown;
}

interface ToolFieldRequirement {
  id: string;
  type: "string" | "boolean" | "string_list" | "select" | "number";
  label: string;
  required?: boolean;
  default?: unknown;
  options?: { label: string; value: string }[];
  required_when?: { all?: Array<{ field: string; equals: unknown }> };
  help?: string;
  min?: number;
  max?: number;
  placeholder?: string;
}

interface MarketplaceTool {
  name: string;
  type?: string;
  description?: string;
  when_enabled?: { fields: ToolFieldRequirement[] };
}

const getToolFieldList = (tool: MarketplaceTool): ToolFieldRequirement[] => tool.when_enabled?.fields ?? [];
const isToolFieldRequiredNow = (field: ToolFieldRequirement, values: Record<string, unknown>) => {
  if (!shouldShowToolField(field, values)) return false;
  if (field.required === true) return true;
  if (field.required_when?.all?.length) return true;
  return false;
};
const getRequiredToolFields = (tool: MarketplaceTool, values: Record<string, unknown>): ToolFieldRequirement[] =>
  getToolFieldList(tool).filter((field) => isToolFieldRequiredNow(field, values));
const shouldShowToolField = (field: ToolFieldRequirement, values: Record<string, unknown>) => {
  const cond = field.required_when?.all;
  if (!cond?.length) return true;
  return cond.every((c) => values[c.field] === c.equals);
};
const initEmptyToolConfig = (tool: MarketplaceTool): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  for (const f of getToolFieldList(tool)) {
    if (f.default !== undefined) out[f.id] = f.default;
    else if (f.type === "boolean") out[f.id] = false;
    else out[f.id] = "";
  }
  return out;
};

const ResponseContext: React.FC = () => {
  const { assignedTenants, selectedTenantIds } = useTenantContext();
  const [responseTools, setResponseTools] = useState<ResponseToolRow[]>([]);
  const [loadingTools, setLoadingTools] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<ResponseToolRow | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editTool, setEditTool] = useState<ResponseToolRow | null>(null);
  const [editToolDef, setEditToolDef] = useState<MarketplaceTool | null>(null);
  const [editForm, setEditForm] = useState<Record<string, unknown>>({});
  const [editSaving, setEditSaving] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"new" | "tool_name" | "instance_name">("new");

  const fetchResponseTools = useCallback(async () => {
    try {
      setLoadingTools(true);
      const { data, error } = await supabase
        .from("instance_tools")
        .select("id,instance_id,tool_name,type,instance_name,status,allowed_role,approval_required,severity,scope,tenant_id,shared_tenants")
        .eq("type", "response")
        .order("id", { ascending: false });

      if (error) {
        console.error("Error fetching response tools:", error);
        setResponseTools([]);
        return;
      }
      const rows = (data as ResponseToolRow[]) || [];
      let allowedTenantIds: string[] = [];
      if (selectedTenantIds === "all") {
        allowedTenantIds = (assignedTenants || []).map((t) => t.id);
      } else if (Array.isArray(selectedTenantIds)) {
        allowedTenantIds = selectedTenantIds;
      } else if (typeof selectedTenantIds === "string" && selectedTenantIds) {
        allowedTenantIds = [selectedTenantIds];
      }

      if (!allowedTenantIds.length) {
        setResponseTools([]);
        return;
      }

      const filteredByTenant = rows.filter((row) => {
        const ownedMatch = !!row.tenant_id && allowedTenantIds.includes(row.tenant_id);
        const sharedTenants = Array.isArray(row.shared_tenants) ? row.shared_tenants : [];
        const sharedMatch =
          String(row.scope || "").toLowerCase() === "shared" &&
          sharedTenants.some((tid) => allowedTenantIds.includes(String(tid)));
        return ownedMatch || sharedMatch;
      });

      setResponseTools(filteredByTenant);
    } catch (err) {
      console.error("Error fetching response tools:", err);
      setResponseTools([]);
    } finally {
      setLoadingTools(false);
    }
  }, [assignedTenants, selectedTenantIds]);

  const setEditFormValue = (fieldId: string, value: unknown) => {
    setEditForm((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleOpenEdit = async (toolRow: ResponseToolRow) => {
    try {
      setEditLoading(true);
      setEditToolDef(null);
      setEditTool(null);
      setEditForm({});

      const { data: rowData, error: rowError } = await supabase
        .from("instance_tools")
        .select("*")
        .eq("id", toolRow.id)
        .single();
      if (rowError || !rowData) {
        console.error("Error fetching tool row for edit:", rowError);
        return;
      }
      const fullRow = rowData as ResponseToolRow;
      setEditTool(fullRow);

      let toolDef: MarketplaceTool | null = null;
      if (fullRow.instance_id) {
        const { data: inst, error: instErr } = await supabase
          .from("integration_instances")
          .select("integration_id")
          .eq("id", fullRow.instance_id)
          .single();
        if (!instErr && inst?.integration_id) {
          const { data: market, error: marketErr } = await supabase
            .from("marketplace_integrations")
            .select("tools")
            .eq("id", inst.integration_id)
            .single();
          if (!marketErr && Array.isArray(market?.tools)) {
            toolDef = (market.tools as MarketplaceTool[]).find((t) => t.name === fullRow.tool_name) || null;
          }
        }
      }

      setEditToolDef(toolDef);
      const dynamic = toolDef ? { ...initEmptyToolConfig(toolDef) } : {};
      if (toolDef) {
        for (const f of getToolFieldList(toolDef)) {
          if (fullRow[f.id] !== undefined && fullRow[f.id] !== null) dynamic[f.id] = fullRow[f.id];
        }
      }
      setEditForm(dynamic);
      setEditOpen(true);
    } finally {
      setEditLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editTool) return;
    try {
      setEditSaving(true);
      const payload: Record<string, unknown> = {};
      if (editToolDef) {
        const requiredFields = getRequiredToolFields(editToolDef, editForm);
        for (const f of requiredFields) {
          payload[f.id] = editForm[f.id] ?? null;
        }
      }
      const { error } = await supabase.from("instance_tools").update(payload).eq("id", editTool.id);
      if (error) {
        console.error("Error updating instance_tools row:", error);
        return;
      }
      setEditOpen(false);
      await fetchResponseTools();
    } finally {
      setEditSaving(false);
    }
  };

  useEffect(() => {
    fetchResponseTools();
  }, [fetchResponseTools]);

  const filteredTools = responseTools
    .filter((tool) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        String(tool.tool_name || "").toLowerCase().includes(q) ||
        String(tool.instance_name || "").toLowerCase().includes(q) ||
        String(tool.status || "").toLowerCase().includes(q) ||
        String(tool.allowed_role || "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === "new") return (b.id || 0) - (a.id || 0);
      if (sortBy === "tool_name") return String(a.tool_name || "").localeCompare(String(b.tool_name || ""));
      return String(a.instance_name || "").localeCompare(String(b.instance_name || ""));
    });

  return (
    <Fragment>
      <Seo title="Response Context" />
      {/* Response Tools Table */}
      <Row className="g-0" style={{ marginLeft: "-1.5rem", marginRight: "-1.5rem" }}>
        <Col xxl={12} xl={12}>
          <Card className="custom-card" style={{ marginBottom: 0 }}>
              <Card.Header className="justify-content-between">
                <Card.Title>
                  Response Context
                </Card.Title>
                <div className="d-flex flex-wrap gap-2">
                  <div>
                    <Form.Control
                      className="form-control-sm"
                      type="text"
                      placeholder="Search Here"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <SpkDropdown
                    toggleas='a'
                    Customtoggleclass="btn btn-primary btn-sm btn-wave waves-effect waves-light no-caret"
                    Toggletext="Sort By"
                    Icon={true}
                    IconClass="ri-arrow-down-s-line align-middle ms-1 d-inline-block"
                  >
                    <li><Dropdown.Item onClick={() => setSortBy("new")}>New</Dropdown.Item></li>
                    <li><Dropdown.Item onClick={() => setSortBy("tool_name")}>Tool Name</Dropdown.Item></li>
                    <li><Dropdown.Item onClick={() => setSortBy("instance_name")}>Instance Name</Dropdown.Item></li>
                  </SpkDropdown>
                </div>
              </Card.Header>

              <Card.Body className="p-0" style={{ minHeight: "90vh" }}>
                {loadingTools ? (
                  <div className="d-flex justify-content-center align-items-center p-4">
                    <Spinner animation="border" variant="primary" />
                    <span className="ms-2">Loading response tools...</span>
                  </div>
                ) : (
                  <div className="table-responsive" style={{ overflowX: "auto", minWidth: "100%", minHeight: "74vh" }}>
                    <SpkTables
                      tableClass="table text-nowrap"
                      header={[
                        { title: "Tool Name" },
                        { title: "Instance Name" },
                        { title: "Status" },
                        { title: "Allowed Role" },
                        { title: "Approval Required" },
                        { title: "Severity" },
                        { title: "Scope" },
                        { title: "Tenant ID" },
                        { title: "Action" },
                      ]}
                    >
                        {filteredTools.length > 0 ? (
                        filteredTools.map((tool) => (
                          <tr
                            key={tool.id}
                            style={{ cursor: "pointer" }}
                            onClick={() => {
                              setSelectedTool(tool);
                              setDetailsOpen(true);
                            }}
                          >
                            <td className="fw-medium text-primary">{tool.tool_name || "-"}</td>
                            <td>{tool.instance_name || "-"}</td>
                            <td>{tool.status || "-"}</td>
                            <td>{tool.allowed_role || "-"}</td>
                            <td>{tool.approval_required === true ? "Yes" : "No"}</td>
                            <td>{tool.severity || "-"}</td>
                            <td>{tool.scope || "-"}</td>
                            <td>{tool.tenant_id || "-"}</td>
                            <td className="text-end">
                              <div className="btn-list d-flex justify-content-end">
                                <SpkButton
                                  Buttontype="button"
                                  Buttonvariant="primary"
                                  Customclass="btn btn-sm btn-icon"
                                  onClickfunc={(e) => {
                                    e?.stopPropagation?.();
                                    setSelectedTool(tool);
                                    setDetailsOpen(true);
                                  }}
                                >
                                  <i className="ri-eye-line"></i>
                                </SpkButton>
                                <SpkButton
                                  Buttontype="button"
                                  Buttonvariant="secondary-light"
                                  Customclass="btn btn-sm btn-icon"
                                  onClickfunc={(e) => {
                                    e?.stopPropagation?.();
                                    handleOpenEdit(tool);
                                  }}
                                  Disabled={editLoading}
                                >
                                  <i className="ri-edit-line"></i>
                                </SpkButton>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={9} className="text-center py-4">
                            <div className="text-muted">
                              <i className="ri-inbox-line fs-48 mb-3 d-block"></i>
                              No response tools found
                            </div>
                          </td>
                        </tr>
                      )}
                    </SpkTables>
                  </div>
                )}
              </Card.Body>
          </Card>
        </Col>
      </Row>

      <Offcanvas
        show={detailsOpen}
        onHide={() => setDetailsOpen(false)}
        placement="end"
        className="response-tool-details-offcanvas"
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Response Tool Details</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          {selectedTool ? (
            <div className="d-flex flex-column gap-2">
              {Object.entries(selectedTool).map(([key, value]) => (
                <div key={key} className="border rounded p-2">
                  <div className="text-muted small">{key}</div>
                  <div className="fw-medium text-break">
                    {value === null || value === undefined || value === "" ? "-" : String(value)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted">No details selected.</div>
          )}
        </Offcanvas.Body>
      </Offcanvas>

      <Modal show={editOpen} onHide={() => setEditOpen(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Response Tool Context</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {!editTool ? (
            <div className="text-muted">No tool selected.</div>
          ) : !editToolDef ? (
            <div className="text-muted">No schema found for this tool in marketplace integrations.</div>
          ) : (
            <Row>
              {getRequiredToolFields(editToolDef, editForm).length > 0 && (
                <Col md={12} className="mb-2">
                  <div className="fw-semibold text-muted">Required Tool Parameters</div>
                </Col>
              )}

              {getRequiredToolFields(editToolDef, editForm).map((field) => {
                  if (!shouldShowToolField(field, editForm)) return null;
                  const v = editForm[field.id];
                  return (
                    <Col md={6} key={field.id} className="mb-3">
                      <Form.Group>
                        <Form.Label>{field.label}</Form.Label>
                        {field.type === "boolean" ? (
                          <Form.Check
                            type="switch"
                            checked={v === true}
                            onChange={(e) => setEditFormValue(field.id, e.target.checked)}
                          />
                        ) : field.type === "select" ? (
                          <Form.Select value={v == null ? "" : String(v)} onChange={(e) => setEditFormValue(field.id, e.target.value)}>
                            <option value="">Select {field.label}</option>
                            {field.options?.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </Form.Select>
                        ) : field.type === "string_list" ? (
                          <Form.Control
                            as="textarea"
                            rows={2}
                            value={v == null ? "" : String(v)}
                            placeholder={field.placeholder || field.help}
                            onChange={(e) => setEditFormValue(field.id, e.target.value)}
                          />
                        ) : (
                          <Form.Control
                            type={field.type === "number" ? "number" : "text"}
                            value={v == null ? "" : String(v)}
                            min={field.min}
                            max={field.max}
                            placeholder={field.placeholder}
                            onChange={(e) =>
                              setEditFormValue(field.id, field.type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value)
                            }
                          />
                        )}
                        {field.help && <Form.Text className="text-muted">{field.help}</Form.Text>}
                      </Form.Group>
                    </Col>
                  );
                })}
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <SpkButton Buttonvariant="light" Buttontype="button" onClickfunc={() => setEditOpen(false)}>
            Cancel
          </SpkButton>
          <SpkButton Buttonvariant="primary" Buttontype="button" onClickfunc={handleSaveEdit} Disabled={editSaving || !editTool}>
            {editSaving ? "Saving..." : "Save"}
          </SpkButton>
        </Modal.Footer>
      </Modal>
    </Fragment>
  );
};

export default ResponseContext;

