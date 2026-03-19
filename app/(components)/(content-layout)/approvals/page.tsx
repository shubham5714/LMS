"use client"
import React, { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, Col, Form, InputGroup, Modal, Pagination, Row, Spinner } from "react-bootstrap";
import SpkTables from "@/shared/@spk-reusable-components/reusable-tables/spk-tables";
import SpkButton from "@/shared/@spk-reusable-components/reusable-uiElements/spk-buttons";
import Seo from "@/shared/layouts-components/seo/seo";
import { supabase } from "@/shared/lib/supabase";

// Supabase approvals table interface (schema may vary; we allow dynamic fields)
interface SupabaseApproval {
    id: number;
    [key: string]: any;
}

// Column configuration interface
interface ColumnConfig {
    key: string;
    title: string;
    visible: boolean;
    order: number;
}

// Search query parser interface
interface SearchCondition {
    field: string;
    operator: "eq" | "neq" | "ilike" | "not.ilike";
    value: string;
}

interface ParsedSearchQuery {
    conditions: SearchCondition[];
    logicalOperators: string[];
    invalidFields: string[];
}

// Search query parser function
const parseSearchQuery = (query: string, allowedFields: string[]): ParsedSearchQuery => {
    const conditions: SearchCondition[] = [];
    const invalidFields: string[] = [];

    if (!query.trim()) {
        return { conditions, logicalOperators: [], invalidFields };
    }

    // Create a set of allowed fields in lowercase for case-insensitive comparison
    const allowedFieldsSet = new Set(allowedFields.map((f) => f.toLowerCase()));

    // First, split by logical operators while preserving them
    const logicalSplit = query.split(/\s+(AND|OR)\s+/i);
    const logicalOperators: string[] = [];

    // Extract logical operators
    for (let i = 1; i < logicalSplit.length; i += 2) {
        logicalOperators.push(logicalSplit[i].toUpperCase());
    }

    // Process each part
    const parts = logicalSplit.filter((_, index) => index % 2 === 0);
    parts.forEach((part) => {
        part = part.trim();
        if (!part) return;

        // Split by spaces, but preserve quoted strings and key:value pairs
        const tokens = part.match(/(?:[^\s"]+|"[^"]*")+/g) || [];

        tokens.forEach((token) => {
            token = token.trim();
            if (!token) return;

            // Remove quotes if present
            if (token.startsWith('"') && token.endsWith('"')) {
                token = token.slice(1, -1);
            }

            // Check for key:value pattern - only field:value patterns are allowed
            const keyValueMatch = token.match(/^(-?)([a-zA-Z_][a-zA-Z0-9_]*):(.+)$/);
            if (keyValueMatch) {
                const [, negation, field, value] = keyValueMatch;
                const trimmedValue = value.trim();
                const fieldLower = field.toLowerCase();

                // Validate field against allowed fields
                if (allowedFieldsSet.has(fieldLower)) {
                    if (negation) {
                        // Handle negation (-key:value)
                        conditions.push({
                            field: fieldLower,
                            operator: "not.ilike",
                            value: trimmedValue,
                        });
                    } else {
                        // Handle equality (key:value)
                        conditions.push({
                            field: fieldLower,
                            operator: "ilike",
                            value: trimmedValue,
                        });
                    }
                } else {
                    // Field is not in allowed list
                    if (!invalidFields.includes(field)) {
                        invalidFields.push(field);
                    }
                }
            } else {
                // Token doesn't match field:value pattern - treat as invalid
                if (!invalidFields.includes(token)) {
                    invalidFields.push(token);
                }
            }
        });
    });

    return { conditions, logicalOperators, invalidFields };
};

const formatCellValue = (value: unknown, key: string): string => {
    if (value === null || value === undefined || value === "") return "-";
    if (typeof value === "string") {
        // Show date-only for created/updated timestamps and expiry date
        if (
            (key === "created_at" || key === "updated_at" || key === "expiry_date") &&
            /^\d{4}-\d{2}-\d{2}([T\s].+)?$/.test(value)
        ) {
            const d = new Date(value);
            if (!isNaN(d.getTime())) return d.toLocaleDateString("en-US");
        }

        // Light ISO-ish datetime formatting for other *_at fields
        if (/^\d{4}-\d{2}-\d{2}([T\s].+)?$/.test(value) && key.endsWith("_at")) {
            const d = new Date(value);
            if (!isNaN(d.getTime())) return d.toLocaleString();
        }
        return value;
    }
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    if (Array.isArray(value) || typeof value === "object") {
        try {
            return JSON.stringify(value);
        } catch {
            return "-";
        }
    }
    return String(value);
};

const ApprovalsList: React.FC = () => {
    const COLUMN_SETTINGS_KEY = "approvals-column-settings";
    const defaultColumnConfigRef = useRef<ColumnConfig[]>([]);

    const [approvals, setApprovals] = useState<SupabaseApproval[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [selectedApprovals, setSelectedApprovals] = useState<Set<number>>(new Set());
    const [selectAll, setSelectAll] = useState(false);
    const [approving, setApproving] = useState(false);

    const approveSelectedRowsRef = useRef<SupabaseApproval[]>([]);
    const [showApproveConfirmModal, setShowApproveConfirmModal] = useState(false);
    const [showApproveResultModal, setShowApproveResultModal] = useState(false);
    const [approveResultSummary, setApproveResultSummary] = useState<{
        successCount: number;
        totalCount: number;
        errors: string[];
    } | null>(null);

    const [searchQuery, setSearchQuery] = useState("");
    const [activeSearchQuery, setActiveSearchQuery] = useState("");
    const [searchError, setSearchError] = useState("");

    const [columnConfig, setColumnConfig] = useState<ColumnConfig[]>([]);
    const allColumnKeys = useMemo(() => (columnConfig || []).map((c) => c.key), [columnConfig]);

    const [state, setState] = useState({
        showColumnSettings: false,
        showSearchHelp: false,
    });

    const handleColumnSettingsClose = () =>
        setState((prev) => ({
            ...prev,
            showColumnSettings: false,
        }));

    const handleColumnSettingsShow = () =>
        setState((prev) => ({
            ...prev,
            showColumnSettings: true,
        }));

    const handleSearchHelpClose = () =>
        setState((prev) => ({
            ...prev,
            showSearchHelp: false,
        }));

    const handleSearchHelpShow = () =>
        setState((prev) => ({
            ...prev,
            showSearchHelp: true,
        }));

    const saveColumnSettings = useCallback(
        (config: ColumnConfig[]) => {
            try {
                localStorage.setItem(COLUMN_SETTINGS_KEY, JSON.stringify(config));
            } catch (error) {
                console.error("Error saving column settings to localStorage:", error);
            }
        },
        [COLUMN_SETTINGS_KEY]
    );

    const loadColumnSettings = useCallback((): ColumnConfig[] | null => {
        try {
            const saved = localStorage.getItem(COLUMN_SETTINGS_KEY);
            return saved ? (JSON.parse(saved) as ColumnConfig[]) : null;
        } catch (error) {
            console.error("Error loading column settings from localStorage:", error);
            return null;
        }
    }, [COLUMN_SETTINGS_KEY]);

    const visibleColumns = useMemo(() => {
        return (columnConfig || [])
            .filter((col) => col.visible)
            .sort((a, b) => a.order - b.order);
    }, [columnConfig]);

    const fetchAvailableColumns = useCallback(async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase.from("approvals").select("*").limit(10);
            if (error) {
                console.error("Error fetching approvals table columns:", error);
                return;
            }

            if (data && data.length > 0) {
                const allColumns = new Set<string>();
                data.forEach((row) => {
                    Object.keys(row || {}).forEach((key) => allColumns.add(key));
                });

                const DEFAULT_SELECTED_COLUMNS: string[] = [
                    "id",
                    "created_at",
                    "severity",
                    "entity_type",
                    "entity_value",
                    "score",
                    "request_type",
                    "alert_name",
                    "scope",
                    "expiry_date",
                    "approval_status",
                ];

                // Hidden by default; can be enabled in column settings
                const ADDITIONAL_AVAILABLE_COLUMNS: string[] = ["webhook_url", "tenant_id"];

                // Display labels
                const columnMappings: Record<string, string> = {
                    id: "ID",
                    severity: "Severity",
                    entity_type: "Entity Type",
                    entity_value: "Entity Value",
                    score: "Score",
                    request_type: "Request Type",
                    alert_name: "Alert Name",
                    scope: "Scope",
                    created_at: "Created At",
                    updated_at: "Updated At",
                    expiry_date: "Expiry Date",
                    approval_status: "Approval Status",
                    tenant_id: "Tenant ID",
                    webhook_url: "Webhook URL",
                };

                const restKeys = Array.from(allColumns).filter(
                    (k) => !DEFAULT_SELECTED_COLUMNS.includes(k) && !ADDITIONAL_AVAILABLE_COLUMNS.includes(k)
                );

                const columns: ColumnConfig[] = [];

                // Default visible columns in the requested order
                DEFAULT_SELECTED_COLUMNS.forEach((key, index) => {
                    if (!allColumns.has(key)) return;
                    columns.push({
                        key,
                        title:
                            columnMappings[key] ||
                            key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
                        visible: true,
                        order: index + 1,
                    });
                });

                // Extra available columns (hidden by default)
                ADDITIONAL_AVAILABLE_COLUMNS.forEach((key, index) => {
                    if (!allColumns.has(key)) return;
                    columns.push({
                        key,
                        title:
                            columnMappings[key] ||
                            key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
                        visible: false,
                        order: DEFAULT_SELECTED_COLUMNS.length + index + 1,
                    });
                });

                // Everything else available but hidden by default
                restKeys
                    .sort((a, b) => a.localeCompare(b))
                    .forEach((key, index) => {
                        columns.push({
                            key,
                            title:
                                columnMappings[key] ||
                                key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
                            visible: false,
                            order: DEFAULT_SELECTED_COLUMNS.length + ADDITIONAL_AVAILABLE_COLUMNS.length + index + 1,
                        });
                    });

                // Default config is "all visible"
                defaultColumnConfigRef.current = columns;

                const savedSettings = loadColumnSettings();
                const shouldUseSavedSettings =
                    !!savedSettings?.length &&
                    DEFAULT_SELECTED_COLUMNS.some((k) => savedSettings.some((s) => s.key === k));

                if (shouldUseSavedSettings) {
                    const mergedConfig = columns.map((col) => {
                        const saved = savedSettings.find((s) => s.key === col.key);
                        return saved ? { ...col, visible: !!saved.visible, order: saved.order ?? col.order } : col;
                    });
                    const normalizedConfig = mergedConfig.map((col) => {
                        // Ensure "updated_at" is moved to available fields (not default visible)
                        if (col.key === "updated_at") {
                            return { ...col, visible: false };
                        }
                        // Ensure tenant_id is moved to available fields (not default visible)
                        if (col.key === "tenant_id") {
                            return { ...col, visible: false };
                        }
                        return col;
                    });
                    normalizedConfig.sort((a, b) => a.order - b.order);
                    setColumnConfig(normalizedConfig);
                } else {
                    setColumnConfig(columns);
                }
            } else {
                setColumnConfig([]);
            }
        } catch (error) {
            console.error("Error fetching approvals columns:", error);
        } finally {
            setLoading(false);
        }
    }, [loadColumnSettings]);

    const handleSearch = () => {
        setActiveSearchQuery(searchQuery);
        setCurrentPage(1);
    };

    const handleSearchKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleSearch();
    };

    const applySearchCondition = (query: any, condition: SearchCondition, forOrString: boolean = false): any => {
        if (condition.field === "id") {
            const idValue = parseInt(condition.value);
            if (!isNaN(idValue)) {
                if (forOrString) {
                    if (condition.operator === "ilike") {
                        return `${condition.field}.eq.${idValue}`;
                    }
                    return null;
                }
                if (condition.operator === "ilike") {
                    return query.eq(condition.field, idValue);
                }
                if (condition.operator === "not.ilike") {
                    return query.neq(condition.field, idValue);
                }
            }
        } else {
            if (forOrString) {
                if (condition.operator === "ilike") {
                    return `${condition.field}.ilike.%${condition.value}%`;
                }
                return null;
            }

            if (condition.operator === "ilike") {
                return query.ilike(condition.field, `%${condition.value}%`);
            }
            if (condition.operator === "not.ilike") {
                return query.not(condition.field, "ilike", `%${condition.value}%`);
            }
        }
        return query;
    };

    const fetchApprovals = useCallback(
        async (page: number = 1) => {
            try {
                setLoading(true);
                setSearchError("");
                // Selections are page-scoped; reset when we refetch
                setSelectedApprovals(new Set());
                setSelectAll(false);

                const pageSize = 50;
                const from = (page - 1) * pageSize;
                const to = from + pageSize - 1;

                const allowedFields = allColumnKeys;
                const parsedQuery = parseSearchQuery(activeSearchQuery, allowedFields);

                if (parsedQuery.invalidFields.length > 0) {
                    setSearchError(
                        `Invalid search: ${parsedQuery.invalidFields.join(", ")}. Please use field:value format (e.g., status:Active). Allowed fields: ${allowedFields.join(", ")}`
                    );
                    setApprovals([]);
                    setTotalPages(1);
                    return;
                }

                if (parsedQuery.conditions.length === 0 && activeSearchQuery.trim()) {
                    setSearchError(
                        `Invalid search format. Please use field:value format (e.g., status:Active). Allowed fields: ${allowedFields.join(", ")}`
                    );
                    setApprovals([]);
                    setTotalPages(1);
                    return;
                }

                // Count query (same filters)
                let countQuery = supabase.from("approvals").select("*", { count: "exact" });

                if (parsedQuery.conditions.length > 0) {
                    const isAndOperation =
                        parsedQuery.logicalOperators.length === 0 ||
                        parsedQuery.logicalOperators.every((op) => op === "AND");

                    if (isAndOperation) {
                        parsedQuery.conditions.forEach((condition) => {
                            countQuery = applySearchCondition(countQuery, condition);
                        });
                    } else {
                        const hasNegation = parsedQuery.conditions.some((c) => c.operator === "not.ilike");
                        if (hasNegation) {
                            parsedQuery.conditions.forEach((condition) => {
                                countQuery = applySearchCondition(countQuery, condition);
                            });
                        } else {
                            const orConditions = parsedQuery.conditions
                                .map((condition) => applySearchCondition(countQuery, condition, true))
                                .filter((condition): condition is string => condition !== null);

                            if (orConditions.length > 0) {
                                countQuery = countQuery.or(orConditions.join(","));
                            }
                        }
                    }
                }

                const { count, error: countError } = await countQuery;
                if (countError) throw countError;

                const nextTotalCount = count || 0;
                setTotalPages(Math.max(1, Math.ceil(nextTotalCount / pageSize)));

                // Data query (same filters)
                let dataQuery = supabase.from("approvals").select("*");

                if (parsedQuery.conditions.length > 0) {
                    const isAndOperation =
                        parsedQuery.logicalOperators.length === 0 ||
                        parsedQuery.logicalOperators.every((op) => op === "AND");

                    if (isAndOperation) {
                        parsedQuery.conditions.forEach((condition) => {
                            dataQuery = applySearchCondition(dataQuery, condition);
                        });
                    } else {
                        const hasNegation = parsedQuery.conditions.some((c) => c.operator === "not.ilike");
                        if (hasNegation) {
                            parsedQuery.conditions.forEach((condition) => {
                                dataQuery = applySearchCondition(dataQuery, condition);
                            });
                        } else {
                            const orConditions = parsedQuery.conditions
                                .map((condition) => applySearchCondition(dataQuery, condition, true))
                                .filter((condition): condition is string => condition !== null);

                            if (orConditions.length > 0) {
                                dataQuery = dataQuery.or(orConditions.join(","));
                            }
                        }
                    }
                }

                const { data, error } = await dataQuery
                    .order("id", { ascending: false })
                    .range(from, to);

                if (error) throw error;

                setApprovals((data as SupabaseApproval[]) || []);
            } catch (error) {
                console.error("Error fetching approvals:", error);
                setSearchError("An error occurred while searching.");
            } finally {
                setLoading(false);
            }
        },
        [activeSearchQuery, allColumnKeys]
    );

    const handleSelectAll = () => {
        const newSelectAll = !selectAll;
        setSelectAll(newSelectAll);

        if (newSelectAll && approvals && approvals.length > 0) {
            const allIds = new Set(approvals.map((a) => a.id));
            setSelectedApprovals(allIds);
        } else {
            setSelectedApprovals(new Set());
        }
    };

    const handleCheckboxToggle = (id: number) => {
        setSelectedApprovals((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            setSelectAll(newSet.size === (approvals?.length || 0));
            return newSet;
        });
    };

    const handleApproveSelected = () => {
        if (approving) return;
        if (!selectedApprovals.size) return;

        const selectedRows = approvals.filter((a) => selectedApprovals.has(a.id));
        if (selectedRows.length === 0) return;

        approveSelectedRowsRef.current = selectedRows;
        setShowApproveConfirmModal(true);
    };

    const handleConfirmApproveSelected = async () => {
        if (approving) return;
        const selectedRows = approveSelectedRowsRef.current;
        if (!selectedRows || selectedRows.length === 0) return;

        setShowApproveConfirmModal(false);
        setApproving(true);

        try {
            const results = await Promise.allSettled(
                selectedRows.map(async (row) => {
                    const webhookUrl = (row as any).webhook_url as string | undefined;
                    if (!webhookUrl) {
                        return { id: row.id, ok: false, error: "Missing webhook_url" };
                    }

                    const resp = await fetch(webhookUrl, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: row.id, entity_value: (row as any).entity_value }),
                    });

                    let responseText = "";
                    try {
                        responseText = await resp.text();
                    } catch {
                        responseText = "";
                    }

                    return { id: row.id, ok: resp.ok, status: resp.status, responseText };
                })
            );

            let successCount = 0;
            const errors: string[] = [];

            results.forEach((r: any) => {
                if (r.status === "rejected") {
                    errors.push(String(r.reason?.message || r.reason || "Request failed"));
                    return;
                }

                const v = r.value as any;
                if (v?.ok) successCount += 1;
                else errors.push(`#${v?.id || "unknown"}: ${v?.error || `status ${v?.status || "?"}`}`);
            });

            setApproveResultSummary({
                successCount,
                totalCount: selectedRows.length,
                errors,
            });

            setSelectedApprovals(new Set());
            setSelectAll(false);

            // Refresh current page results after approvals
            fetchApprovals(currentPage);
            setShowApproveResultModal(true);
        } catch (e: any) {
            setApproveResultSummary({
                successCount: 0,
                totalCount: selectedRows.length,
                errors: [String(e?.message || "Failed to approve selected items.")],
            });
            setShowApproveResultModal(true);
        } finally {
            setApproving(false);
            approveSelectedRowsRef.current = [];
        }
    };

    const handleCloseApproveModals = () => {
        setShowApproveConfirmModal(false);
        setShowApproveResultModal(false);
        setApproveResultSummary(null);
        approveSelectedRowsRef.current = [];
    };

    useEffect(() => {
        fetchApprovals(1);
    }, [fetchApprovals]);

    useEffect(() => {
        fetchAvailableColumns();
    }, [fetchAvailableColumns]);

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            const nextPage = currentPage + 1;
            setCurrentPage(nextPage);
            fetchApprovals(nextPage);
        }
    };

    const handlePrevPage = () => {
        if (currentPage > 1) {
            const prevPage = currentPage - 1;
            setCurrentPage(prevPage);
            fetchApprovals(prevPage);
        }
    };

    const handleColumnToggle = (key: string) => {
        setColumnConfig((prev) => {
            const newConfig = (prev || []).map((col) => (col.key === key ? { ...col, visible: !col.visible } : col));
            saveColumnSettings(newConfig);
            return newConfig;
        });
    };

    const handleColumnReorder = (fromIndex: number, toIndex: number) => {
        setColumnConfig((prev) => {
            const newConfig = [...(prev || [])];
            const [movedItem] = newConfig.splice(fromIndex, 1);
            newConfig.splice(toIndex, 0, movedItem);
            const reorderedConfig = newConfig.map((col, index) => ({ ...col, order: index + 1 }));
            saveColumnSettings(reorderedConfig);
            return reorderedConfig;
        });
    };

    return (
        <Fragment>
            <Seo title="Approvals" />

            <style jsx>{`
                .column-settings-list {
                    max-height: 400px;
                    overflow-y: auto;
                }
                .table-responsive {
                    overflow-x: auto;
                    -webkit-overflow-scrolling: touch;
                    min-height: 65vh;
                }
                .column-setting-item.dragging {
                    opacity: 0.5;
                    transform: rotate(2deg);
                }
            `}</style>

            <Row className="g-0" style={{ marginLeft: "-1.5rem", marginRight: "-1.5rem" }}>
                <Col xxl={12} xl={12}>
                    <Card className="custom-card" style={{ marginBottom: 0 }}>
                <Card.Header
                    className="d-flex align-items-center justify-content-between"
                    style={{ paddingTop: "0.75rem", paddingBottom: "0.75rem" }}
                >
                    <Card.Title className="mb-0">Approvals</Card.Title>
                    <SpkButton Customclass="btn btn-wave" Buttonvariant="primary-light">
                        <i className="ri-upload-cloud-line align-middle me-1"></i> Export report
                    </SpkButton>
                </Card.Header>

                {/* Search Bar */}
                <Card.Body className="border-bottom">
                    <Row className="mb-3">
                        <Col md={8}>
                            <InputGroup>
                                <Button variant="outline-info" onClick={handleSearchHelpShow} title="Search Help" disabled={!columnConfig.length}>
                                    <i className="ri-question-line"></i>
                                </Button>
                                <Form.Control
                                    id="approvals-search-input"
                                    type="text"
                                    placeholder="Search by field (e.g., status:Active, -approver:John)..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyPress={handleSearchKeyPress}
                                    className={searchError ? "is-invalid" : ""}
                                    disabled={!columnConfig.length}
                                />
                                <Button
                                    variant="primary"
                                    onClick={handleSearch}
                                    disabled={!searchQuery.trim() || !columnConfig.length}
                                >
                                    <i className="ri-search-line"></i>
                                </Button>
                                <Button
                                    variant="outline-secondary"
                                    onClick={() => {
                                        setSearchQuery("");
                                        setActiveSearchQuery("");
                                        setSearchError("");
                                    }}
                                    disabled={(!searchQuery && !activeSearchQuery) || !columnConfig.length}
                                >
                                    <i className="ri-close-line"></i>
                                </Button>
                            </InputGroup>
                            {searchError && <div className="invalid-feedback d-block">{searchError}</div>}
                        </Col>

                        <Col md={4} className="d-flex align-items-end justify-content-end"></Col>
                    </Row>

                    <Row className="mb-0">
                        <Col md={12}>
                            <div className="d-flex gap-2 justify-content-between align-items-center">
                                <SpkButton
                                    Buttontype="button"
                                    Buttonvariant="success"
                                    Customclass="waves-effect waves-light rounded-pill"
                                    onClickfunc={handleApproveSelected}
                                    Disabled={approving || selectedApprovals.size === 0}
                                >
                                    <i className="ri-check-line fw-medium align-middle me-1"></i>
                                    Approve
                                </SpkButton>

                                <Button
                                    variant="outline-secondary"
                                    className="btn btn-sm"
                                    onClick={handleColumnSettingsShow}
                                    title="Column Settings"
                                    disabled={!columnConfig.length}
                                >
                                    <i className="ri-settings-3-line"></i>
                                </Button>
                            </div>
                        </Col>
                    </Row>
                </Card.Body>

                <Card.Body className="p-0" style={{ minHeight: "65vh" }}>
                    {loading ? (
                        <div className="d-flex justify-content-center align-items-center p-4">
                            <Spinner animation="border" variant="primary" />
                            <span className="ms-2">Loading approvals...</span>
                        </div>
                    ) : (
                        <div className="table-responsive" style={{ overflowX: "auto", minWidth: "100%", minHeight: "65vh" }}>
                            <SpkTables
                                tableClass="table text-nowrap"
                                checked={selectAll}
                                onChange={handleSelectAll}
                                showCheckbox={true}
                                header={(visibleColumns || []).map((col) => ({ title: col.title }))}
                            >
                                {approvals && approvals.length > 0 ? (
                                    approvals.map((approval) => (
                                        <tr className="task-list" key={approval.id}>
                                            <td className="task-checkbox">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    aria-label="Select approval"
                                                    checked={selectedApprovals.has(approval.id)}
                                                    onChange={() => handleCheckboxToggle(approval.id)}
                                                />
                                            </td>
                                            {(visibleColumns || []).map((col) => (
                                                <td key={col.key} style={col.key === "id" ? { maxWidth: "180px" } : {}}>
                                                    {col.key === "id" && (
                                                        <span className="fw-medium text-primary">{approval[col.key]}</span>
                                                    )}

                                                    {col.key === "severity" && (
                                                        <SpkButton
                                                            Buttontype="button"
                                                            Buttonvariant={
                                                                (String(approval.severity || "")).toLowerCase() === "critical" ||
                                                                (String(approval.severity || "")).toLowerCase() === "high"
                                                                    ? "danger-gradient"
                                                                    : (String(approval.severity || "")).toLowerCase() === "medium"
                                                                        ? "orange-gradient"
                                                                        : (String(approval.severity || "")).toLowerCase() === "low"
                                                                            ? "success-gradient"
                                                                            : "primary-gradient"
                                                            }
                                                            Customclass="btn-sm rounded-pill"
                                                            Style={{ minWidth: "70px", width: "70px" }}
                                                        >
                                                            {approval.severity || "-"}
                                                        </SpkButton>
                                                    )}

                                                    {col.key === "approval_status" && (
                                                        <SpkButton
                                                            Buttontype="button"
                                                            Buttonvariant={
                                                                (String(approval.approval_status || "")).toLowerCase() === "pending"
                                                                    ? "warning-gradient"
                                                                    : (String(approval.approval_status || "")).toLowerCase() === "approved"
                                                                        ? "success-gradient"
                                                                        : "primary-gradient"
                                                            }
                                                            Customclass="btn-sm rounded-pill"
                                                            Style={{ minWidth: "100px", width: "100px" }}
                                                        >
                                                            {approval.approval_status || "-"}
                                                        </SpkButton>
                                                    )}

                                                    {col.key === "score" && (
                                                        (() => {
                                                            const scoreNum = Number(approval.score);
                                                            if (Number.isNaN(scoreNum)) {
                                                                return <span>{formatCellValue(approval.score, col.key)}</span>;
                                                            }

                                                            const isLow = scoreNum < 5;
                                                            return (
                                                                <SpkButton
                                                                    Buttontype="button"
                                                                    Buttonvariant={isLow ? "warning-gradient" : "danger-gradient"}
                                                                    Customclass="btn-sm rounded-pill"
                                                                    Style={{ minWidth: "70px", width: "70px" }}
                                                                >
                                                                    {scoreNum}
                                                                </SpkButton>
                                                            );
                                                        })()
                                                    )}

                                                    {col.key !== "id" && col.key !== "severity" && col.key !== "approval_status" && col.key !== "score" && (
                                                        <span>{formatCellValue(approval[col.key], col.key)}</span>
                                                    )}
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={Math.max(1, (visibleColumns || []).length) + 1} className="text-center py-4">
                                            <div className="text-muted">
                                                <i className="ri-inbox-line fs-48 mb-3 d-block"></i>
                                                No approvals found
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </SpkTables>
                        </div>
                    )}
                </Card.Body>

                <Card.Footer className="border-top-0" style={{ paddingTop: "0.75rem", paddingBottom: "0.75rem" }}>
                    <nav aria-label="Page navigation">
                        <Pagination className="pagination mb-0 float-end">
                            <Pagination.Prev disabled={currentPage === 1} onClick={handlePrevPage}>
                                Previous
                            </Pagination.Prev>

                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum: number;
                                if (totalPages <= 5) pageNum = i + 1;
                                else if (currentPage <= 3) pageNum = i + 1;
                                else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                                else pageNum = currentPage - 2 + i;

                                return (
                                    <Pagination.Item
                                        key={pageNum}
                                        active={pageNum === currentPage}
                                        onClick={() => {
                                            if (pageNum !== currentPage) {
                                                setCurrentPage(pageNum);
                                                fetchApprovals(pageNum);
                                            }
                                        }}
                                    >
                                        {pageNum}
                                    </Pagination.Item>
                                );
                            })}

                            <Pagination.Next disabled={currentPage === totalPages} onClick={handleNextPage}>
                                Next
                            </Pagination.Next>
                        </Pagination>
                    </nav>
                </Card.Footer>
                    </Card>
                </Col>
            </Row>

            {/* Column Settings Modal */}
            <Modal
                show={state.showColumnSettings}
                centered
                onHide={handleColumnSettingsClose}
                className="modal fade"
                id="approvals-column-settings"
                tabIndex={-1}
            >
                <Modal.Header className="modal-header">
                    <Modal.Title className="modal-title h6">Column Settings</Modal.Title>
                    <SpkButton
                        Buttonvariant=""
                        Buttontype="button"
                        Customclass="btn-close"
                        data-bs-dismiss="modal"
                        aria-label="Close"
                        onClickfunc={handleColumnSettingsClose}
                    ></SpkButton>
                </Modal.Header>

                <Modal.Body className="modal-body px-4">
                    <div className="mb-3">
                        <p className="text-muted small mb-3">Drag to reorder columns and toggle visibility</p>
                        <div className="column-settings-list">
                            {(columnConfig || []).map((col, index) => (
                                <div
                                    key={col.key}
                                    className="column-setting-item d-flex align-items-center justify-content-between p-2 mb-2 border rounded"
                                    draggable
                                    onDragStart={(e) => {
                                        e.dataTransfer.setData("text/plain", index.toString());
                                        e.currentTarget.classList.add("dragging");
                                    }}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        e.currentTarget.style.borderColor = "rgba(0, 123, 255, 0.5)";
                                        e.currentTarget.style.backgroundColor = "rgba(0, 123, 255, 0.1)";
                                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 123, 255, 0.2)";
                                    }}
                                    onDragLeave={(e) => {
                                        e.currentTarget.style.borderColor = "";
                                        e.currentTarget.style.backgroundColor = "";
                                        e.currentTarget.style.boxShadow = "";
                                    }}
                                    onDragEnd={(e) => {
                                        e.currentTarget.classList.remove("dragging");
                                        e.currentTarget.style.borderColor = "";
                                        e.currentTarget.style.backgroundColor = "";
                                        e.currentTarget.style.boxShadow = "";
                                    }}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        const dragIndex = parseInt(e.dataTransfer.getData("text/plain"));
                                        const dropIndex = index;
                                        if (dragIndex !== dropIndex) handleColumnReorder(dragIndex, dropIndex);
                                        e.currentTarget.style.borderColor = "";
                                        e.currentTarget.style.backgroundColor = "";
                                        e.currentTarget.style.boxShadow = "";
                                    }}
                                >
                                    <div className="d-flex align-items-center">
                                        <i
                                            className="ri-drag-move-2-line me-2 text-muted"
                                            style={{ cursor: "grab" }}
                                        ></i>
                                        <div className="form-check mb-0">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                id={`approvals-col-${col.key}`}
                                                checked={col.visible}
                                                onChange={() => handleColumnToggle(col.key)}
                                            />
                                            <label
                                                className="form-check-label fw-medium"
                                                htmlFor={`approvals-col-${col.key}`}
                                            >
                                                {col.title}
                                            </label>
                                        </div>
                                    </div>

                                    <div className="d-flex align-items-center">
                                        <span className="badge bg-light text-dark me-2">#{col.order}</span>
                                        <span className={`badge ${col.visible ? "bg-success" : "bg-secondary"}`}>
                                            {col.visible ? "Visible" : "Hidden"}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </Modal.Body>

                <Modal.Footer className="modal-footer">
                    <div className="d-flex justify-content-between w-100">
                        <SpkButton
                            Buttonvariant="outline-secondary"
                            Buttontype="button"
                            Customclass="btn btn-outline-secondary"
                            onClickfunc={() => {
                                const defaults = defaultColumnConfigRef.current;
                                if (!defaults || defaults.length === 0) return;
                                const resetConfig = defaults.map((c) => ({ ...c }));
                                setColumnConfig(resetConfig);
                                saveColumnSettings(resetConfig);
                            }}
                        >
                            Reset to Default
                        </SpkButton>
                        <SpkButton
                            Buttonvariant="light"
                            Buttontype="button"
                            Customclass="btn btn-light"
                            data-bs-dismiss="modal"
                            onClickfunc={handleColumnSettingsClose}
                        >
                            Close
                        </SpkButton>
                    </div>
                </Modal.Footer>
            </Modal>

            {/* Search Help Modal */}
            <Modal
                show={state.showSearchHelp}
                centered
                onHide={handleSearchHelpClose}
                className="modal fade"
                id="approvals-search-help"
                tabIndex={-1}
            >
                <Modal.Header className="modal-header">
                    <Modal.Title className="modal-title h6">
                        <i className="ri-search-line me-2"></i>Search Help
                    </Modal.Title>
                    <SpkButton
                        Buttonvariant=""
                        Buttontype="button"
                        Customclass="btn-close"
                        data-bs-dismiss="modal"
                        aria-label="Close"
                        onClickfunc={handleSearchHelpClose}
                    ></SpkButton>
                </Modal.Header>

                <Modal.Body className="modal-body px-4">
                    <div className="mb-4">
                        <h6 className="fw-medium mb-3">Search Syntax</h6>
                        <p className="text-muted mb-3">
                            Use <code>field:value</code> for matches, <code>-field:value</code> for exclusions. Searchable fields are the table columns detected from the `approvals` table.
                        </p>

                        <h6 className="fw-medium mb-3">Examples</h6>
                        <div className="row g-3">
                            <div className="col-md-6">
                                <div className="border rounded p-3">
                                    <h6 className="text-primary mb-2">Basic Field Search</h6>
                                    <code>status:Active</code>
                                    <p className="text-muted small mb-0">Find approvals with status "Active"</p>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="border rounded p-3">
                                    <h6 className="text-danger mb-2">Negation Search</h6>
                                    <code>-approver:John</code>
                                    <p className="text-muted small mb-0">Exclude approvals approved by John</p>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="border rounded p-3">
                                    <h6 className="text-success mb-2">AND Operation</h6>
                                    <code>status:Pending AND -reason:spam</code>
                                    <p className="text-muted small mb-0">Status is Pending and reason is not "spam"</p>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="border rounded p-3">
                                    <h6 className="text-warning mb-2">OR Operation</h6>
                                    <code>status:Pending OR status:Active</code>
                                    <p className="text-muted small mb-0">Status is Pending or Active</p>
                                </div>
                            </div>
                        </div>

                        <div className="alert alert-warning mt-4">
                            <h6 className="alert-heading">
                                <i className="ri-information-line me-1"></i>Available searchable fields
                            </h6>
                            <ul className="mb-0">
                                {(allColumnKeys.length ? allColumnKeys : []).slice(0, 25).map((field) => (
                                    <li key={field}>
                                        <code>{field}</code>
                                    </li>
                                ))}
                                {allColumnKeys.length > 25 && <li className="text-muted">+ {allColumnKeys.length - 25} more</li>}
                            </ul>
                        </div>
                    </div>
                </Modal.Body>

                <Modal.Footer className="modal-footer">
                    <SpkButton
                        Buttonvariant="primary"
                        Buttontype="button"
                        Customclass="btn btn-primary"
                        onClickfunc={handleSearchHelpClose}
                    >
                        Got it!
                    </SpkButton>
                </Modal.Footer>
            </Modal>

            {/* Approve confirmation modal */}
            <Modal
                show={showApproveConfirmModal}
                centered
                onHide={() => setShowApproveConfirmModal(false)}
                className="modal fade"
                id="approvals-approve-confirm"
                tabIndex={-1}
                backdrop="static"
                keyboard={false}
            >
                <Modal.Header className="modal-header" closeButton>
                    <Modal.Title className="modal-title h6">Confirm Approval</Modal.Title>
                </Modal.Header>
                <Modal.Body className="modal-body px-4">
                    <p className="mb-2">
                        You are about to approve <strong>{selectedApprovals.size}</strong> request(s).
                    </p>
                </Modal.Body>
                <Modal.Footer className="modal-footer">
                    <SpkButton
                        Buttonvariant="outline-secondary"
                        Buttontype="button"
                        Customclass="btn btn-outline-secondary"
                        onClickfunc={() => setShowApproveConfirmModal(false)}
                    >
                        Cancel
                    </SpkButton>
                    <SpkButton
                        Buttonvariant="success"
                        Buttontype="button"
                        Customclass="btn btn-success"
                        onClickfunc={handleConfirmApproveSelected}
                        Disabled={approving}
                    >
                        {approving ? "Approving..." : "Confirm"}
                    </SpkButton>
                </Modal.Footer>
            </Modal>

            {/* Approve result modal */}
            <Modal
                show={showApproveResultModal}
                centered
                onHide={handleCloseApproveModals}
                className="modal fade"
                id="approvals-approve-result"
                tabIndex={-1}
            >
                <Modal.Header className="modal-header" closeButton>
                    <Modal.Title className="modal-title h6">Approval Result</Modal.Title>
                </Modal.Header>
                <Modal.Body className="modal-body px-4">
                    {approveResultSummary ? (
                        <>
                            <p className="mb-3">
                                Approved <strong>{approveResultSummary.successCount}</strong> out of{" "}
                                <strong>{approveResultSummary.totalCount}</strong> request(s).
                            </p>
                            {approveResultSummary.errors.length > 0 && (
                                <>
                                    <div className="alert alert-warning py-2 mb-2">
                                        <strong>Errors:</strong>
                                    </div>
                                    <ul className="mb-0">
                                        {approveResultSummary.errors.slice(0, 10).map((e, idx) => (
                                            <li key={`${idx}-${e}`} className="text-muted small">
                                                {e}
                                            </li>
                                        ))}
                                    </ul>
                                    {approveResultSummary.errors.length > 10 && (
                                        <p className="text-muted small mt-2 mb-0">
                                            +{approveResultSummary.errors.length - 10} more error(s)
                                        </p>
                                    )}
                                </>
                            )}
                        </>
                    ) : (
                        <p className="text-muted mb-0">No result available.</p>
                    )}
                </Modal.Body>
                <Modal.Footer className="modal-footer">
                    <SpkButton
                        Buttonvariant="primary"
                        Buttontype="button"
                        Customclass="btn btn-primary"
                        onClickfunc={handleCloseApproveModals}
                    >
                        Close
                    </SpkButton>
                </Modal.Footer>
            </Modal>
        </Fragment>
    );
};

export default ApprovalsList;

