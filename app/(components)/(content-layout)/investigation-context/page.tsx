"use client"
import SpkTables from "@/shared/@spk-reusable-components/reusable-tables/spk-tables";
import SpkButton from "@/shared/@spk-reusable-components/reusable-uiElements/spk-buttons";
import SpkDropdown from "@/shared/@spk-reusable-components/reusable-uiElements/spk-dropdown";
import Seo from "@/shared/layouts-components/seo/seo";
import { supabase } from "@/shared/lib/supabase";
import React, { Fragment, useEffect, useMemo, useState } from "react";
import { Card, Col, Dropdown, Form, Modal, Offcanvas, Row, Spinner } from "react-bootstrap";

interface InvestigationContextProps { }

interface InvestigationContextRow {
    id: number;
    [key: string]: unknown;
}

type ScopeKey = "policy" | "users" | "assets" | "domains" | "urls" | "hashes";
type SuggestionEntry = {
    suggestion_type: string;
    valid_until: string | "permanent";
    permanent: boolean;
    suggestion_text: string;
};
type SuggestionOption = {
    scopeType: ScopeKey;
    scopeValue: string;
    entry: SuggestionEntry;
};
type SuggestionMap = Record<string, Record<string, SuggestionEntry>>;

const formatToIsoSeconds = (value: unknown): string => {
    if (value === null || value === undefined || value === "") return "-";
    const raw = String(value);
    const date = new Date(raw);
    if (isNaN(date.getTime())) return raw;
    return date.toISOString().slice(0, 19);
};

const formatDetailValue = (value: unknown): string => {
    if (value === null || value === undefined || value === "") return "-";
    if (typeof value === "object") {
        try {
            return JSON.stringify(value, null, 2);
        } catch {
            return String(value);
        }
    }
    return String(value);
};

const isSuggestionMap = (value: unknown): value is SuggestionMap => {
    return !!value && typeof value === "object" && !Array.isArray(value);
};

const SCOPE_KEYS: ScopeKey[] = ["policy", "users", "assets", "domains", "urls", "hashes"];

const normalizeSuggestionTypeForUi = (s: string | null | undefined): string => {
    if (!s) return "Genuine activity";
    const t = s.toLowerCase();
    if (t === "security_testing") return "Security Testing";
    if (t === "genuine_activity") return "Genuine activity";
    return s.replace(/_/g, " ");
};

const InvestigationContext: React.FC<InvestigationContextProps> = () => {
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [sortBy, setSortBy] = useState<"new" | "policy_name" | "creation_time">("new");
    const [rows, setRows] = useState<InvestigationContextRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewOpen, setViewOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [selectedRow, setSelectedRow] = useState<InvestigationContextRow | null>(null);
    const [editData, setEditData] = useState<Record<string, unknown>>({});
    const [saving, setSaving] = useState(false);
    const [suggestionOptions, setSuggestionOptions] = useState<SuggestionOption[]>([]);
    const [selectedSuggestionKey, setSelectedSuggestionKey] = useState<string>("");
    const [aiEditForm, setAiEditForm] = useState({
        suppressionCountPerDay: 25,
        scopeType: "policy" as ScopeKey,
        scopeValue: "",
        suggestionType: "Genuine activity",
        validUntilDate: new Date().toISOString().slice(0, 10),
        permanent: false,
        suggestionText: "",
    });

    const fetchInvestigationContext = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("investigation_context")
                .select("*")
                .order("id", { ascending: false });
            if (error) {
                console.error("Error fetching investigation_context:", error);
                setRows([]);
                return;
            }
            setRows((data as InvestigationContextRow[]) || []);
        } catch (err) {
            console.error("Error fetching investigation_context:", err);
            setRows([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvestigationContext();
    }, []);

    const filteredRows = useMemo(() => {
        if (!searchTerm.trim()) return rows;
        const q = searchTerm.toLowerCase();
        return rows.filter((row) =>
            Object.values(row).some((v) => String(v ?? "").toLowerCase().includes(q))
        );
    }, [rows, searchTerm]);

    const sortedRows = useMemo(() => {
        const list = [...filteredRows];
        if (sortBy === "new") {
            return list.sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));
        }
        if (sortBy === "policy_name") {
            return list.sort((a, b) => getPolicyName(a).localeCompare(getPolicyName(b)));
        }
        return list.sort((a, b) => getCreationTime(b).localeCompare(getCreationTime(a)));
    }, [filteredRows, sortBy]);

    const handleView = (row: InvestigationContextRow) => {
        setSelectedRow(row);
        setViewOpen(true);
    };

    const handleEdit = (row: InvestigationContextRow) => {
        setSelectedRow(row);

        const suggestion = row.suggestion && typeof row.suggestion === "object"
            ? (row.suggestion as Record<string, Record<string, SuggestionEntry>>)
            : {};
        const options: SuggestionOption[] = [];
        for (const k of SCOPE_KEYS) {
            const bucket = suggestion[k];
            if (!bucket || typeof bucket !== "object") continue;
            Object.entries(bucket).forEach(([scopeValue, entry]) => {
                if (entry && typeof entry === "object") {
                    options.push({ scopeType: k, scopeValue, entry });
                }
            });
        }
        setSuggestionOptions(options);
        const first = options[0] || null;
        const scopeType: ScopeKey = first?.scopeType || "policy";
        const scopeValue = first?.scopeValue || String(row.policy_name ?? "");
        const entry: SuggestionEntry | null = first?.entry || null;
        setSelectedSuggestionKey(first ? `${first.scopeType}::${first.scopeValue}` : "");

        const validUntilDate =
            entry && !entry.permanent && entry.valid_until && entry.valid_until !== "permanent"
                ? new Date(entry.valid_until).toISOString().slice(0, 10)
                : new Date().toISOString().slice(0, 10);

        setAiEditForm({
            suppressionCountPerDay: Number(row.suppression_count ?? 25),
            scopeType,
            scopeValue,
            suggestionType: normalizeSuggestionTypeForUi(entry?.suggestion_type),
            validUntilDate,
            permanent: entry?.permanent === true,
            suggestionText: entry?.suggestion_text ?? "",
        });

        const next: Record<string, unknown> = { ...row };
        setEditData(next);
        setEditOpen(true);
    };

    const handleSuggestionOptionChange = (compoundKey: string) => {
        setSelectedSuggestionKey(compoundKey);
        const [scopeTypeRaw, ...rest] = compoundKey.split("::");
        const scopeValue = rest.join("::");
        const scopeType = (SCOPE_KEYS.includes(scopeTypeRaw as ScopeKey) ? scopeTypeRaw : "policy") as ScopeKey;
        const selected = suggestionOptions.find((o) => o.scopeType === scopeType && o.scopeValue === scopeValue);
        if (!selected) return;
        const validUntilDate =
            !selected.entry.permanent && selected.entry.valid_until && selected.entry.valid_until !== "permanent"
                ? new Date(selected.entry.valid_until).toISOString().slice(0, 10)
                : new Date().toISOString().slice(0, 10);
        setAiEditForm((prev) => ({
            ...prev,
            scopeType: selected.scopeType,
            scopeValue: selected.scopeValue,
            suggestionType: normalizeSuggestionTypeForUi(selected.entry.suggestion_type),
            validUntilDate,
            permanent: selected.entry.permanent === true,
            suggestionText: selected.entry.suggestion_text ?? "",
        }));
    };

    const handleDelete = async (row: InvestigationContextRow) => {
        if (!confirm(`Delete investigation context #${row.id}?`)) return;
        const { error } = await supabase.from("investigation_context").delete().eq("id", row.id);
        if (error) {
            console.error("Error deleting investigation_context row:", error);
            return;
        }
        await fetchInvestigationContext();
    };

    const handleSaveEdit = async () => {
        if (!selectedRow) return;
        try {
            setSaving(true);
            const suggestionType = aiEditForm.suggestionType.replace(/\s+/g, "_").toLowerCase();
            const validUntil =
                aiEditForm.permanent
                    ? "permanent"
                    : new Date(aiEditForm.validUntilDate || new Date().toISOString().slice(0, 10)).toISOString();
            const nextEntry: SuggestionEntry = {
                suggestion_type: suggestionType,
                valid_until: validUntil,
                permanent: aiEditForm.permanent,
                suggestion_text: aiEditForm.suggestionText,
            };

            const existingSuggestion =
                editData.suggestion && typeof editData.suggestion === "object"
                    ? (editData.suggestion as Record<string, Record<string, SuggestionEntry>>)
                    : {};
            const nextSuggestion = { ...existingSuggestion };
            if (selectedSuggestionKey) {
                const [origScopeTypeRaw, ...rest] = selectedSuggestionKey.split("::");
                const origScopeValue = rest.join("::");
                const origScopeType = (SCOPE_KEYS.includes(origScopeTypeRaw as ScopeKey) ? origScopeTypeRaw : "policy") as ScopeKey;
                const changedTarget = origScopeType !== aiEditForm.scopeType || origScopeValue !== aiEditForm.scopeValue;
                if (changedTarget && nextSuggestion[origScopeType]) {
                    const { [origScopeValue]: _removed, ...remaining } = nextSuggestion[origScopeType];
                    nextSuggestion[origScopeType] = remaining;
                }
            }
            if (!nextSuggestion[aiEditForm.scopeType]) nextSuggestion[aiEditForm.scopeType] = {};
            nextSuggestion[aiEditForm.scopeType] = {
                ...nextSuggestion[aiEditForm.scopeType],
                [aiEditForm.scopeValue || String(selectedRow.policy_name ?? "")]: nextEntry,
            };

            const { error } = await supabase
                .from("investigation_context")
                .update({
                    suppression_count: aiEditForm.suppressionCountPerDay,
                    suggestion: nextSuggestion,
                })
                .eq("id", selectedRow.id);
            if (error) {
                console.error("Error updating investigation_context:", error);
                return;
            }
            setEditOpen(false);
            setSelectedRow(null);
            await fetchInvestigationContext();
        } finally {
            setSaving(false);
        }
    };

    const headerColumns = [
        { title: "Creation Time" },
        { title: "Policy Name" },
        { title: "Suppression Count" },
        { title: "Created By" },
        { title: "Valid Until" },
        { title: "Status" },
        { title: "Actions" },
    ];

    const getCreationTime = (row: InvestigationContextRow) =>
        formatToIsoSeconds(row.created_at ?? row.creation_time ?? "-");
    const getPolicyName = (row: InvestigationContextRow) =>
        String(row.policy_name ?? row.scope_value ?? row.name ?? "-");
    const getSuppressionCount = (row: InvestigationContextRow) =>
        String(row.suppression_count_per_day ?? row.suppression_count ?? row.count ?? "-");
    const getCreatedBy = (row: InvestigationContextRow) =>
        String(row.created_by ?? row.author ?? row.user_name ?? "-");
    const getValidUntil = (row: InvestigationContextRow) =>
        String(row.valid_until ?? row.valid_until_date ?? "-");
    const getStatus = (row: InvestigationContextRow) =>
        String(row.status ?? "-");

    const isStatusOn = (row: InvestigationContextRow) => {
        const s = String(row.status ?? "").toLowerCase();
        return s === "enabled" || s === "active" || s === "true";
    };

    const handleToggleStatus = async (row: InvestigationContextRow) => {
        const nextStatus = isStatusOn(row) ? "disabled" : "enabled";
        const prevStatus = row.status;
        // Optimistic local update to avoid table reflow/flicker
        setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, status: nextStatus } : r)));
        const { error } = await supabase
            .from("investigation_context")
            .update({ status: nextStatus })
            .eq("id", row.id);
        if (error) {
            console.error("Error toggling investigation_context status:", error);
            // Roll back local change if persistence failed
            setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, status: prevStatus } : r)));
            return;
        }
    };

    return (
        <Fragment>
            <Seo title="Investigation Context" />
            <Row className="g-0" style={{ marginLeft: "-1.5rem", marginRight: "-1.5rem" }}>
                <Col xxl={12} xl={12}>
                    <Card className="custom-card overflow-hidden" style={{ marginBottom: 0 }}>
                        <Card.Header className="justify-content-between">
                            <Card.Title>
                                Investigation Context
                            </Card.Title>
                            <div className="d-flex flex-wrap gap-2">
                                <div>
                                    <Form.Control
                                        className="form-control-sm"
                                        type="text"
                                        placeholder="Search Here"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
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
                                    <li><Dropdown.Item onClick={() => setSortBy("policy_name")}>Policy Name</Dropdown.Item></li>
                                    <li><Dropdown.Item onClick={() => setSortBy("creation_time")}>Creation Time</Dropdown.Item></li>
                                </SpkDropdown>
                            </div>
                        </Card.Header>
                        <Card.Body className="p-0" style={{ minHeight: "90vh" }}>
                            {loading ? (
                                <div className="d-flex justify-content-center align-items-center p-4">
                                    <Spinner animation="border" variant="primary" />
                                    <span className="ms-2">Loading investigation context...</span>
                                </div>
                            ) : (
                                <div className="table-responsive" style={{ minHeight: "90vh" }}>
                                    <SpkTables tableClass="table text-nowrap" header={headerColumns}>
                                        {sortedRows.length > 0 ? (
                                            sortedRows.map((row) => (
                                                <tr
                                                    key={row.id}
                                                    style={{ cursor: "pointer" }}
                                                    onClick={() => handleView(row)}
                                                >
                                                    <td>{getCreationTime(row)}</td>
                                                    <td className="fw-medium text-primary">{getPolicyName(row)}</td>
                                                    <td>{getSuppressionCount(row)}</td>
                                                    <td>{getCreatedBy(row)}</td>
                                                    <td>{getValidUntil(row)}</td>
                                                    <td>
                                                        <div className="d-flex align-items-center gap-2">
                                                            <Form.Check
                                                                type="switch"
                                                                id={`investigation-status-${row.id}`}
                                                                checked={isStatusOn(row)}
                                                                onChange={(e) => {
                                                                    e.stopPropagation();
                                                                    handleToggleStatus(row);
                                                                }}
                                                                onClick={(e) => e.stopPropagation()}
                                                            />
                                                            <span className="text-muted small">{getStatus(row)}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="btn-list">
                                                            <SpkButton
                                                                Buttonvariant="primary-light"
                                                                Customclass="btn btn-sm btn-icon btn-wave waves-effect waves-light"
                                                                onClickfunc={(e) => {
                                                                    e?.stopPropagation?.();
                                                                    handleView(row);
                                                                }}
                                                            >
                                                                <i className="ri-eye-line"></i>
                                                            </SpkButton>
                                                            <SpkButton
                                                                Buttonvariant="secondary-light"
                                                                Customclass="btn btn-sm btn-icon btn-wave waves-effect waves-light"
                                                                onClickfunc={(e) => {
                                                                    e?.stopPropagation?.();
                                                                    handleEdit(row);
                                                                }}
                                                            >
                                                                <i className="ri-edit-line"></i>
                                                            </SpkButton>
                                                            <SpkButton
                                                                Buttonvariant="danger-light"
                                                                Customclass="btn btn-sm btn-icon btn-wave waves-effect waves-light"
                                                                onClickfunc={(e) => {
                                                                    e?.stopPropagation?.();
                                                                    handleDelete(row);
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
                                                <td className='text-center' colSpan={7}>No data found</td>
                                            </tr>
                                        )}
                                    </SpkTables>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Offcanvas show={viewOpen} onHide={() => setViewOpen(false)} placement="end">
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title>Investigation Context Details</Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body className="investigation-details-offcanvas">
                    {selectedRow ? (
                        <div className="d-flex flex-column gap-2">
                            {Object.entries(selectedRow).map(([k, v]) => (
                                <div key={k} className="border rounded p-2">
                                    <div className="text-muted small">{k}</div>
                                    {k === "suggestion" && isSuggestionMap(v) ? (
                                        <div className="d-flex flex-column gap-2 mt-2">
                                            {Object.entries(v).flatMap(([scopeKey, scopeEntries]) =>
                                                Object.entries(scopeEntries || {}).map(([scopeValue, entry]) => (
                                                    <Card key={`${scopeKey}-${scopeValue}`} className="custom-card mb-0">
                                                        <Card.Body className="p-2">
                                                            <div className="d-flex flex-column gap-2 mb-1">
                                                                <span
                                                                    className="fw-semibold fs-13 text-break"
                                                                    style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}
                                                                >
                                                                    {scopeValue}
                                                                </span>
                                                                <div className="d-flex flex-wrap gap-2">
                                                                    <span className="badge bg-light text-dark text-uppercase" style={{ maxWidth: "100%" }}>
                                                                        {scopeKey}
                                                                    </span>
                                                                    <span
                                                                        className="badge bg-primary text-white text-break"
                                                                        style={{ maxWidth: "100%", overflowWrap: "anywhere", wordBreak: "break-word", whiteSpace: "normal" }}
                                                                    >
                                                                        {entry.suggestion_type ? entry.suggestion_type.replace(/_/g, " ") : "N/A"}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="fs-12 text-muted mb-1">
                                                                {entry.permanent
                                                                    ? "Permanent"
                                                                    : `Valid Until: ${formatToIsoSeconds(entry.valid_until)}`}
                                                            </div>
                                                            <p className="mb-0 fs-13" style={{ lineHeight: "1.4" }}>
                                                                {entry.suggestion_text || "—"}
                                                            </p>
                                                        </Card.Body>
                                                    </Card>
                                                ))
                                            )}
                                            {Object.values(v).every((x) => !x || Object.keys(x).length === 0) && (
                                                <div className="text-muted">No suggestions</div>
                                            )}
                                        </div>
                                    ) : (
                                        <pre className="fw-medium text-break mb-0" style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                                            {formatDetailValue(v)}
                                        </pre>
                                    )}
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
                    <Modal.Title>Edit Investigation Context (AI Tuning)</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Row>
                        <Col md={12} className="mb-3">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                                <span className="fw-medium fs-13">Suppress</span>
                                <span className="fs-13"><strong>{aiEditForm.suppressionCountPerDay}</strong> / Day</span>
                            </div>
                            <Form.Range
                                min={0}
                                max={100}
                                value={aiEditForm.suppressionCountPerDay}
                                onChange={(e) => setAiEditForm((prev) => ({ ...prev, suppressionCountPerDay: Number(e.target.value) || 0 }))}
                            />
                        </Col>
                        <Col md={12} className="mb-3">
                            {suggestionOptions.length > 1 && (
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-medium fs-13">Suggestion Entry</Form.Label>
                                    <Form.Select
                                        value={selectedSuggestionKey}
                                        onChange={(e) => handleSuggestionOptionChange(e.target.value)}
                                    >
                                        {suggestionOptions.map((opt) => {
                                            const key = `${opt.scopeType}::${opt.scopeValue}`;
                                            return (
                                                <option key={key} value={key}>
                                                    {opt.scopeType} - {opt.scopeValue}
                                                </option>
                                            );
                                        })}
                                    </Form.Select>
                                </Form.Group>
                            )}
                            <Form.Label className="fw-medium fs-13">Scope</Form.Label>
                            <div className="d-flex gap-2">
                                <Form.Select
                                    value={aiEditForm.scopeType}
                                    style={{ maxWidth: "150px" }}
                                    onChange={(e) =>
                                        setAiEditForm((prev) => ({
                                            ...prev,
                                            scopeType: (e.target.value as ScopeKey),
                                            scopeValue: e.target.value === "policy" ? String(selectedRow?.policy_name ?? "") : "",
                                        }))
                                    }
                                >
                                    <option value="policy">Policy</option>
                                    <option value="users">Users</option>
                                    <option value="assets">Assets</option>
                                    <option value="domains">Domains</option>
                                    <option value="urls">URLs</option>
                                    <option value="hashes">Hashes</option>
                                </Form.Select>
                                <Form.Control
                                    type="text"
                                    placeholder="value"
                                    value={aiEditForm.scopeValue}
                                    onChange={(e) => setAiEditForm((prev) => ({ ...prev, scopeValue: e.target.value }))}
                                />
                            </div>
                        </Col>
                        <Col md={12} className="mb-3">
                            <Form.Label className="fw-medium fs-13">Type</Form.Label>
                            <div className="d-flex flex-wrap gap-3 fs-13">
                                <Form.Check
                                    type="radio"
                                    id="ctx-type-genuine"
                                    name="ctx-type"
                                    label="Genuine activity"
                                    checked={aiEditForm.suggestionType === "Genuine activity"}
                                    onChange={() => setAiEditForm((prev) => ({ ...prev, suggestionType: "Genuine activity" }))}
                                />
                                <Form.Check
                                    type="radio"
                                    id="ctx-type-security-testing"
                                    name="ctx-type"
                                    label="Security Testing"
                                    checked={aiEditForm.suggestionType === "Security Testing"}
                                    onChange={() => setAiEditForm((prev) => ({ ...prev, suggestionType: "Security Testing" }))}
                                />
                            </div>
                        </Col>
                        <Col md={12} className="mb-3">
                            <Form.Label className="fw-medium fs-13">Valid Until</Form.Label>
                            <div className="d-flex gap-3 align-items-center">
                                <Form.Control
                                    type="date"
                                    value={aiEditForm.validUntilDate}
                                    disabled={aiEditForm.permanent}
                                    onChange={(e) => setAiEditForm((prev) => ({ ...prev, validUntilDate: e.target.value }))}
                                />
                                <Form.Check
                                    type="checkbox"
                                    id="ctx-permanent"
                                    label="Permanent"
                                    checked={aiEditForm.permanent}
                                    onChange={(e) => setAiEditForm((prev) => ({ ...prev, permanent: e.target.checked }))}
                                />
                            </div>
                        </Col>
                        <Col md={12} className="mb-3">
                            <Form.Label className="fw-medium fs-13">Suggestion</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={4}
                                value={aiEditForm.suggestionText}
                                onChange={(e) => setAiEditForm((prev) => ({ ...prev, suggestionText: e.target.value }))}
                                placeholder="Enter suggestion text..."
                            />
                        </Col>
                        {Object.keys(editData).length === 0 && (
                            <Col md={12} className="text-muted">No editable fields found.</Col>
                        )}
                    </Row>
                </Modal.Body>
                <Modal.Footer>
                    <SpkButton Buttonvariant="light" Buttontype="button" onClickfunc={() => setEditOpen(false)}>
                        Cancel
                    </SpkButton>
                    <SpkButton Buttonvariant="primary" Buttontype="button" onClickfunc={handleSaveEdit} Disabled={saving}>
                        {saving ? "Saving..." : "Save"}
                    </SpkButton>
                </Modal.Footer>
            </Modal>
            <style jsx global>{`
                .investigation-details-offcanvas {
                    font-size: 0.98rem;
                    line-height: 1.45;
                }
                .investigation-details-offcanvas .small,
                .investigation-details-offcanvas .fs-12 {
                    font-size: 0.88rem !important;
                }
                .investigation-details-offcanvas .fs-13 {
                    font-size: 0.95rem !important;
                }
            `}</style>
        </Fragment>
    );
};

export default InvestigationContext;
