"use client";

import React, { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { Card, Col, Form, Modal, Offcanvas, Row, Spinner } from "react-bootstrap";
import Seo from "@/shared/layouts-components/seo/seo";
import SpkTables from "@/shared/@spk-reusable-components/reusable-tables/spk-tables";
import SpkButton from "@/shared/@spk-reusable-components/reusable-uiElements/spk-buttons";
import { supabase } from "@/shared/lib/supabase";
import { useTenantContext } from "@/shared/contextapi/TenantContext";

type SchemaFieldType = "string" | "number" | "boolean" | "date";

interface SchemaRow {
  field: string;
  value: string;
  type: SchemaFieldType;
  label: string;
}

interface IntegrationInstanceRow {
  id: number;
  tenant_id: string;
  instance_name: string | null;
  name: string | null;
  status: string | null;
}

interface DatasetRow {
  id: number;
  name: string | null;
  description: string | null;
  tenant_id: string | null;
  instance_name: string | null;
  field_schema: unknown;
  query: string | null;
  created_at: string | null;
}

const emptySchemaRow = (): SchemaRow => ({
  field: "",
  value: "",
  type: "string",
  label: "",
});

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQ = !inQ;
    } else if (c === "," && !inQ) {
      out.push(cur.trim().replace(/^"|"$/g, ""));
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur.trim().replace(/^"|"$/g, ""));
  return out;
}

function isInstanceEnabled(status: string | null | undefined): boolean {
  const s = String(status ?? "").toLowerCase();
  return s === "enabled" || s === "enable" || s === "active" || s === "true";
}

function isFlatScalarValue(v: unknown): boolean {
  return v === null || ["string", "number", "boolean"].includes(typeof v);
}

/** Plain key–value object (CSV-derived), no `source` wrapper. */
function isFlatKeyValueSchemaObject(o: Record<string, unknown>): boolean {
  if ("source" in o) return false;
  const keys = Object.keys(o);
  if (keys.length === 0) return false;
  return keys.every((k) => isFlatScalarValue(o[k]));
}

/** Returns JSON for `field_schema`, or `null` when nothing was provided (both `field_schema` and `query` are optional). */
function buildFieldSchemaOrNull(
  mode: "manual" | "csv",
  rows: SchemaRow[],
  csvPairs: Record<string, string> | null
): Record<string, unknown> | null {
  if (mode === "csv" && csvPairs && Object.keys(csvPairs).length > 0) {
    return { ...csvPairs };
  }
  const fields = rows
    .filter((r) => r.field.trim() !== "")
    .map((r) => ({
      field: r.field.trim(),
      value: r.value,
      type: r.type,
      label: r.label.trim() || r.field.trim(),
    }));
  if (fields.length === 0) return null;
  return { source: "manual", fields };
}

const SCHEMA_TYPES: SchemaFieldType[] = ["string", "number", "boolean", "date"];

function formatDetailValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function hydrateFormFromFieldSchema(
  raw: unknown,
  setSchemaMode: (m: "manual" | "csv") => void,
  setSchemaRows: React.Dispatch<React.SetStateAction<SchemaRow[]>>,
  setCsvPairs: (p: Record<string, string> | null) => void,
  setCsvFileName: (s: string | null) => void
) {
  if (raw == null) {
    setSchemaMode("manual");
    setSchemaRows([emptySchemaRow()]);
    setCsvPairs(null);
    setCsvFileName(null);
    return;
  }
  if (typeof raw !== "object" || Array.isArray(raw)) {
    setSchemaMode("manual");
    setSchemaRows([emptySchemaRow()]);
    setCsvPairs(null);
    setCsvFileName(null);
    return;
  }
  const o = raw as Record<string, unknown>;
  if (o.source === "csv_key_value" && o.pairs && typeof o.pairs === "object" && !Array.isArray(o.pairs)) {
    setSchemaMode("csv");
    setCsvPairs({ ...(o.pairs as Record<string, string>) });
    setCsvFileName("(from dataset)");
    setSchemaRows([emptySchemaRow()]);
    return;
  }
  if (o.source === "manual" && Array.isArray(o.fields)) {
    setSchemaMode("manual");
    const fields = o.fields as Array<{ field?: string; value?: string; type?: string; label?: string }>;
    const rows: SchemaRow[] =
      fields.length > 0
        ? fields.map((f) => {
            const t = String(f.type ?? "string");
            const type = SCHEMA_TYPES.includes(t as SchemaFieldType) ? (t as SchemaFieldType) : "string";
            return {
              field: String(f.field ?? ""),
              value: String(f.value ?? ""),
              type,
              label: String(f.label ?? f.field ?? ""),
            };
          })
        : [emptySchemaRow()];
    setSchemaRows(rows);
    setCsvPairs(null);
    setCsvFileName(null);
    return;
  }
  if (isFlatKeyValueSchemaObject(o)) {
    const pairs: Record<string, string> = {};
    for (const k of Object.keys(o)) {
      const v = o[k];
      pairs[k] = v === null || v === undefined ? "" : String(v);
    }
    setSchemaMode("csv");
    setCsvPairs(pairs);
    setCsvFileName("(from dataset)");
    setSchemaRows([emptySchemaRow()]);
    return;
  }
  setSchemaMode("manual");
  setSchemaRows([emptySchemaRow()]);
  setCsvPairs(null);
  setCsvFileName(null);
}

const DatasetsPage: React.FC = () => {
  const { assignedTenants } = useTenantContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [rows, setRows] = useState<DatasetRow[]>([]);
  const [listLoading, setListLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<DatasetRow | null>(null);
  const [editInstanceNameSnapshot, setEditInstanceNameSnapshot] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string>("");
  const [instances, setInstances] = useState<IntegrationInstanceRow[]>([]);
  const [instancesLoading, setInstancesLoading] = useState(false);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>("");

  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [schemaMode, setSchemaMode] = useState<"manual" | "csv">("manual");
  const [schemaRows, setSchemaRows] = useState<SchemaRow[]>([emptySchemaRow()]);
  const [csvPairs, setCsvPairs] = useState<Record<string, string> | null>(null);
  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const [queryText, setQueryText] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchDatasets = useCallback(async () => {
    setListLoading(true);
    try {
      const { data, error } = await supabase
        .from("datasets")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Error fetching datasets:", error);
        setRows([]);
        return;
      }
      setRows((data as DatasetRow[]) || []);
    } catch (e) {
      console.error("Error fetching datasets:", e);
      setRows([]);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDatasets();
  }, [fetchDatasets]);

  useEffect(() => {
    if (!tenantId) {
      setInstances([]);
      setSelectedInstanceId("");
      return;
    }
    let cancelled = false;
    (async () => {
      setInstancesLoading(true);
      const { data, error } = await supabase
        .from("integration_instances")
        .select("id, tenant_id, instance_name, name, status")
        .eq("tenant_id", tenantId)
        .order("instance_name", { ascending: true });
      if (cancelled) return;
      if (error) {
        console.error("Error fetching integration instances:", error);
        setInstances([]);
      } else {
        const list = (data as IntegrationInstanceRow[]) || [];
        setInstances(list.filter((r) => isInstanceEnabled(r.status)));
      }
      setInstancesLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  useEffect(() => {
    if (!editInstanceNameSnapshot || !instances.length) return;
    const found = instances.find((inst) => {
      const label =
        [inst.name, inst.instance_name].filter(Boolean).join(" — ") || `Instance #${inst.id}`;
      return label === editInstanceNameSnapshot;
    });
    if (found) setSelectedInstanceId(String(found.id));
  }, [instances, editInstanceNameSnapshot]);

  const resetCreateForm = () => {
    setEditingId(null);
    setEditInstanceNameSnapshot(null);
    setTenantId("");
    setSelectedInstanceId("");
    setDisplayName("");
    setDescription("");
    setSchemaMode("manual");
    setSchemaRows([emptySchemaRow()]);
    setCsvPairs(null);
    setCsvFileName(null);
    setQueryText("");
    setFormError(null);
  };

  const openCreateModal = () => {
    resetCreateForm();
    setShowCreateModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setShowCreateModal(false);
    resetCreateForm();
  };

  const finishSaveAndClose = () => {
    setShowCreateModal(false);
    resetCreateForm();
  };

  const handleView = (row: DatasetRow) => {
    setSelectedRow(row);
    setViewOpen(true);
  };

  const handleEdit = (row: DatasetRow) => {
    setFormError(null);
    setEditingId(row.id);
    setEditInstanceNameSnapshot(row.instance_name);
    setTenantId(row.tenant_id?.trim() ?? "");
    setSelectedInstanceId("");
    setDisplayName(row.name ?? "");
    setDescription(row.description ?? "");
    setQueryText(row.query ?? "");
    hydrateFormFromFieldSchema(row.field_schema, setSchemaMode, setSchemaRows, setCsvPairs, setCsvFileName);
    setShowCreateModal(true);
  };

  const handleDelete = async (row: DatasetRow) => {
    if (!confirm(`Delete dataset "${row.name ?? row.id}"?`)) return;
    const { error } = await supabase.from("datasets").delete().eq("id", row.id);
    if (error) {
      console.error("Error deleting dataset:", error);
      return;
    }
    await fetchDatasets();
  };

  const handleCsvUpload = (file: File | null) => {
    setCsvPairs(null);
    setCsvFileName(null);
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
      if (lines.length < 2) {
        setFormError("CSV must have at least two rows: keys, then values.");
        return;
      }
      const keys = parseCsvLine(lines[0]);
      const vals = parseCsvLine(lines[1]);
      if (keys.length !== vals.length) {
        setFormError("CSV row 1 and row 2 must have the same number of columns.");
        return;
      }
      const pairs: Record<string, string> = {};
      keys.forEach((k, i) => {
        if (k) pairs[k] = vals[i] ?? "";
      });
      if (Object.keys(pairs).length === 0) {
        setFormError("No key-value pairs parsed from CSV.");
        return;
      }
      setFormError(null);
      setCsvPairs(pairs);
      setCsvFileName(file.name);
    };
    reader.readAsText(file);
  };

  const handleSaveDataset = async () => {
    setFormError(null);
    if (!displayName.trim()) {
      setFormError("Name is required.");
      return;
    }

    const instance = selectedInstanceId ? instances.find((i) => String(i.id) === selectedInstanceId) : undefined;
    const instanceNameLabel = instance
      ? [instance.name, instance.instance_name].filter(Boolean).join(" — ") || `Instance #${instance.id}`
      : editingId != null
        ? editInstanceNameSnapshot
        : null;

    const field_schema = buildFieldSchemaOrNull(schemaMode, schemaRows, csvPairs);
    const queryTrimmed = queryText.trim();

    const payload = {
      name: displayName.trim(),
      description: description.trim() || null,
      tenant_id: tenantId.trim() || null,
      instance_name: instanceNameLabel,
      field_schema,
      query: queryTrimmed || null,
    };

    setSaving(true);
    try {
      const { error } =
        editingId != null
          ? await supabase.from("datasets").update(payload).eq("id", editingId)
          : await supabase.from("datasets").insert(payload);
      if (error) {
        console.error("Error saving dataset:", error);
        setFormError(error.message || "Failed to save dataset.");
        return;
      }
      finishSaveAndClose();
      await fetchDatasets();
    } finally {
      setSaving(false);
    }
  };

  const filteredRows = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        String(r.name ?? "")
          .toLowerCase()
          .includes(q) ||
        String(r.description ?? "")
          .toLowerCase()
          .includes(q) ||
        String(r.instance_name ?? "")
          .toLowerCase()
          .includes(q)
    );
  }, [rows, searchTerm]);

  const addSchemaRow = () => setSchemaRows((prev) => [...prev, emptySchemaRow()]);
  const removeSchemaRow = (index: number) =>
    setSchemaRows((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  const updateSchemaRow = (index: number, patch: Partial<SchemaRow>) =>
    setSchemaRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));

  return (
    <Fragment>
      <Seo title="Datasets" />

      <Row className="g-0" style={{ marginLeft: "-1.5rem", marginRight: "-1.5rem" }}>
        <Col xl={12}>
          <Card className="custom-card" style={{ marginBottom: 0 }}>
            <Card.Header className="justify-content-between">
              <Card.Title>Datasets</Card.Title>
              <div className="d-flex align-items-center flex-wrap gap-2">
                <SpkButton Buttonvariant="primary" Customclass="btn" Buttontype="button" onClickfunc={openCreateModal}>
                  <i className="ri-add-line me-1 fw-medium align-middle"></i>
                  New Dataset
                </SpkButton>
                <div className="d-flex" role="search">
                  <Form.Control
                    className="me-2"
                    type="search"
                    placeholder="Search Dataset"
                    aria-label="Search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <SpkButton Buttonvariant="light" Customclass="btn" Buttontype="button">
                    Search
                  </SpkButton>
                </div>
              </div>
            </Card.Header>
          </Card>
        </Col>
      </Row>

      <Row className="g-0" style={{ marginLeft: "-1.5rem", marginRight: "-1.5rem" }}>
        <Col xl={12}>
          <Card className="custom-card overflow-hidden" style={{ marginBottom: 0 }}>
            <Card.Body className="p-0" style={{ minHeight: "90vh" }}>
              <div className="table-responsive" style={{ minHeight: "90vh" }}>
                {listLoading ? (
                  <div className="d-flex justify-content-center align-items-center p-5 gap-2">
                    <Spinner animation="border" size="sm" />
                    <span className="text-muted">Loading datasets…</span>
                  </div>
                ) : (
                  <SpkTables
                    tableClass="table text-nowrap"
                    header={[
                      { title: "Dataset Name" },
                      { title: "Description" },
                      { title: "Tenant ID" },
                      { title: "Instance" },
                      { title: "Created At" },
                      { title: "Actions" },
                    ]}
                  >
                    {filteredRows.length > 0 ? (
                      filteredRows.map((r) => (
                        <tr
                          key={r.id}
                          style={{ cursor: "pointer" }}
                          onClick={() => handleView(r)}
                        >
                          <td className="fw-medium text-primary">{r.name ?? "—"}</td>
                          <td className="text-muted text-break" style={{ maxWidth: "280px", whiteSpace: "normal" }}>
                            {r.description ?? "—"}
                          </td>
                          <td className="font-monospace small">{r.tenant_id ?? "—"}</td>
                          <td>{r.instance_name ?? "—"}</td>
                          <td>{r.created_at ? new Date(r.created_at).toLocaleString() : "—"}</td>
                          <td>
                            <div className="btn-list">
                              <SpkButton
                                Buttonvariant="primary-light"
                                Customclass="btn btn-sm btn-icon btn-wave waves-effect waves-light"
                                onClickfunc={(e) => {
                                  e?.stopPropagation?.();
                                  handleView(r);
                                }}
                              >
                                <i className="ri-eye-line"></i>
                              </SpkButton>
                              <SpkButton
                                Buttonvariant="secondary-light"
                                Customclass="btn btn-sm btn-icon btn-wave waves-effect waves-light"
                                onClickfunc={(e) => {
                                  e?.stopPropagation?.();
                                  handleEdit(r);
                                }}
                              >
                                <i className="ri-edit-line"></i>
                              </SpkButton>
                              <SpkButton
                                Buttonvariant="danger-light"
                                Customclass="btn btn-sm btn-icon btn-wave waves-effect waves-light"
                                onClickfunc={(e) => {
                                  e?.stopPropagation?.();
                                  handleDelete(r);
                                }}
                              >
                                <i className="ri-delete-bin-line"></i>
                              </SpkButton>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="text-center" colSpan={6}>
                          No data found
                        </td>
                      </tr>
                    )}
                  </SpkTables>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Offcanvas show={viewOpen} onHide={() => setViewOpen(false)} placement="end">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Dataset details</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="dataset-details-offcanvas">
          {selectedRow ? (
            <div className="d-flex flex-column gap-2">
              {Object.entries(selectedRow).map(([k, v]) => (
                <div key={k} className="border rounded p-2">
                  <div className="text-muted small">{k}</div>
                  <pre
                    className="fw-medium text-break mb-0 mt-1"
                    style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                  >
                    {formatDetailValue(v)}
                  </pre>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted">No row selected.</div>
          )}
        </Offcanvas.Body>
      </Offcanvas>

      <Modal
        show={showCreateModal}
        onHide={closeModal}
        size="xl"
        centered
        scrollable
        dialogClassName="datasets-create-modal-dialog"
      >
        <Modal.Header closeButton>
          <Modal.Title>{editingId != null ? "Edit dataset" : "New dataset"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {formError && <div className="alert alert-danger py-2 small mb-3">{formError}</div>}

          <Row className="g-3 mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-medium fs-13">Tenant</Form.Label>
                <Form.Select
                  value={tenantId}
                  onChange={(e) => {
                    setTenantId(e.target.value);
                    setSelectedInstanceId("");
                    setEditInstanceNameSnapshot(null);
                  }}
                  disabled={saving}
                >
                  <option value="">Select Tenant</option>
                  {assignedTenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name || t.id}
                    </option>
                  ))}
                </Form.Select>
                {assignedTenants.length === 0 && (
                  <Form.Text className="text-muted">No tenants assigned; tenant will be saved as empty.</Form.Text>
                )}
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-medium fs-13">Integration instance (enabled)</Form.Label>
                <Form.Select
                  value={selectedInstanceId}
                  onChange={(e) => {
                    setSelectedInstanceId(e.target.value);
                    if (!e.target.value) setEditInstanceNameSnapshot(null);
                  }}
                  disabled={saving || !tenantId || instancesLoading}
                >
                  <option value="">{instancesLoading ? "Loading…" : "Select Instance"}</option>
                  {instances.map((inst) => (
                    <option key={inst.id} value={String(inst.id)}>
                      {[inst.name, inst.instance_name].filter(Boolean).join(" — ") || `Instance #${inst.id}`}
                    </option>
                  ))}
                </Form.Select>
                {tenantId && !instancesLoading && instances.length === 0 && (
                  <Form.Text className="text-muted">No enabled instances for this tenant.</Form.Text>
                )}
              </Form.Group>
            </Col>
          </Row>

          <Row className="g-3 mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-medium fs-13">Name</Form.Label>
                <Form.Control
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Dataset name"
                  disabled={saving}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-medium fs-13">Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description"
                  disabled={saving}
                />
              </Form.Group>
            </Col>
          </Row>

          <Row className="g-3">
            <Col lg={6}>
              <div className="border rounded p-3 h-100">
                <div className="fw-semibold mb-2 fs-14">Field schema (optional)</div>
                <div className="d-flex flex-wrap gap-3 mb-3 fs-13">
                  <Form.Check
                    type="radio"
                    id="schema-manual"
                    name="schemaMode"
                    label="Manual rows"
                    checked={schemaMode === "manual"}
                    onChange={() => setSchemaMode("manual")}
                    disabled={saving}
                  />
                  <Form.Check
                    type="radio"
                    id="schema-csv"
                    name="schemaMode"
                    label="CSV"
                    checked={schemaMode === "csv"}
                    onChange={() => setSchemaMode("csv")}
                    disabled={saving}
                  />
                </div>

                {schemaMode === "manual" ? (
                  <div className="d-flex flex-column gap-2">
                    <div className="row g-2 small text-muted fw-medium d-none d-md-flex px-1">
                      <Col md={3}>Field</Col>
                      <Col md={3}>Value</Col>
                      <Col md={2}>Type</Col>
                      <Col md={3}>Label</Col>
                      <Col md={1} />
                    </div>
                    {schemaRows.map((row, index) => (
                      <div key={index} className="row g-2 align-items-end">
                        <Col md={3}>
                          <Form.Control
                            size="sm"
                            placeholder="field"
                            value={row.field}
                            onChange={(e) => updateSchemaRow(index, { field: e.target.value })}
                            disabled={saving}
                          />
                        </Col>
                        <Col md={3}>
                          <Form.Control
                            size="sm"
                            placeholder="value"
                            value={row.value}
                            onChange={(e) => updateSchemaRow(index, { value: e.target.value })}
                            disabled={saving}
                          />
                        </Col>
                        <Col md={2}>
                          <Form.Select
                            size="sm"
                            value={row.type}
                            onChange={(e) => updateSchemaRow(index, { type: e.target.value as SchemaFieldType })}
                            disabled={saving}
                          >
                            <option value="string">string</option>
                            <option value="number">number</option>
                            <option value="boolean">boolean</option>
                            <option value="date">date</option>
                          </Form.Select>
                        </Col>
                        <Col md={3}>
                          <Form.Control
                            size="sm"
                            placeholder="label"
                            value={row.label}
                            onChange={(e) => updateSchemaRow(index, { label: e.target.value })}
                            disabled={saving}
                          />
                        </Col>
                        <Col md={1} className="d-flex justify-content-end">
                          <SpkButton
                            Buttonvariant="light"
                            Customclass="btn btn-sm btn-icon"
                            Buttontype="button"
                            onClickfunc={() => removeSchemaRow(index)}
                            Disabled={saving || schemaRows.length <= 1}
                          >
                            <i className="ri-delete-bin-line" />
                          </SpkButton>
                        </Col>
                      </div>
                    ))}
                    <div>
                      <SpkButton
                        Buttonvariant="primary-light"
                        Customclass="btn btn-sm"
                        Buttontype="button"
                        onClickfunc={addSchemaRow}
                        Disabled={saving}
                      >
                        <i className="ri-add-line me-1" />
                        Add row
                      </SpkButton>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Form.Label className="fw-medium fs-13">CSV file</Form.Label>
                    <Form.Control
                      type="file"
                      accept=".csv,text/csv"
                      disabled={saving}
                      onChange={(e) =>
                        handleCsvUpload((e.target as HTMLInputElement).files?.[0] ?? null)
                      }
                    />
                    <Form.Text className="d-block">
                      Saved as a plain JSON object in <code className="small">field_schema</code>.
                    </Form.Text>
                    {csvFileName && csvPairs && (
                      <div className="mt-2 small text-success">
                        Loaded {csvFileName} ({Object.keys(csvPairs).length} keys)
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Col>
            <Col lg={6}>
              <div className="border rounded p-3 h-100 d-flex flex-column">
                <Form.Label className="fw-semibold fs-14 mb-2">Query (optional)</Form.Label>
                <Form.Control
                  as="textarea"
                  className="font-monospace flex-grow-1"
                  style={{ minHeight: "280px" }}
                  value={queryText}
                  onChange={(e) => setQueryText(e.target.value)}
                  placeholder="Enter SQL or query text for reference…"
                  disabled={saving}
                />
                <Form.Text className="mt-1">
                  You can save with only schema, only query, both, or neither besides the name.
                </Form.Text>
              </div>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <SpkButton Buttonvariant="light" Buttontype="button" onClickfunc={closeModal} Disabled={saving}>
            Cancel
          </SpkButton>
          <SpkButton Buttonvariant="primary" Buttontype="button" onClickfunc={handleSaveDataset} Disabled={saving}>
            {saving ? "Saving…" : editingId != null ? "Update dataset" : "Save dataset"}
          </SpkButton>
        </Modal.Footer>
      </Modal>

      <style jsx global>{`
        .datasets-create-modal-dialog {
          max-width: min(96vw, 1200px);
        }
        .dataset-details-offcanvas {
          font-size: 0.98rem;
          line-height: 1.45;
        }
        .dataset-details-offcanvas .small {
          font-size: 0.88rem !important;
        }
      `}</style>
    </Fragment>
  );
};

export default DatasetsPage;
