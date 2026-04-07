"use client"
// Ticket Details Page - Restructured based on wireframe
import SpkButton from "@/shared/@spk-reusable-components/reusable-uiElements/spk-buttons";
import SpkBadge from "@/shared/@spk-reusable-components/reusable-uiElements/spk-badge";
import SpkRibbons from "@/shared/@spk-reusable-components/reusable-advancedui/spk-ribbons";
import SpkSunEditor from "@/shared/@spk-reusable-components/reusable-plugins/spk-suneditor";
import { Lightboxcomponent } from "@/shared/@spk-reusable-components/reusable-plugins/spk-lightbox";
import SpkDropdown from "@/shared/@spk-reusable-components/reusable-uiElements/spk-dropdown";
import SpkButtongroup from "@/shared/@spk-reusable-components/reusable-uiElements/spk-buttongroup";
import Seo from "@/shared/layouts-components/seo/seo";
import { supabase } from "@/shared/lib/supabase";
import { useTenantContext } from "@/shared/contextapi/TenantContext";
import { useUserContext } from "@/shared/contextapi/UserContext";
import { useSearchParams } from "next/navigation";
import React, { Fragment, useState, useEffect, useCallback, useMemo } from "react";
import { Accordion, Card, Col, Dropdown, ListGroup, Nav, Row, Tab, Spinner, Modal, Form } from "react-bootstrap";

interface TicketDetailsProps { }

interface MitreTactic {
    name: string;
    count: number;
    active: boolean;
    technique?: string;
}

interface ArtifactItem {
    value: string;
    score?: number;
    color?: string;
    detail?: string;
    alerts?: number;
}

interface ArtifactsData {
    ip_addresses?: ArtifactItem[];
    urls?: ArtifactItem[];
    domains?: ArtifactItem[];
    hashes?: ArtifactItem[];
}

interface AssetItem {
    value: string;
    alerts?: number;
    detail?: string;
}

interface ArtifactsAndAssets {
    artifacts?: ArtifactsData;
    assets?: AssetItem[];
    users?: AssetItem[];
}

interface RelatedAlert {
    time: string;
    id: string;
    name: string;
    severity: string;
    status?: string;
    closure_category?: string;
}

interface RelatedAlertsData {
    [entityType: string]: {
        [entityName: string]: RelatedAlert[];
    };
}

interface AlertAnalysisSection {
    type: 'paragraphs' | 'list';
    content: string[];
    heading: string;
}

interface AlertAnalysis {
    sections: AlertAnalysisSection[];
}

interface AlertFields {
    [key: string]: string | number | null | undefined;
}

interface TicketData {
    id: number;
    name?: string;
    title: string;
    status: string;
    priority: string;
    severity?: string;
    tenant_id: string;
    description?: string;
    mitre?: MitreTactic[] | string;
    artifacts_and_assets?: ArtifactsAndAssets | string;
    alert_analysis?: AlertAnalysis | string;
    alert_fields?: AlertFields | string;
    related_alerts?: RelatedAlertsData | string;
    raw_logs?: unknown[] | string;
    [key: string]: any;
}

const RELATED_ALERT_TYPE_LABELS: Record<string, string> = {
    ips: "IPs",
};

const RELATED_ALERT_TYPE_ICONS: Record<string, string> = {
    ips: "ri-router-line",
    domains: "ri-global-line",
    urls: "ri-link",
    users: "ri-user-line",
    assets: "ri-computer-line",
    hashes: "ri-fingerprint-line",
};

const formatRelatedAlertTypeLabel = (entityType: string): string => {
    if (RELATED_ALERT_TYPE_LABELS[entityType]) return RELATED_ALERT_TYPE_LABELS[entityType];
    return entityType
        .replace('_', ' ')
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

const getRelatedAlertTypeIcon = (entityType: string): string =>
    RELATED_ALERT_TYPE_ICONS[entityType] || "ri-folder-2-line";

const getRelatedAlertSeverityBorder = (severity: string): string => {
    if (severity === 'high') return '4px solid rgba(220, 53, 69, 0.8)';
    if (severity === 'medium') return '4px solid rgba(253, 126, 20, 0.8)';
    return '4px solid rgba(52, 58, 64, 0.8)';
};

const formatAttributeDisplayValue = (value: unknown): string => {
    if (value === null || value === undefined || value === '') return 'N/A';
    if (typeof value === 'string' && (value.includes('T') || value.includes('-')) && !isNaN(Date.parse(value))) {
        return new Date(value).toLocaleString();
    }
    return String(value);
};

// Format a UTC datetime string to user's timezone for display
const formatUtcToUserTimezone = (value?: string | null, timezone: string = 'UTC'): string => {
    if (!value) return 'N/A';
    try {
        let normalized = value;
        // Handle "YYYY-MM-DD HH:mm:ss" by converting to ISO-like and marking as UTC
        if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(value)) {
            normalized = value.replace(' ', 'T') + 'Z';
        } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(value)) {
            // Bare ISO without timezone - treat as UTC
            normalized = value + 'Z';
        }
        const date = new Date(normalized);
        if (isNaN(date.getTime())) {
            return value;
        }
        // Use user's timezone for display
        return date.toLocaleString('en-US', { timeZone: timezone, hour12: false }).replace(/\b(am|pm)\b/gi, (m) => m.toUpperCase());
    } catch {
        return value;
    }
};

// Normalize related alerts data from database format to display format
const normalizeRelatedAlerts = (data: any): RelatedAlertsData => {
    const normalized: RelatedAlertsData = {};
    
    // Iterate through each entity type (ips, urls, users, assets, hashes, domains)
    Object.keys(data).forEach((entityType) => {
        const entities = data[entityType];
        if (entities && typeof entities === 'object') {
            normalized[entityType] = {};
            
            // Iterate through each entity name
            Object.keys(entities).forEach((entityName) => {
                const alerts = entities[entityName];
                if (Array.isArray(alerts) && alerts.length > 0) {
                    normalized[entityType][entityName] = alerts.map((alert: any) => {
                        // Normalize time format (ISO to display format)
                        let timeStr = alert.time || '';
                        if (timeStr.includes('T')) {
                            // Convert ISO format (2026-02-13T15:31:32) to display format (2026-02-13 15:31:32)
                            timeStr = timeStr.replace('T', ' ').split('.')[0];
                        }
                        
                        // Normalize severity to lowercase
                        const severityStr = (alert.severity || '').toLowerCase();
                        
                        // Normalize closure_category (null to empty string)
                        const closureCategory = alert.closure_category || '';
                        
                        return {
                            time: timeStr,
                            id: String(alert.id || ''),
                            name: alert.name || '',
                            severity: severityStr,
                            status: alert.status || '',
                            closure_category: closureCategory
                        };
                    });
                }
            });
        }
    });
    
    return normalized;
};

const DUMMY_POLICY_ALERTS_PER_DAY = 25;

interface TicketNote {
    id: number;
    author: string;
    authorInitial: string;
    content: string;
    createdAt: string;
}

function normalizeNotesFromDb(raw: unknown): TicketNote[] {
    if (!raw || !Array.isArray(raw)) return [];
    return raw.map((item: Record<string, unknown>) => {
        if (!item || typeof item !== 'object') return null;
        const created = item.createdAt ?? item.created_at ?? new Date().toISOString();
        const author = item.author;
        const initial = item.authorInitial ?? item.author_initial ?? (typeof author === 'string' ? author.charAt(0).toUpperCase() : '');
        return {
            id: Number(item.id) || Date.now(),
            author: typeof author === 'string' ? author : '',
            authorInitial: String(initial),
            content: typeof item.content === 'string' ? item.content : '',
            createdAt: typeof created === 'string' ? created : new Date().toISOString(),
        };
    }).filter((n): n is TicketNote => n !== null);
}

const TicketDetails: React.FC<TicketDetailsProps> = () => {
    const searchParams = useSearchParams();
    const ticketId = searchParams.get('id');
    const { selectedTenantIds, assignedTenants } = useTenantContext();
    const { userData } = useUserContext();
    
    const [ticket, setTicket] = useState<TicketData | null>(null);
    const [loading, setLoading] = useState(true);
    const [severity, setSeverity] = useState<'Low' | 'Medium' | 'High'>('High');
    const [mitreStages, setMitreStages] = useState<MitreTactic[]>([]);
    const [status, setStatus] = useState<string>('');
    const [artifactsAndAssets, setArtifactsAndAssets] = useState<ArtifactsAndAssets | null>(null);
    const [relatedAlertsData, setRelatedAlertsData] = useState<RelatedAlertsData>({});
    const [activeRelatedAlertCategoryKey, setActiveRelatedAlertCategoryKey] = useState<string>('');
    const [alertAnalysis, setAlertAnalysis] = useState<AlertAnalysis | null>(null);
    const [alertFields, setAlertFields] = useState<AlertFields | null>(null);
    const [assignedToUsers, setAssignedToUsers] = useState<Array<{ value: string; label: string }>>([]);
    const [selectedAssignedTo, setSelectedAssignedTo] = useState<{ value: string; label: string } | null>(null);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [showClosureModal, setShowClosureModal] = useState(false);
    const [closureForm, setClosureForm] = useState({
        category: '',
        reason: ''
    });
    const [aiTuningForm, setAiTuningForm] = useState({
        suppressionCountPerDay: 25,
        scopeType: 'policy',
        scopeValue: '',
        suggestionType: 'Genuine activity',
        validUntilDate: new Date().toISOString().slice(0, 10),
        permanent: false,
        suggestionText: '',
    });
    const [aiTuningSaving, setAiTuningSaving] = useState(false);
    const [aiTuningMessage, setAiTuningMessage] = useState<string | null>(null);
    const [aiTuningError, setAiTuningError] = useState<string | null>(null);
    const [existingSuggestions, setExistingSuggestions] = useState<Record<string, Record<string, { suggestion_type: string; valid_until: string | 'permanent'; permanent: boolean; suggestion_text: string }>> | null>(null);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);

    const relatedAlertCategories = useMemo(() => {
        return Object.entries(relatedAlertsData || {}).map(([entityType, entities]) => ({
            key: entityType,
            entityType,
            entities: (entities || {}) as Record<string, RelatedAlert[]>,
        }));
    }, [relatedAlertsData]);

    useEffect(() => {
        if (relatedAlertCategories.length === 0) {
            if (activeRelatedAlertCategoryKey) setActiveRelatedAlertCategoryKey('');
            return;
        }

        const stillExists = relatedAlertCategories.some((c) => c.key === activeRelatedAlertCategoryKey);
        if (!activeRelatedAlertCategoryKey || !stillExists) {
            setActiveRelatedAlertCategoryKey(relatedAlertCategories[0].key);
        }
    }, [relatedAlertCategories, activeRelatedAlertCategoryKey]);

    const overviewAttributeRows = useMemo(() => {
        const baseRows: Array<{ label: string; value: string }> = [
            { label: 'ID', value: String(ticket?.id ?? 'N/A') },
            { label: 'Source ID', value: String(ticket?.source_id || 'N/A') },
            { label: 'Occurred At', value: formatUtcToUserTimezone(ticket?.occurred_at, userData?.timezone || 'UTC') },
            { label: 'Name', value: String(ticket?.name || 'N/A') },
            { label: 'Severity', value: String(ticket?.severity || 'N/A') },
            { label: 'Instance Name', value: String(ticket?.instance_name || 'N/A') },
            { label: 'Tenant Name', value: String(ticket?.tenant_name || 'N/A') },
        ];

        const dynamicRows = alertFields && Object.keys(alertFields).length > 0
            ? Object.entries(alertFields).map(([key, value]) => ({
                label: key,
                value: formatAttributeDisplayValue(value),
            }))
            : [];

        return [...baseRows, ...dynamicRows];
    }, [ticket, userData?.timezone, alertFields]);

    const renderEntityCard = useCallback((item: ArtifactItem | AssetItem, key: string, monospaceValue = false) => (
        <Card key={key} className="border custom-card mb-0">
            <Card.Body className="py-3 px-3">
                <div className="d-flex flex-column gap-2">
                    <div className="d-flex justify-content-between align-items-center">
                        <div className="flex-fill">
                            <p className={`fs-14 fw-medium mb-0 ${monospaceValue ? 'font-monospace' : ''} text-break`}>{item.value}</p>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                            {'score' in item && item.score !== undefined && (
                                <div className="text-center">
                                    <div className={`fs-14 fw-semibold ${item.score === 0 ? 'text-muted' : `text-${item.color || 'primary'}`}`}>{item.score}</div>
                                    <div className="fs-10 text-muted">Score</div>
                                </div>
                            )}
                            {item.alerts !== undefined && (
                                <div className="text-center">
                                    <div className="fs-14 fw-semibold text-primary">{item.alerts}</div>
                                    <div className="fs-10 text-muted">Alerts</div>
                                </div>
                            )}
                        </div>
                    </div>
                    {item.detail && <p className="fs-11 text-muted mb-0 text-break">{item.detail}</p>}
                </div>
            </Card.Body>
        </Card>
    ), []);

    const overviewEntityAccordionItems = useMemo(() => {
        const ipFamilyClass = 'custom-accordion-primary';
        const assetFamilyClass = 'custom-accordion-danger';

        const categories: Array<{ id: string; title: string; values: Array<ArtifactItem | AssetItem>; emptyLabel: string; monospace?: boolean }> = [
            { id: 'ip_addresses', title: 'IP Addresses', values: artifactsAndAssets?.artifacts?.ip_addresses || [], emptyLabel: 'No IP addresses' },
            { id: 'urls', title: 'URLs', values: artifactsAndAssets?.artifacts?.urls || [], emptyLabel: 'No URLs' },
            { id: 'domains', title: 'Domains', values: artifactsAndAssets?.artifacts?.domains || [], emptyLabel: 'No domains' },
            { id: 'hashes', title: 'Hashes', values: artifactsAndAssets?.artifacts?.hashes || [], emptyLabel: 'No hashes', monospace: true },
            { id: 'assets', title: 'Assets', values: artifactsAndAssets?.assets || [], emptyLabel: 'No assets' },
            { id: 'users', title: 'Users', values: artifactsAndAssets?.users || [], emptyLabel: 'No users' },
        ];

        return categories.map((cat) => ({
            id: cat.id,
            count: cat.values.length,
            title: `${cat.title} (${cat.values.length})`,
            itemClass: ['ip_addresses', 'urls', 'domains', 'hashes'].includes(cat.id)
                ? ipFamilyClass
                : assetFamilyClass,
            bodyClass: '',
            content: cat.values.length > 0 ? (
                <div className="d-flex flex-column gap-2">
                    {cat.values.map((item, index) => renderEntityCard(item, `${cat.id}-${index}`, Boolean(cat.monospace)))}
                </div>
            ) : (
                <p className="fs-12 text-muted mb-0">{cat.emptyLabel}</p>
            ),
        }));
    }, [artifactsAndAssets, renderEntityCard]);

    const [ticketNotes, setTicketNotes] = useState<TicketNote[]>([]);
    const [noteEditorContent, setNoteEditorContent] = useState('');
    const [noteEditorKey, setNoteEditorKey] = useState(0);
    const [notesSaving, setNotesSaving] = useState(false);
    const [noteLightboxOpen, setNoteLightboxOpen] = useState(false);
    const [noteLightboxSlides, setNoteLightboxSlides] = useState<{ src: string }[]>([]);
    const [noteLightboxIndex, setNoteLightboxIndex] = useState(0);
    const noteEditorRef = React.useRef<{ insertImage?: (files: FileList | File[]) => void } | null>(null);
    const noteImageInputRef = React.useRef<HTMLInputElement>(null);

    const [irAgentInput, setIrAgentInput] = useState('');
    const [irAgentMessages, setIrAgentMessages] = useState<{ id: number; role: 'user' | 'assistant'; content: string }[]>([]);
    const [irAgentStreaming, setIrAgentStreaming] = useState(false);
    const [irAgentButtonText, setIrAgentButtonText] = useState<string>('Thinking...');
    const [irAgentPendingAssistantId, setIrAgentPendingAssistantId] = useState<number | null>(null);
    const irAgentAbortRef = React.useRef<AbortController | null>(null);
    const irAgentMessagesEndRef = React.useRef<HTMLDivElement | null>(null);
    const irAgentStatusIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

    const startIrAgentStatusCycle = () => {
        setIrAgentButtonText('Thinking...');
        if (irAgentStatusIntervalRef.current) {
            clearInterval(irAgentStatusIntervalRef.current);
            irAgentStatusIntervalRef.current = null;
        }

        irAgentStatusIntervalRef.current = setInterval(() => {
            setIrAgentButtonText((prev) =>
                prev === 'Thinking...' ? 'Checking Knowledgebase....' : 'Thinking...'
            );
        }, 2000);
    };

    const stopIrAgentStatusCycle = () => {
        if (irAgentStatusIntervalRef.current) {
            clearInterval(irAgentStatusIntervalRef.current);
            irAgentStatusIntervalRef.current = null;
        }
    };

    const handleNoteContentClick = (e: React.MouseEvent) => {
        const target = e.target;
        if (!(target instanceof HTMLImageElement)) return;
        const container = target.closest('.ticket-note-content');
        if (!container) return;
        e.preventDefault();
        const imgs = Array.from(container.querySelectorAll('img'));
        const slides = imgs.map((img) => ({ src: img.currentSrc || img.getAttribute('src') || '' })).filter((s) => s.src);
        const index = imgs.indexOf(target);
        if (slides.length) {
            setNoteLightboxSlides(slides);
            setNoteLightboxIndex(index >= 0 ? index : 0);
            setNoteLightboxOpen(true);
        }
    };

    const handleNoteImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files?.length && noteEditorRef.current?.insertImage) {
            noteEditorRef.current.insertImage(files);
        }
        e.target.value = '';
    };

    useEffect(() => {
        if (irAgentMessagesEndRef.current) {
            irAgentMessagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }, [irAgentMessages]);

    useEffect(() => {
        return () => {
            stopIrAgentStatusCycle();
        };
    }, []);

    const handleIrAgentAsk = async () => {
        if (!irAgentInput.trim() || irAgentStreaming) return;

        const question = irAgentInput.trim();
        setIrAgentInput('');

        const userMessageId = Date.now();
        const assistantMessageId = userMessageId + 1;

        setIrAgentMessages((prev) => [
            ...prev,
            { id: userMessageId, role: 'user', content: question },
            { id: assistantMessageId, role: 'assistant', content: '' },
        ]);

        const controller = new AbortController();
        irAgentAbortRef.current = controller;
        setIrAgentStreaming(true);
        startIrAgentStatusCycle();
        setIrAgentPendingAssistantId(assistantMessageId);

        let assistantContent = '';
        let assistantErrorMessage: string | null = null;

        try {
            const response = await fetch("https://khuspeshubham--ir-agent-agent-endpoint.modal.run/", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Network@5714',
                },
                body: JSON.stringify({ input: question, stream: true }),
                signal: controller.signal,
            });

            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`);
            }

            if (!response.body) {
                throw new Error('No response body received from IR Agent.');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                if (!chunk) continue;

                buffer += chunk;
                const lines = buffer.split('\n');
                buffer = lines.pop() ?? '';

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed) continue;
                    try {
                        // Support both "JSON-per-line" and "SSE-style: data: {...}" payloads.
                        const jsonCandidate = trimmed.startsWith('data:')
                            ? trimmed.replace(/^data:\s*/, '')
                            : trimmed;

                        const parsed = JSON.parse(jsonCandidate) as { type?: string; content?: string };
                        const chunkType = (parsed.type ?? '').toString().toLowerCase();
                        const chunkContent = parsed.content;

                        if (typeof chunkContent === 'string' && chunkContent) {
                            // Prefer existing "item" chunks, but also accept other types that look webhook-related.
                            if (!parsed.type || chunkType === 'item' || chunkType.includes('webhook')) {
                                assistantContent += chunkContent;
                            }
                        }
                    } catch {
                        // Ignore malformed JSON lines
                    }
                }
            }
        } catch (error: any) {
            const message =
                error?.name === 'AbortError'
                    ? 'Stopped.'
                    : (error?.message || 'Failed to reach IR Agent.');

            assistantErrorMessage = error?.name === 'AbortError' ? message : `Error: ${message}`;
        } finally {
            stopIrAgentStatusCycle();
            setIrAgentStreaming(false);
            irAgentAbortRef.current = null;
            setIrAgentPendingAssistantId(null);

            setIrAgentMessages((prev) =>
                prev.map((msg) =>
                    msg.id === assistantMessageId
                        ? { ...msg, content: assistantErrorMessage ?? assistantContent }
                        : msg
                )
            );
        }
    };

    const handleIrAgentStop = () => {
        if (irAgentAbortRef.current) {
            irAgentAbortRef.current.abort();
        }
    };

    // Function to export raw_logs to CSV
    const handleExportLogs = () => {
        if (!ticket) {
            alert('No ticket data available');
            return;
        }

        // Parse raw_logs the same way as in the display
        const rawLogs = (() => {
            const val = ticket.raw_logs;
            if (val == null) return [];
            if (Array.isArray(val)) return val;
            if (typeof val === 'string') {
                try { return JSON.parse(val) as unknown[]; } catch { return []; }
            }
            return [];
        })();

        if (rawLogs.length === 0) {
            alert('No raw logs available to export');
            return;
        }

        // Helper to check if value is a plain object (not array, not null)
        const isPlainObject = (val: any): boolean => {
            return typeof val === 'object' && val !== null && !Array.isArray(val);
        };

        // Helper to escape CSV values
        const escapeCsvValue = (val: any): string => {
            if (val === null || val === undefined) {
                return '""';
            }
            if (typeof val === 'object') {
                return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
            }
            return `"${String(val).replace(/"/g, '""')}"`;
        };

        // Parse each log item - handle JSON strings
        const parsedLogs = rawLogs.map((log: any) => {
            if (typeof log === 'string') {
                try {
                    const parsed = JSON.parse(log);
                    return isPlainObject(parsed) || Array.isArray(parsed) ? parsed : log;
                } catch {
                    return log;
                }
            }
            return log;
        });
        
        // Convert to CSV
        let csvContent = '';
        const firstLog = parsedLogs[0];
        
        if (isPlainObject(firstLog)) {
            // Array of objects - create CSV with headers
            const allKeys = new Set<string>();
            parsedLogs.forEach((log: any) => {
                if (isPlainObject(log)) {
                    Object.keys(log).forEach(key => allKeys.add(key));
                }
            });
            
            const headers = Array.from(allKeys).sort();
            csvContent += headers.map(h => escapeCsvValue(h)).join(',') + '\n';
            
            // Add rows
            parsedLogs.forEach((log: any) => {
                const row = headers.map(header => {
                    const value = isPlainObject(log) ? log[header] : null;
                    return escapeCsvValue(value);
                });
                csvContent += row.join(',') + '\n';
            });
        } else {
            // Array of strings or primitives - simple CSV with one column
            csvContent += '"Log Entry"\n';
            parsedLogs.forEach((log: any) => {
                const value = typeof log === 'string' ? log : JSON.stringify(log);
                csvContent += escapeCsvValue(value) + '\n';
            });
        }

        // Create blob and download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `Alert-${ticket.id}-logs.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleSeverityChange = async (eventKey: string | null) => {
        if (!ticket || !eventKey) return;

        let newSeverity: 'Low' | 'Medium' | 'High';
        if (eventKey === 'low') {
            newSeverity = 'Low';
        } else if (eventKey === 'medium') {
            newSeverity = 'Medium';
        } else {
            newSeverity = 'High';
        }

        setSeverity(newSeverity);

        try {
            // Update severity in Supabase
            const { error } = await supabase
                .from('tickets')
                .update({ severity: newSeverity, updated_at: new Date().toISOString() })
                .eq('id', ticket.id)
                .eq('tenant_id', ticket.tenant_id);

            if (error) {
                console.error('Error updating severity:', error);
                // Revert severity on error
                if (ticket.severity) {
                    const sev = ticket.severity.toLowerCase();
                    if (sev === 'critical' || sev === 'high') {
                        setSeverity('High');
                    } else if (sev === 'medium') {
                        setSeverity('Medium');
                    } else {
                        setSeverity('Low');
                    }
                }
                alert('Failed to update severity. Please try again.');
            } else {
                // Update local ticket state
                setTicket({ ...ticket, severity: newSeverity, updated_at: new Date().toISOString() });
            }
        } catch (error) {
            console.error('Error updating severity:', error);
            // Revert severity on error
            if (ticket.severity) {
                const sev = ticket.severity.toLowerCase();
                if (sev === 'critical' || sev === 'high') {
                    setSeverity('High');
                } else if (sev === 'medium') {
                    setSeverity('Medium');
                } else {
                    setSeverity('Low');
                }
            }
            alert('Failed to update severity. Please try again.');
        }
    };

    const getSeverityVariant = () => {
        if (severity === 'High') return 'danger';
        if (severity === 'Medium') return 'orange';
        return 'success';
    };

    const getStatusVariant = () => {
        return 'light';
    };

    const handleStatusDropdownChange = async (eventKey: string | null) => {
        if (!ticket || !eventKey) return;

        const newStatus = eventKey === 'open' ? 'open' : 'closed';
        
        // If closing the ticket (or already closed and user wants to edit), show closure modal
        if (newStatus === 'closed') {
            // If ticket is already closed, populate form with existing values
            if (ticket.status === 'closed') {
                setClosureForm({
                    category: ticket.closure_category || '',
                    reason: ticket.closure_reason || ''
                });
            }
            setShowClosureModal(true);
        } else {
            // If opening, just update status directly
            await handleStatusChange({ value: newStatus });
        }
    };

    // Fetch ticket data from Supabase
    useEffect(() => {
        const fetchTicket = async () => {
            if (!ticketId) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                
                // Determine tenant filter
                let tenantFilter: string[] = [];
                if (selectedTenantIds === 'all') {
                    tenantFilter = assignedTenants.map(t => t.id);
                } else if (Array.isArray(selectedTenantIds)) {
                    tenantFilter = selectedTenantIds;
                } else if (typeof selectedTenantIds === 'string' && selectedTenantIds !== 'all') {
                    tenantFilter = [selectedTenantIds];
                }

                // Build query
                let query = supabase
                    .from('tickets')
                    .select('*')
                    .eq('id', parseInt(ticketId));

                // Apply tenant filter
                if (tenantFilter.length > 0) {
                    query = query.in('tenant_id', tenantFilter);
                }

                const { data, error } = await query.single();

                if (error) {
                    console.error('Error fetching ticket:', error);
                    setLoading(false);
                    return;
                }

                if (data) {
                    setTicket(data);
                    setTicketNotes(normalizeNotesFromDb(data.notes));

                    // Set status from ticket data
                    if (data.status) {
                        setStatus(data.status);
                    }
                    
                    // Set severity from ticket data
                    if (data.severity) {
                        const sev = data.severity.toLowerCase();
                        if (sev === 'critical' || sev === 'high') {
                            setSeverity('High');
                        } else if (sev === 'medium') {
                            setSeverity('Medium');
                        } else {
                            setSeverity('Low');
                        }
                    }
                    
                    // Set initial assigned_to value
                    if (data.assigned_to) {
                        setSelectedAssignedTo({ value: data.assigned_to, label: data.assigned_to });
                    } else {
                        setSelectedAssignedTo(null);
                    }
                    
                    // Set initial closure form values if ticket is closed
                    if (data.status === 'closed') {
                        setClosureForm({
                            category: data.closure_category || '',
                            reason: data.closure_reason || ''
                        });
                    }

                    // Parse MITRE data
                    if (data.mitre) {
                        let mitreData: MitreTactic[] = [];
                        if (typeof data.mitre === 'string') {
                            try {
                                mitreData = JSON.parse(data.mitre);
                            } catch (e) {
                                console.error('Error parsing MITRE data:', e);
                            }
                        } else if (Array.isArray(data.mitre)) {
                            mitreData = data.mitre;
                        }

                        // Ensure all 12 tactics are present
                        const allTactics = [
                            'Initial Access',
                            'Execution',
                            'Persistence',
                            'Privilege Escalation',
                            'Defense Evasion',
                            'Credential Access',
                            'Discovery',
                            'Lateral Movement',
                            'Collection',
                            'Command and Control',
                            'Exfiltration',
                            'Impact'
                        ];

                        const mitreMap = new Map(mitreData.map(t => [t.name, t]));
                        const completeMitreData = allTactics.map(name => {
                            const existing = mitreMap.get(name);
                            return existing || { name, count: 0, active: false };
                        });

                        setMitreStages(completeMitreData);
                    } else {
                        // Default empty MITRE stages
                        setMitreStages([
                            { name: 'Initial Access', count: 0, active: false },
                            { name: 'Execution', count: 0, active: false },
                            { name: 'Persistence', count: 0, active: false },
                            { name: 'Privilege Escalation', count: 0, active: false },
                            { name: 'Defense Evasion', count: 0, active: false },
                            { name: 'Credential Access', count: 0, active: false },
                            { name: 'Discovery', count: 0, active: false },
                            { name: 'Lateral Movement', count: 0, active: false },
                            { name: 'Collection', count: 0, active: false },
                            { name: 'Command and Control', count: 0, active: false },
                            { name: 'Exfiltration', count: 0, active: false },
                            { name: 'Impact', count: 0, active: false }
                        ]);
                    }
                    
                    // Parse artifacts_and_assets data
                    if (data.artifacts_and_assets) {
                        let artifactsData: ArtifactsAndAssets | null = null;
                        if (typeof data.artifacts_and_assets === 'string') {
                            try {
                                artifactsData = JSON.parse(data.artifacts_and_assets);
                            } catch (e) {
                                console.error('Error parsing artifacts_and_assets data:', e);
                            }
                        } else if (typeof data.artifacts_and_assets === 'object') {
                            artifactsData = data.artifacts_and_assets;
                        }
                        setArtifactsAndAssets(artifactsData);
                    }
                    
                    // Parse alert_analysis data
                    if (data.alert_analysis) {
                        let analysisData: AlertAnalysis | null = null;
                        if (typeof data.alert_analysis === 'string') {
                            try {
                                analysisData = JSON.parse(data.alert_analysis);
                            } catch (e) {
                                console.error('Error parsing alert_analysis data:', e);
                            }
                        } else if (typeof data.alert_analysis === 'object') {
                            analysisData = data.alert_analysis;
                        }
                        setAlertAnalysis(analysisData);
                    } else {
                        setAlertAnalysis(null);
                    }
                    
                    // Parse alert_fields data
                    if (data.alert_fields) {
                        let fieldsData: AlertFields | null = null;
                        if (typeof data.alert_fields === 'string') {
                            try {
                                const parsed = JSON.parse(data.alert_fields);
                                // Only set if parsed result is an object with keys
                                if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
                                    fieldsData = parsed;
                                } else {
                                    fieldsData = null;
                                }
                            } catch (e) {
                                console.error('Error parsing alert_fields data:', e);
                                fieldsData = null;
                            }
                        } else if (typeof data.alert_fields === 'object' && Object.keys(data.alert_fields).length > 0) {
                            fieldsData = data.alert_fields;
                        } else {
                            fieldsData = null;
                        }
                        setAlertFields(fieldsData);
                    } else {
                        setAlertFields(null);
                    }
                    
                    // Parse related_alerts data
                    if (data.related_alerts) {
                        let relatedAlertsData: RelatedAlertsData = {};
                        if (typeof data.related_alerts === 'string') {
                            try {
                                const parsed = JSON.parse(data.related_alerts);
                                if (parsed && typeof parsed === 'object') {
                                    // Normalize the data structure
                                    relatedAlertsData = normalizeRelatedAlerts(parsed);
                                }
                            } catch (e) {
                                console.error('Error parsing related_alerts data:', e);
                            }
                        } else if (typeof data.related_alerts === 'object') {
                            relatedAlertsData = normalizeRelatedAlerts(data.related_alerts);
                        }
                        setRelatedAlertsData(relatedAlertsData);
                    } else {
                        setRelatedAlertsData({});
                    }
                }
            } catch (error) {
                console.error('Error fetching ticket:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTicket();
    }, [ticketId, selectedTenantIds, assignedTenants]);

    // Fetch users from user_tenants filtered by assignedTenants
    const fetchAssignedToUsers = useCallback(async () => {
        if (!assignedTenants || assignedTenants.length === 0) {
            setAssignedToUsers([]);
            return;
        }

        try {
            setLoadingUsers(true);
            const tenantIds = assignedTenants.map(t => t.id);

            // Fetch users from user_tenants where tenant_id matches assignedTenants
            const { data: userTenantsData, error: userTenantsError } = await supabase
                .from('user_tenants')
                .select('username')
                .in('tenant_id', tenantIds);

            if (userTenantsError) {
                console.error('Error fetching user tenants:', userTenantsError);
                setAssignedToUsers([]);
                return;
            }

            if (!userTenantsData || userTenantsData.length === 0) {
                setAssignedToUsers([]);
                return;
            }

            // Get unique usernames - filter out null, undefined, and empty strings
            const uniqueUsernames = [...new Set(
                userTenantsData
                    .map(ut => ut.username)
                    .filter(username => username && typeof username === 'string' && username.trim() !== '')
            )];

            // Map to options format
            const users = uniqueUsernames.map(username => ({
                value: username,
                label: username
            }));

            setAssignedToUsers(users);
        } catch (error) {
            console.error('Error fetching assigned to users:', error);
            setAssignedToUsers([]);
        } finally {
            setLoadingUsers(false);
        }
    }, [assignedTenants]);

    // Fetch users when assignedTenants changes
    useEffect(() => {
        if (assignedTenants && assignedTenants.length > 0) {
            fetchAssignedToUsers();
        } else {
            setAssignedToUsers([]);
        }
    }, [assignedTenants, fetchAssignedToUsers]);

    // Fetch existing AI tuning suggestions (latest investigation_context) for the right panel
    useEffect(() => {
        if (!ticket) return;
        const SCOPE_KEYS_LIST = ['ips', 'urls', 'users', 'assets', 'hashes', 'policy', 'domains'];
        type SuggestionMap = Record<string, Record<string, { suggestion_type: string; valid_until: string | 'permanent'; permanent: boolean; suggestion_text: string }>>;
        const empty = (): SuggestionMap => ({ ips: {}, urls: {}, users: {}, assets: {}, hashes: {}, policy: {}, domains: {} });
        const isEntry = (v: unknown): v is { suggestion_type?: string; valid_until?: string; permanent?: boolean; suggestion_text?: string } =>
            v !== null && typeof v === 'object' && !Array.isArray(v);
        const normalizeSuggestion = (raw: unknown): SuggestionMap => {
            const out: SuggestionMap = empty();
            if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
            const obj = raw as Record<string, unknown>;
            for (const key of SCOPE_KEYS_LIST) {
                const val = obj[key];
                if (val && typeof val === 'object' && !Array.isArray(val)) {
                    const entries: Record<string, { suggestion_type: string; valid_until: string | 'permanent'; permanent: boolean; suggestion_text: string }> = {};
                    for (const [scopeVal, entry] of Object.entries(val as Record<string, unknown>)) {
                        if (isEntry(entry)) {
                            entries[scopeVal] = {
                                suggestion_type: typeof entry.suggestion_type === 'string' ? entry.suggestion_type : '',
                                valid_until: entry.valid_until === 'permanent' ? 'permanent' : (typeof entry.valid_until === 'string' ? entry.valid_until : 'permanent'),
                                permanent: Boolean(entry.permanent),
                                suggestion_text: typeof entry.suggestion_text === 'string' ? entry.suggestion_text : '',
                            };
                        }
                    }
                    out[key] = entries;
                }
            }
            return out;
        };

        const policyNameForPanel = (ticket.name?.trim() ?? '') || `__ticket_${ticket.id}`;
        let cancelled = false;
        setLoadingSuggestions(true);
        supabase
            .from('investigation_context')
            .select('suggestion')
            .eq('tenant_id', ticket.tenant_id)
            .eq('policy_name', policyNameForPanel)
            .order('id', { ascending: false })
            .limit(1)
            .maybeSingle()
            .then(({ data, error }) => {
                if (cancelled) return;
                setLoadingSuggestions(false);
                if (error) {
                    console.error('Error fetching investigation_context for suggestions:', error);
                    setExistingSuggestions(empty());
                    return;
                }
                setExistingSuggestions(data?.suggestion ? normalizeSuggestion(data.suggestion) : empty());
            });
        return () => { cancelled = true; };
    }, [ticket?.id, ticket?.tenant_id, ticket?.name]);

    useEffect(() => {
        if (!ticket || aiTuningForm.scopeType !== 'policy') return;
        const name = ticket.name?.trim() ?? '';
        setAiTuningForm((prev) => (prev.scopeValue === name ? prev : { ...prev, scopeValue: name }));
    }, [ticket?.id, ticket?.name, aiTuningForm.scopeType]);

    const handleAddNote = async () => {
        const text = (noteEditorContent || '').replace(/<[^>]*>/g, '').trim();
        if (!text || !ticket) return;
        const loggedInUsername = userData?.username ?? 'You';
        const initial = loggedInUsername.charAt(0).toUpperCase();
        const newNote: TicketNote = {
            id: Date.now(),
            author: loggedInUsername,
            authorInitial: initial,
            content: noteEditorContent || text,
            createdAt: new Date().toISOString(),
        };
        const updatedNotes = [newNote, ...ticketNotes];
        setTicketNotes(updatedNotes);
        setNoteEditorContent('');
        setNoteEditorKey((k) => k + 1);

        setNotesSaving(true);
        try {
            const { error } = await supabase
                .from('tickets')
                .update({
                    notes: updatedNotes,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', ticket.id)
                .eq('tenant_id', ticket.tenant_id);

            if (error) {
                console.error('Error saving note to ticket:', error);
                setTicketNotes(ticketNotes);
            }
        } finally {
            setNotesSaving(false);
        }
    };

    const rawLogsCount = React.useMemo(() => {
        const val = ticket?.raw_logs;
        if (val == null) return 0;
        if (Array.isArray(val)) return val.length;
        if (typeof val === 'string') {
            try { return (JSON.parse(val) as unknown[]).length; } catch { return 0; }
        }
        return 0;
    }, [ticket?.raw_logs]);

    const RELATED_ALERTS_TOP_KEYS = ['ips', 'urls', 'users', 'assets', 'hashes', 'domains'] as const;
    const relatedAlertsCount = React.useMemo(() => {
        let total = 0;
        for (const key of RELATED_ALERTS_TOP_KEYS) {
            const entities = relatedAlertsData[key];
            if (entities && typeof entities === 'object' && !Array.isArray(entities)) {
                total += Object.keys(entities).length;
            }
        }
        return total;
    }, [relatedAlertsData]);

    const suggestionsCount = React.useMemo(() => {
        if (!existingSuggestions) return 0;
        let total = 0;
        for (const key of ['ips', 'urls', 'users', 'assets', 'hashes', 'policy', 'domains']) {
            const scopeEntries = existingSuggestions[key];
            if (scopeEntries && typeof scopeEntries === 'object') {
                total += Object.keys(scopeEntries).length;
            }
        }
        return total;
    }, [existingSuggestions]);

    // Handle assigned to change
    const handleAssignedToChange = async (selectedOption: any) => {
        if (!ticket || !selectedOption) return;

        const selectedUsername = selectedOption.value;
        const previousOption = ticket.assigned_to 
            ? assignedToUsers.find(u => u.value === ticket.assigned_to) || null 
            : null;
        
        setSelectedAssignedTo(selectedOption);

        try {
            // Update assigned_to in Supabase
            const { error } = await supabase
                .from('tickets')
                .update({ assigned_to: selectedUsername, updated_at: new Date().toISOString() })
                .eq('id', ticket.id)
                .eq('tenant_id', ticket.tenant_id);

            if (error) {
                console.error('Error updating assigned_to:', error);
                setSelectedAssignedTo(previousOption);
                alert('Failed to update assigned to. Please try again.');
            } else {
                // Update local ticket state
                setTicket({ ...ticket, assigned_to: selectedUsername, updated_at: new Date().toISOString() });
            }
        } catch (error) {
            console.error('Error updating assigned_to:', error);
            setSelectedAssignedTo(previousOption);
            alert('Failed to update assigned to. Please try again.');
        }
    };

    const handleAssignedToDropdownChange = async (eventKey: string | null) => {
        if (!eventKey || loadingUsers) return;
        const selectedOption = assignedToUsers.find((user) => user.value === eventKey);
        if (!selectedOption) return;
        await handleAssignedToChange(selectedOption);
    };

    // Handle status change
    const handleStatusChange = async (selectedOption: any) => {
        if (!ticket || !selectedOption) return;

        const newStatus = selectedOption.value;
        setStatus(newStatus);

        try {
            // Update status in Supabase
            const { error } = await supabase
                .from('tickets')
                .update({ status: newStatus, updated_at: new Date().toISOString() })
                .eq('id', ticket.id)
                .eq('tenant_id', ticket.tenant_id);

            if (error) {
                console.error('Error updating status:', error);
                // Revert status on error
                setStatus(ticket.status);
                alert('Failed to update status. Please try again.');
            } else {
                // Update local ticket state
                setTicket({ ...ticket, status: newStatus, updated_at: new Date().toISOString() });
            }
        } catch (error) {
            console.error('Error updating status:', error);
            setStatus(ticket.status);
            alert('Failed to update status. Please try again.');
        }
    };

    // Handle closure modal close
    const handleClosureModalClose = () => {
        setShowClosureModal(false);
        // Reset form to existing values if ticket is already closed, otherwise clear
        if (ticket && ticket.status === 'closed') {
            setClosureForm({
                category: ticket.closure_category || '',
                reason: ticket.closure_reason || ''
            });
        } else {
            setClosureForm({ category: '', reason: '' });
        }
    };

    // Handle closure form submission
    const handleClosureSubmit = async () => {
        if (!ticket) return;

        if (!closureForm.category || !closureForm.reason) {
            alert('Please fill in both Closure Category and Closure Reason');
            return;
        }

        try {
            // Update ticket with status, closure category, and reason
            const { error } = await supabase
                .from('tickets')
                .update({
                    status: 'closed',
                    closure_category: closureForm.category,
                    closure_reason: closureForm.reason,
                    updated_at: new Date().toISOString()
                })
                .eq('id', ticket.id)
                .eq('tenant_id', ticket.tenant_id);

            if (error) {
                console.error('Error closing ticket:', error);
                alert('Failed to close ticket. Please try again.');
            } else {
                // Update local ticket state
                setTicket({ 
                    ...ticket, 
                    status: 'closed',
                    closure_category: closureForm.category,
                    closure_reason: closureForm.reason,
                    updated_at: new Date().toISOString() 
                });
                setStatus('closed');
                
                // Close modal and clear form
                handleClosureModalClose();
                alert('Ticket closed successfully');
            }
        } catch (error) {
            console.error('Error closing ticket:', error);
            alert('Failed to close ticket. Please try again.');
        }
    };

    /** Suggestion column shape: scope keys (ips, urls, users, assets, hashes, policy, domains);
     * each scope key holds { [scope-value]: { suggestion_type, valid_until, permanent, suggestion_text } }. */
    const SCOPE_KEYS = ['ips', 'urls', 'users', 'assets', 'hashes', 'policy', 'domains'] as const;

    const emptySuggestionStructure = (): Record<string, Record<string, { suggestion_type: string; valid_until: string | 'permanent'; permanent: boolean; suggestion_text: string }>> => ({
        ips: {},
        urls: {},
        users: {},
        assets: {},
        hashes: {},
        policy: {},
        domains: {},
    });

    type SuggestionEntry = { suggestion_type: string; valid_until: string | 'permanent'; permanent: boolean; suggestion_text: string };

    const buildNewSuggestionEntry = (): SuggestionEntry => {
        const { suggestionType, validUntilDate, permanent, suggestionText } = aiTuningForm;
        let validUntil: string | 'permanent' = 'permanent';
        if (!permanent && validUntilDate) {
            const date = new Date(validUntilDate);
            if (!isNaN(date.getTime())) {
                date.setUTCHours(0, 0, 0, 0);
                validUntil = date.toISOString();
            }
        }
        const normalizedSuggestionType = suggestionType
            ? suggestionType.replace(/\s+/g, '_').toLowerCase()
            : '';
        return {
            suggestion_type: normalizedSuggestionType,
            valid_until: validUntil,
            permanent,
            suggestion_text: suggestionText,
        };
    };

    /** Merges existing suggestion object with new entry: preserves all other keys; same scope-value under same key is updated. */
    const mergeSuggestionIntoExisting = (
        existing: unknown,
        scopeKey: string,
        scopeValue: string,
        newEntry: SuggestionEntry
    ): Record<string, Record<string, SuggestionEntry>> => {
        const merged = emptySuggestionStructure();
        const isScopeObject = (v: unknown): v is Record<string, SuggestionEntry> =>
            v !== null && typeof v === 'object' && !Array.isArray(v);
        if (existing && typeof existing === 'object' && !Array.isArray(existing)) {
            for (const key of SCOPE_KEYS) {
                const val = (existing as Record<string, unknown>)[key];
                if (isScopeObject(val)) merged[key] = { ...val };
            }
        }
        if (!merged[scopeKey]) merged[scopeKey] = {};
        merged[scopeKey][scopeValue] = newEntry;
        return merged;
    };

    const handleAiTuningSubmit = async () => {
        if (!ticket) return;

        if (!aiTuningForm.scopeValue || !aiTuningForm.suggestionText) {
            setAiTuningError('Please provide both Scope value and Suggestion.');
            setAiTuningMessage(null);
            return;
        }

        const scopeKey = SCOPE_KEYS.includes(aiTuningForm.scopeType as (typeof SCOPE_KEYS)[number]) ? aiTuningForm.scopeType : 'policy';
        const newEntry = buildNewSuggestionEntry();

        setAiTuningSaving(true);
        setAiTuningError(null);
        setAiTuningMessage(null);

        const loggedInUsername = userData?.username ?? '';
        const policyNameForRow = (ticket.name?.trim() ?? '') || `__ticket_${ticket.id}`;

        try {
            const { data: existingRow, error: fetchError } = await supabase
                .from('investigation_context')
                .select('id, suggestion')
                .eq('tenant_id', ticket.tenant_id)
                .eq('policy_name', policyNameForRow)
                .order('id', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (fetchError) {
                console.error('Error fetching investigation_context:', fetchError);
                setAiTuningError('Failed to load existing suggestions.');
                return;
            }

            const mergedSuggestion = mergeSuggestionIntoExisting(
                existingRow?.suggestion ?? null,
                scopeKey,
                aiTuningForm.scopeValue,
                newEntry
            );

            if (existingRow?.id != null) {
                const { error: updateError } = await supabase
                    .from('investigation_context')
                    .update({
                        suppression_count: aiTuningForm.suppressionCountPerDay,
                        suggestion: mergedSuggestion,
                        updated_by: loggedInUsername,
                    })
                    .eq('id', existingRow.id);

                if (updateError) {
                    console.error('Error updating investigation_context:', updateError);
                    setAiTuningError('Failed to save suggestion to investigation context.');
                } else {
                    setAiTuningMessage('Suggestion saved successfully.');
                    setExistingSuggestions(mergedSuggestion);
                }
            } else {
                const { error: insertError } = await supabase
                    .from('investigation_context')
                    .insert({
                        tenant_id: ticket.tenant_id,
                        policy_name: policyNameForRow,
                        suppression_count: aiTuningForm.suppressionCountPerDay,
                        suggestion: mergedSuggestion,
                        created_by: loggedInUsername,
                        updated_by: loggedInUsername,
                    });

                if (insertError) {
                    console.error('Error inserting into investigation_context:', insertError);
                    setAiTuningError('Failed to save suggestion to investigation context.');
                } else {
                    setAiTuningMessage('Suggestion saved successfully.');
                    setExistingSuggestions(mergedSuggestion);
                }
            }
        } catch (error) {
            console.error('Error saving AI tuning suggestion:', error);
            setAiTuningError('Unexpected error while saving suggestion.');
        } finally {
            setAiTuningSaving(false);
        }
    };

    const mitreAttackStages = [
        { value: 'initial-access', label: 'Initial Access' },
        { value: 'execution', label: 'Execution' },
        { value: 'persistence', label: 'Persistence' },
        { value: 'privilege-escalation', label: 'Privilege Escalation' },
        { value: 'defense-evasion', label: 'Defense Evasion' },
    ];

    // Calculate MITRE summary
    const activeTacticsCount = mitreStages.filter(t => t.active).length;
    const activeTechniquesCount = mitreStages.filter(t => t.active && t.count > 0).reduce((sum, t) => sum + t.count, 0);

    if (loading) {
        return (
            <Fragment>
                <Seo title="Ticket Details" />
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                    <Spinner animation="border" variant="primary" />
                </div>
            </Fragment>
        );
    }

    if (!ticket) {
        return (
            <Fragment>
                <Seo title="Ticket Details" />
                <Card className="custom-card mb-3 mt-3">
                    <Card.Body>
                        <div className="text-center py-4">
                            <p className="text-muted">Ticket not found</p>
                        </div>
                    </Card.Body>
                </Card>
            </Fragment>
        );
    }

    return (
        <Fragment>
            <Seo title="Ticket Details" />

            <Row className="g-0" style={{ marginLeft: "-1.5rem", marginRight: "-1.5rem" }}>
                <Col xxl={12} xl={12}>
            {/* Header Section */}
            <Card className="custom-card mb-0 ribbon-card overflow-hidden">
                {status?.toLowerCase() === 'closed' && (
                    <SpkRibbons ribbonClass="ribbon-6 ribbon-right ribbon-primary">
                        Closed
                    </SpkRibbons>
                )}
                <Card.Body>
                    <Row className="align-items-start">
                        <Col xl={8}>
                            <div className="mb-2 d-flex align-items-center gap-2">
                                <SpkButtongroup>
                                    <SpkDropdown 
                                        Togglevariant={getSeverityVariant()}
                                        Toggletext={severity}
                                        Customtoggleclass={`shadow-${getSeverityVariant()} btn-sm`}
                                        Customclass="severity-dropdown-wrapper"
                                        Size="sm"
                                        Menuas="ul"
                                        onSelectfunc={handleSeverityChange}
                                        Id="severity-dropdown"
                                    >
                                        <Dropdown.Item as="li" eventKey="high">High</Dropdown.Item>
                                        <Dropdown.Item as="li" eventKey="medium">Medium</Dropdown.Item>
                                        <Dropdown.Item as="li" eventKey="low">Low</Dropdown.Item>
                                    </SpkDropdown>
                                </SpkButtongroup>
                                <h5 className="fw-semibold mb-0">
                                    {ticket.name ? `INV-${ticket.id} : ${ticket.name}` : (ticket.title || `INV-${ticket.id}`)}
                                </h5>
                            </div>
                            <div className="mb-2">
                                <div className="fs-15 fw-medium mb-1">Description</div>
                                <p className="text-muted mb-0">
                                    {ticket.description || 'No description available.'}
                                </p>
                            </div>
                        </Col>
                        <Col xl={4} className="d-flex flex-column align-items-end pe-3">
                            <div className="d-flex justify-content-end align-items-start gap-2 w-100">
                                <div style={{ width: '150px' }}>
                                    <div className="fs-11 text-muted mb-1">Assigned To</div>
                                    <SpkButtongroup>
                                        <SpkDropdown
                                            Togglevariant={getStatusVariant()}
                                            Toggletext={
                                                loadingUsers
                                                    ? "Loading..."
                                                    : (selectedAssignedTo?.label || "Select user...")
                                            }
                                            Customtoggleclass={`shadow-${getStatusVariant()} btn-sm py-1 px-2 text-truncate`}
                                            Customclass="assigned-to-dropdown-wrapper"
                                            Size="sm"
                                            Menuas="ul"
                                            onSelectfunc={handleAssignedToDropdownChange}
                                            Id="assigned-to-dropdown"
                                        >
                                            {assignedToUsers.length > 0 ? (
                                                assignedToUsers.map((user) => (
                                                    <Dropdown.Item as="li" eventKey={user.value} key={user.value}>
                                                        {user.label}
                                                    </Dropdown.Item>
                                                ))
                                            ) : (
                                                <Dropdown.Item as="li" disabled>
                                                    No users available
                                                </Dropdown.Item>
                                            )}
                                        </SpkDropdown>
                                    </SpkButtongroup>
                                </div>
                                <div style={{ width: '150px' }}>
                                    <div className="fs-11 text-muted mb-1">Status</div>
                                    <SpkButtongroup>
                                        <SpkDropdown
                                            Togglevariant={getStatusVariant()}
                                            Toggletext={status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : 'Open'}
                                            Customtoggleclass={`shadow-${getStatusVariant()} btn-sm py-1 px-2`}
                                            Customclass="status-dropdown-wrapper"
                                            Size="sm"
                                            Menuas="ul"
                                            onSelectfunc={handleStatusDropdownChange}
                                            Id="status-dropdown"
                                        >
                                            <Dropdown.Item as="li" eventKey="open">Open</Dropdown.Item>
                                            <Dropdown.Item as="li" eventKey="closed">Closed</Dropdown.Item>
                                        </SpkDropdown>
                                    </SpkButtongroup>
                                </div>
                            </div>
                            {(ticket.closure_category || ticket.closure_reason) && (
                                <blockquote className="blockquote custom-blockquote primary mt-2 mb-0 text-start w-100" style={{ maxWidth: '320px' }}>
                                    {ticket.closure_category && (
                                        <div className="fs-11 text-muted">Category: {ticket.closure_category}</div>
                                    )}
                                    {ticket.closure_reason && (
                                        <div className="fs-11 text-muted mt-1">Reason: {ticket.closure_reason}</div>
                                    )}
                                </blockquote>
                            )}
                        </Col>
                    </Row>
                    <Row>
                                <Col xl={12}>
                            <div className="fs-14 fw-medium mb-2"><span className="text-danger">MITRE ATT&CK®</span> <span className="fs-11">{activeTacticsCount} Tactics and {activeTechniquesCount} Techniques</span></div>
                            <div
                                className="d-flex align-items-center border rounded px-2 py-1"
                                style={{
                                    overflowX: 'hidden',
                                    width: '100%',
                                    columnGap: '0.5rem',
                                }}
                            >
                                {mitreStages.map((phase, index, array) => (
                                    <React.Fragment key={phase.name}>
                                        <div
                                            className="text-center"
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'stretch',
                                                flex: '1 1 0',
                                                minWidth: 0,
                                                color: (phase.active || phase.count > 0) ? '#dc3545' : '#6c757d',
                                                overflow: 'hidden',
                                                padding: (phase.active || phase.count > 0) ? '0.3rem 0.1rem' : '0.1rem 0.05rem',
                                            }}
                                        >
                                            <div 
                                                className="fw-semibold mb-1" 
                                                style={{ 
                                                    fontSize: '0.95rem',
                                                    color: (phase.active || phase.count > 0) ? '#dc3545' : '#6c757d',
                                                    textAlign: 'center',
                                                }}
                                            >
                                                {phase.count}
                                            </div>
                                            <div 
                                                className="fs-12 text-truncate" 
                                                style={{ 
                                                    color: (phase.active || phase.count > 0) ? '#dc3545' : '#6c757d',
                                                    fontWeight: (phase.active || phase.count > 0) ? '500' : '400',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    textAlign: 'center',
                                                }}
                                                title={phase.name}
                                            >
                                                {phase.name}
                                            </div>
                                            {(phase.active || phase.count > 0) && phase.technique && (
                                                <div 
                                                    className="fs-10 mt-1 text-truncate" 
                                                    style={{ 
                                                        color: '#dc3545',
                                                        fontWeight: '400',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        display: 'block',
                                                        textAlign: 'left',
                                                    }}
                                                    title={phase.technique}
                                                >
                                                    {phase.technique}
                                                </div>
                                            )}
                                        </div>
                                        {index < array.length - 1 && (
                                            <div 
                                                className="border-start" 
                                                style={{ 
                                                    height: '40px',
                                                    borderColor: '#dee2e6'
                                                }}
                                            />
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                        </Col>
                    </Row>
                        </Card.Body>
                    </Card>

            {/* Navigation Tabs */}
            <Card className="custom-card border-0 mb-0 overflow-hidden" style={{ border: "none" }}>
                <Tab.Container defaultActiveKey='overview'>
                    <Card.Header className="d-flex justify-content-between align-items-center p-0 border-bottom" style={{ position: 'relative', zIndex: 1, overflow: 'hidden', width: '100%' }}>
                        <div className="d-flex align-items-center flex-fill">
                            <Nav as='ul' variant="tabs" className="nav-tabs tab-style-6 ticket-details-nav-tabs border-0 d-flex" role="tablist" style={{ position: 'relative', zIndex: 1, marginBottom: 0, marginLeft: '1rem' }}>
                                <Nav.Item as='li' role="presentation">
                                    <Nav.Link as='button' eventKey='overview' className="px-4 py-2" role="tab" aria-selected="true">
                                        Overview
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item as='li' role="presentation">
                                    <Nav.Link as='button' eventKey='assets' className="px-4 py-2 d-flex align-items-center gap-2" role="tab" aria-selected="false">
                                        Related Alerts
                                        <span className="badge rounded-pill bg-primary ms-1" style={{ fontSize: '0.7rem', minWidth: '1.25rem' }}>
                                            {relatedAlertsCount > 99 ? '99+' : relatedAlertsCount}
                                        </span>
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item as='li' role="presentation">
                                    <Nav.Link as='button' eventKey='logs' className="px-4 py-2 d-flex align-items-center gap-2" role="tab" aria-selected="false">
                                        Raw Logs
                                        {rawLogsCount > 0 && (
                                            <span className="badge rounded-pill bg-primary ms-1" style={{ fontSize: '0.7rem', minWidth: '1.25rem' }}>
                                                {rawLogsCount > 99 ? '99+' : rawLogsCount}
                                            </span>
                                        )}
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item as='li' role="presentation">
                                    <Nav.Link as='button' eventKey='graph' className="px-4 py-2 d-flex align-items-center gap-2" role="tab" aria-selected="false">
                                        AI Tuning
                                        <span className="badge rounded-pill bg-primary ms-1" style={{ fontSize: '0.7rem', minWidth: '1.25rem' }}>
                                            {suggestionsCount > 99 ? '99+' : suggestionsCount}
                                        </span>
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item as='li' role="presentation">
                                    <Nav.Link as='button' eventKey='ir-agent' className="px-4 py-2 d-flex align-items-center gap-2" role="tab" aria-selected="false">
                                        IR Agent
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item as='li' role="presentation">
                                    <Nav.Link as='button' eventKey='notes' className="px-4 py-2" role="tab" aria-selected="false">
                                        Notes
                                    </Nav.Link>
                                </Nav.Item>
                            </Nav>
                            <div className="btn-list flex-shrink-0 ms-auto pe-3">
                                <SpkButton 
                                    Buttonvariant="primary-light" 
                                    Buttontype="button" 
                                    Customclass="btn btn-wave"
                                    onClickfunc={handleExportLogs}
                                >
                                    <i className="ri-upload-cloud-line align-middle me-1"></i>Export Logs
                                </SpkButton>
                                        </div>
                                    </div>
                    </Card.Header>
                    <Card.Body className="p-0" style={{ position: 'relative', zIndex: 0 }}>
                        <Tab.Content className="ticket-details-tab-content" style={{ position: 'relative', minHeight: '600px' }}>
                            <Tab.Pane eventKey='overview' className="pt-3 px-4 pb-4" role="tabpanel">
                                {/* Three Column Layout for Overview Tab */}
                                <Row>
                                    <Col xl={4}>
                                        <Card className="custom-card overflow-hidden">
                                            <Card.Header className="py-2">
                                                <Card.Title className="mb-0">Attributes</Card.Title>
                                            </Card.Header>
                                            <Card.Body className="p-0">
                                                <div className="table-responsive">
                                                    <div className="table mb-0 attributes-striped-list">
                                                        {overviewAttributeRows.map((row) => (
                                                            <div key={row.label} className="d-flex py-2 px-3 border-bottom">
                                                                <div style={{ flex: '0 0 35%', minWidth: 0 }} className="fw-medium me-2 text-break">
                                                                    {row.label} :
                                                                </div>
                                                                <div style={{ flex: '1 1 65%', minWidth: 0 }} className="text-break">
                                                                    {row.value}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    <Col xl={3}>
                    <Card className="custom-card">
                                            <Card.Header className="py-2">
                                                <Card.Title className="mb-0">Entities</Card.Title>
                                            </Card.Header>
                                            <Card.Body className="px-2 py-3">
                                                <Accordion
                                                    alwaysOpen
                                                    className="customized-accordion accordions-items-seperate"
                                                    defaultActiveKey={overviewEntityAccordionItems.filter((item) => item.count > 0).map((item) => item.id)}
                                                >
                                                    {overviewEntityAccordionItems.map((item) => (
                                                        <Accordion.Item eventKey={item.id} className={item.itemClass} key={item.id}>
                                                            <Accordion.Header>{item.title}</Accordion.Header>
                                                            <Accordion.Body className={item.bodyClass}>{item.content}</Accordion.Body>
                                                        </Accordion.Item>
                                                    ))}
                                                </Accordion>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    <Col xl={5}>
                                        <Card className="custom-card">
                                            <Card.Header className="py-2">
                                                <Card.Title className="mb-0">Analysis</Card.Title>
                                            </Card.Header>
                                            <Card.Body>
                                                {alertAnalysis && alertAnalysis.sections && alertAnalysis.sections.length > 0 ? (
                                                    alertAnalysis.sections.map((section, sectionIndex) => (
                                                        <div key={sectionIndex} className={sectionIndex < alertAnalysis.sections.length - 1 ? 'mb-4' : ''}>
                                                            <h6 className="fw-medium">{section.heading}</h6>
                                                            {section.type === 'paragraphs' ? (
                                                                section.content.map((paragraph, paraIndex) => (
                                                                    <p key={paraIndex} className={paraIndex < section.content.length - 1 ? 'op-9 mb-2' : 'op-9 mb-0'}>
                                                                        {paragraph}
                                                                    </p>
                                                                ))
                                                            ) : section.type === 'list' ? (
                                                                <ListGroup as='ul' className="list-group border-0 list-unstyled list-group-numbered mb-3">
                                                                    {section.content.map((item, itemIndex) => (
                                                                        <ListGroup.Item key={itemIndex} className="border-0 py-1">
                                                                            {item}
                                                                        </ListGroup.Item>
                                                                    ))}
                                                                </ListGroup>
                                                            ) : null}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-muted mb-0">No alert analysis available.</p>
                                                )}
                                            </Card.Body>
                                        </Card>
                                    </Col>
            </Row>
                            </Tab.Pane>
                            <Tab.Pane eventKey='assets' className="pt-3 px-4 pb-4" role="tabpanel">
                                {relatedAlertCategories.length > 0 ? (
                                    <Tab.Container
                                        activeKey={activeRelatedAlertCategoryKey}
                                        onSelect={(k) => setActiveRelatedAlertCategoryKey(String(k || ''))}
                                    >
                                        <Row>
                                            <div className="col-md-2">
                                                <Nav
                                                    className="nav-tabs flex-column vertical-tabs-3 me-3 related-alert-category-nav"
                                                    role="tablist"
                                                    aria-orientation="vertical"
                                                    style={{ minHeight: '260px' }}
                                                >
                                                    {relatedAlertCategories.map((cat) => {
                                                        const typeLabel = formatRelatedAlertTypeLabel(cat.entityType);
                                                        const subEntityCount = Object.keys(cat.entities || {}).length;
                                                        const iconClass = getRelatedAlertTypeIcon(cat.entityType);

                                                        return (
                                                            <Nav.Item key={cat.key}>
                                                                <Nav.Link
                                                                    eventKey={cat.key}
                                                                    className="text-start"
                                                                    style={{ padding: '0.75rem 1rem', minWidth: '11.5rem' }}
                                                                >
                                                                    <div className="d-flex align-items-center justify-content-between gap-2">
                                                                        <span
                                                                            className="d-inline-flex align-items-center gap-2 text-truncate"
                                                                            style={{ fontSize: '0.9rem' }}
                                                                        >
                                                                            <i className={`${iconClass} align-middle d-inline-block`}></i>
                                                                            <span className="fw-semibold related-alerts-text-secondary text-truncate">
                                                                                {typeLabel}
                                                                            </span>
                                                                        </span>
                                                                        <span style={{ minWidth: '2.1rem', textAlign: 'center' }}>
                                                                            {subEntityCount === 0 ? (
                                                                                <span
                                                                                    className="badge rounded-pill"
                                                                                    style={{ backgroundColor: '#6c757d', color: '#fff' }}
                                                                                >
                                                                                    {subEntityCount}
                                                                                </span>
                                                                            ) : (
                                                                                <SpkBadge variant="danger" Pill={true}>
                                                                                    {subEntityCount}
                                                                                </SpkBadge>
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                </Nav.Link>
                                                            </Nav.Item>
                                                        );
                                                    })}
                                                </Nav>
                                            </div>
                                            <Col md={10}>
                                                <Tab.Content>
                                                    {relatedAlertCategories.map((cat) => (
                                                        <Tab.Pane key={cat.key} eventKey={cat.key}>
                                                            {Object.keys(cat.entities || {}).length > 0 ? (
                                                                <div className="d-flex flex-column gap-4">
                                                                    {Object.entries(cat.entities).map(([entityName, alerts]) => (
                                                                        <div key={entityName} className="d-flex flex-column gap-2">
                                                                            <div className="d-flex align-items-center">
                                                                                <span className="fw-semibold related-alerts-text" style={{ fontSize: '0.95rem' }}>
                                                                                    {entityName}
                                                                                </span>
                                                                                <div className="ms-2">
                                                                                    {alerts.length === 0 ? (
                                                                                        <span
                                                                                            className="badge rounded-pill"
                                                                                            style={{ backgroundColor: '#6c757d', color: '#fff' }}
                                                                                        >
                                                                                            {alerts.length}
                                                                                        </span>
                                                                                    ) : (
                                                                                        <SpkBadge variant="danger" Pill={true}>
                                                                                            {alerts.length}
                                                                                        </SpkBadge>
                                                                                    )}
                                                                                </div>
                                                                            </div>

                                                                            {alerts.length > 0 ? (
                                                                                <div className="d-flex flex-column gap-2">
                                                                                    {alerts.map((alert) => (
                                                                                        <Card
                                                                                            key={alert.id}
                                                                                            className="custom-card mb-0 related-alert-card"
                                                                                            style={{
                                                                                                borderLeft: getRelatedAlertSeverityBorder(alert.severity),
                                                                                                borderTop: '1px solid #e5e7eb',
                                                                                                borderRight: '1px solid #e5e7eb',
                                                                                                borderBottom: '1px solid #e5e7eb',
                                                                                            }}
                                                                                        >
                                                                                            <Card.Body className="p-3">
                                                                                                <div className="d-flex flex-column gap-2">
                                                                                                    <div className="d-flex align-items-center gap-2 mb-2">
                                                                                                        <SpkButton
                                                                                                            Buttontype="button"
                                                                                                            Buttonvariant="primary"
                                                                                                            Customclass="btn-sm"
                                                                                                        >
                                                                                                            ID: {alert.id}
                                                                                                        </SpkButton>
                                                                                                        <span className="text-muted fs-12">{alert.time}</span>
                                                                                                        <div className="d-flex align-items-center gap-2 ms-auto">
                                                                                                            {[alert.status ? `${alert.status.charAt(0).toUpperCase()}${alert.status.slice(1)}` : '', alert.closure_category || '']
                                                                                                                .filter(Boolean)
                                                                                                                .map((pillText) => (
                                                                                                                    <SpkButton
                                                                                                                        key={`${alert.id}-${pillText}`}
                                                                                                                        Buttontype="button"
                                                                                                                        Buttonvariant="outline-light"
                                                                                                                        Customclass="rounded-pill btn-sm related-alert-meta-pill"
                                                                                                                    >
                                                                                                                        {pillText}
                                                                                                                    </SpkButton>
                                                                                                                ))}
                                                                                                        </div>
                                                                                                    </div>
                                                                                                    <h6
                                                                                                        className="fw-semibold mb-0 related-alerts-text"
                                                                                                        style={{ fontSize: '0.95rem', lineHeight: '1.4' }}
                                                                                                    >
                                                                                                        {alert.name}
                                                                                                    </h6>
                                                                                                </div>
                                                                                            </Card.Body>
                                                                                        </Card>
                                                                                    ))}
                                                                                </div>
                                                                            ) : (
                                                                                <div className="text-muted fs-13 py-2">No alerts found for this entity</div>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <div className="text-muted fs-13 py-2">No Alerts found for this Entity</div>
                                                            )}
                                                        </Tab.Pane>
                                                    ))}
                                                </Tab.Content>
                                            </Col>
                                        </Row>
                                    </Tab.Container>
                                ) : (
                                    <div className="text-center py-5">
                                        <i className="ri-inbox-line fs-48 text-muted mb-3 d-block"></i>
                                        <p className="text-muted mb-0">No related alerts data available</p>
                                    </div>
                                )}
                            </Tab.Pane>
                            <Tab.Pane eventKey='logs' className="pt-3 px-4 pb-4" role="tabpanel">
                                <div className="d-flex flex-column gap-3">
                                    {(() => {
                                        const rawLogs = (() => {
                                            const val = ticket?.raw_logs;
                                            if (val == null) return [];
                                            if (Array.isArray(val)) return val;
                                            if (typeof val === 'string') {
                                                try { return JSON.parse(val) as unknown[]; } catch { return []; }
                                            }
                                            return [];
                                        })();
                                        if (rawLogs.length === 0) {
                                            return (
                                                <p className="text-muted mb-0">No raw logs available for this ticket.</p>
                                            );
                                        }
                                        return rawLogs.map((log, index) => (
                                            <Card key={index} className="custom-card mb-0" style={{ backgroundColor: '#000', borderColor: '#333' }}>
                                                <Card.Body className="p-3">
                                                    <pre style={{
                                                        margin: 0,
                                                        color: '#9be963',
                                                        backgroundColor: '#000',
                                                        fontFamily: 'monospace',
                                                        fontSize: '0.875rem',
                                                        whiteSpace: 'pre-wrap',
                                                        wordBreak: 'break-word',
                                                        overflowX: 'auto'
                                                    }}>
                                                        {typeof log === 'string' ? log : JSON.stringify(log, null, 2)}
                                                    </pre>
                                                </Card.Body>
                                            </Card>
                                        ));
                                    })()}
                                </div>
                            </Tab.Pane>
                            <Tab.Pane eventKey='graph' className="pt-3 px-4 pb-4" role="tabpanel">
                                <Row className="g-3 align-items-start">
                                    <Col xl={6} lg={7}>
                                        <h5 className="fw-semibold mb-2 fs-6 ai-tuning-section-heading">
                                            Help AI make better decisions for this policy
                                        </h5>
                                        <p className="text-muted mb-3 fs-12">
                                            Configure suppression count and add known context to reduce alerts volume.
                                        </p>
                                        <Card className="custom-card h-100">
                                            <Card.Body>
                                                <Row className="gy-3">
                                                    <Col md={12}>
                                                        <div className="mb-3">
                                                            <div className="d-flex justify-content-between align-items-center mb-1">
                                                                <span className="fw-medium fs-13">This policy today</span>
                                                                <span className={DUMMY_POLICY_ALERTS_PER_DAY >= 10 ? 'text-danger fs-11 fw-medium' : 'text-muted fs-11'}>
                                                                    {DUMMY_POLICY_ALERTS_PER_DAY} alerts/day
                                                                </span>
                                                            </div>
                                                            <div className="progress progress-xs" role="progressbar" aria-valuemin={0} aria-valuemax={100}>
                                                                <div
                                                                    className={`progress-bar ${DUMMY_POLICY_ALERTS_PER_DAY >= 10 ? 'bg-danger' : 'bg-primary'}`}
                                                                    style={{ width: `${Math.min(DUMMY_POLICY_ALERTS_PER_DAY, 100)}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                        <div className="mb-3">
                                                            <div className="d-flex justify-content-between align-items-center mb-1">
                                                                <span className="fw-medium fs-13">Suppress</span>
                                                                <span className="fs-13">
                                                                    <strong>{aiTuningForm.suppressionCountPerDay}</strong> / Day
                                                                </span>
                                                            </div>
                                                            <Form.Range
                                                                min={0}
                                                                max={100}
                                                                value={aiTuningForm.suppressionCountPerDay}
                                                                onChange={(e) =>
                                                                    setAiTuningForm((prev) => ({
                                                                        ...prev,
                                                                        suppressionCountPerDay: Number(e.target.value) || 0,
                                                                    }))
                                                                }
                                                            />
                                                        </div>
                                                    </Col>
                                                    <Col md={12}>
                                                        <Row className="gy-3">
                                                            <Col xs={12}>
                                                                <Form.Label className="fw-medium fs-13">Scope</Form.Label>
                                                                <div className="d-flex gap-2">
                                                                    <Form.Select
                                                                        value={aiTuningForm.scopeType}
                                                                        style={{ maxWidth: '150px' }}
                                                                        onChange={(e) => {
                                                                            const scopeType = e.target.value;
                                                                            setAiTuningForm((prev) => ({
                                                                                ...prev,
                                                                                scopeType,
                                                                                scopeValue: scopeType === 'policy' ? (ticket?.name?.trim() ?? '') : '',
                                                                            }));
                                                                        }}
                                                                    >
                                                                        <option value="policy">Policy</option>
                                                                        <option value="users">Users</option>
                                                                        <option value="assets">Assets</option>
                                                                        <option value="ips">IPs</option>
                                                                        <option value="domains">Domains</option>
                                                                        <option value="urls">URLs</option>
                                                                        <option value="hashes">Hashes</option>
                                                                    </Form.Select>
                                                                    <Form.Control
                                                                        type="text"
                                                                        placeholder="value"
                                                                        value={aiTuningForm.scopeValue}
                                                                        onChange={(e) =>
                                                                            setAiTuningForm((prev) => ({
                                                                                ...prev,
                                                                                scopeValue: e.target.value,
                                                                            }))
                                                                        }
                                                                    />
                                                                </div>
                                                            </Col>
                                                            <Col xs={12}>
                                                                <Form.Label className="fw-medium fs-13 d-block mb-1">Type</Form.Label>
                                                                <div className="d-flex flex-wrap gap-3 fs-13">
                                                                    <Form.Check
                                                                        type="radio"
                                                                        id="ai-tuning-type-genuine"
                                                                        name="ai-tuning-type"
                                                                        label="Genuine activity"
                                                                        checked={aiTuningForm.suggestionType === 'Genuine activity'}
                                                                        onChange={() =>
                                                                            setAiTuningForm((prev) => ({
                                                                                ...prev,
                                                                                suggestionType: 'Genuine activity',
                                                                            }))
                                                                        }
                                                                    />
                                                                    <Form.Check
                                                                        type="radio"
                                                                        id="ai-tuning-type-security-testing"
                                                                        name="ai-tuning-type"
                                                                        label="Security Testing"
                                                                        checked={aiTuningForm.suggestionType === 'Security Testing'}
                                                                        onChange={() =>
                                                                            setAiTuningForm((prev) => ({
                                                                                ...prev,
                                                                                suggestionType: 'Security Testing',
                                                                            }))
                                                                        }
                                                                    />
                                                                    <Form.Check
                                                                        type="radio"
                                                                        id="ai-tuning-type-noise"
                                                                        name="ai-tuning-type"
                                                                        label="Noise"
                                                                        checked={aiTuningForm.suggestionType === 'Noise'}
                                                                        onChange={() =>
                                                                            setAiTuningForm((prev) => ({
                                                                                ...prev,
                                                                                suggestionType: 'Noise',
                                                                            }))
                                                                        }
                                                                    />
                                                                </div>
                                                            </Col>
                                                            <Col xs={12}>
                                                                <Form.Label className="fw-medium fs-13 d-block mb-1">Valid Until</Form.Label>
                                                                <div className="d-flex align-items-center gap-3">
                                                                    <Form.Control
                                                                        type="date"
                                                                        value={aiTuningForm.validUntilDate}
                                                                        onChange={(e) =>
                                                                            setAiTuningForm((prev) => ({
                                                                                ...prev,
                                                                                validUntilDate: e.target.value,
                                                                            }))
                                                                        }
                                                                        disabled={aiTuningForm.permanent}
                                                                        style={{ maxWidth: '180px' }}
                                                                    />
                                                                    <Form.Check
                                                                        type="checkbox"
                                                                        id="ai-tuning-permanent"
                                                                        label="Permanent"
                                                                        checked={aiTuningForm.permanent}
                                                                        onChange={(e) =>
                                                                            setAiTuningForm((prev) => ({
                                                                                ...prev,
                                                                                permanent: e.target.checked,
                                                                            }))
                                                                        }
                                                                    />
                                                                </div>
                                                            </Col>
                                                        </Row>
                                                    </Col>
                                                </Row>
                                                <Row className="mt-4 gy-3">
                                                    <Col xs={12}>
                                                        <Form.Label className="fw-medium fs-13">Suggestion</Form.Label>
                                                        <Form.Control
                                                            as="textarea"
                                                            rows={3}
                                                            placeholder="Suppress alerts triggered by internal vulnerability scanner IP range."
                                                            value={aiTuningForm.suggestionText}
                                                            onChange={(e) =>
                                                                setAiTuningForm((prev) => ({
                                                                    ...prev,
                                                                    suggestionText: e.target.value,
                                                                }))
                                                            }
                                                        />
                                                    </Col>
                                                    <Col xs={12} className="d-flex flex-column align-items-end gap-2">
                                                        {aiTuningError && (
                                                            <span className="text-danger fs-12 text-end">{aiTuningError}</span>
                                                        )}
                                                        {aiTuningMessage && !aiTuningError && (
                                                            <span className="text-success fs-12 text-end">{aiTuningMessage}</span>
                                                        )}
                                                        <SpkButton
                                                            Buttonvariant="primary"
                                                            Buttontype="button"
                                                            Customclass="btn btn-primary"
                                                            onClickfunc={handleAiTuningSubmit}
                                                            Disabled={aiTuningSaving}
                                                        >
                                                            {aiTuningSaving ? 'Saving...' : 'Add Suggestion \u2192'}
                                                        </SpkButton>
                                                    </Col>
                                                </Row>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    <Col xl={6} lg={5} className="border-start ps-3">
                                        <h5 className="fw-semibold mb-2 fs-6 ai-tuning-section-heading">
                                            Existing suggestions
                                        </h5>
                                        <div className="h-100 d-flex flex-column gap-3 overflow-auto" style={{ maxHeight: '70vh' }}>
                                            {loadingSuggestions ? (
                                                <div className="d-flex align-items-center justify-content-center py-4">
                                                    <Spinner animation="border" variant="primary" size="sm" />
                                                </div>
                                            ) : existingSuggestions && Object.keys(existingSuggestions).some((k) => Object.keys(existingSuggestions[k] || {}).length > 0) ? (
                                                <div className="d-flex flex-column gap-3">
                                                    {Object.entries(existingSuggestions).map(([scopeKey, scopeEntries]) => {
                                                        const entries = scopeEntries && typeof scopeEntries === 'object' ? Object.entries(scopeEntries) : [];
                                                        if (entries.length === 0) return null;
                                                        const scopeLabel = scopeKey === 'ips' ? 'IPs' : scopeKey.charAt(0).toUpperCase() + scopeKey.slice(1);
                                                        return (
                                                            <div key={scopeKey} className="d-flex flex-column gap-2">
                                                                <div className="d-flex align-items-center mb-1">
                                                                    <span className="fw-semibold related-alerts-text" style={{ fontSize: '1.125rem' }}>{scopeLabel}</span>
                                                                    <SpkBadge variant="danger" Pill={true} Customclass="ms-2">
                                                                        {entries.length}
                                                                    </SpkBadge>
                                                                </div>
                                                                {entries.map(([scopeValue, entry]) => (
                                                                    <div key={scopeValue} className="d-flex flex-column gap-2">
                                                                        <div className="d-flex align-items-center mb-1">
                                                                            <span className="fw-medium related-alerts-text-secondary fs-13">
                                                                                <i className="ri-tune-line me-2"></i>
                                                                                {scopeValue}
                                                                            </span>
                                                                        </div>
                                                                        <Card className="custom-card mb-0" style={{
                                                                            borderLeft: '4px solid #0d6efd',
                                                                            borderTop: '1px solid #9ca3af',
                                                                            borderRight: '1px solid #9ca3af',
                                                                            borderBottom: '1px solid #9ca3af'
                                                                        }}>
                                                                            <Card.Body className="p-3">
                                                                                <div className="d-flex flex-column gap-2">
                                                                                    <div className="d-flex align-items-center gap-2 flex-wrap">
                                                                                        <SpkButton Buttontype="button" Buttonvariant="outline-primary" Customclass="rounded-pill btn-sm">
                                                                                            {(entry.suggestion_type || '').replace(/_/g, ' ')}
                                                                                        </SpkButton>
                                                                                        {entry.permanent && (
                                                                                            <SpkButton Buttontype="button" Buttonvariant="outline-light" Customclass="rounded-pill btn-sm">Permanent</SpkButton>
                                                                                        )}
                                                                                        {!entry.permanent && entry.valid_until && entry.valid_until !== 'permanent' && (
                                                                                            <span className="text-muted fs-12">Valid until: {new Date(entry.valid_until).toLocaleDateString()}</span>
                                                                                        )}
                                                                                    </div>
                                                                                    <p className="mb-0 related-alerts-text-secondary fs-13" style={{ lineHeight: '1.4' }}>{entry.suggestion_text || '—'}</p>
                                                                                </div>
                                                                            </Card.Body>
                                                                        </Card>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="text-center py-4">
                                                    <i className="ri-inbox-line fs-48 text-muted mb-2 d-block"></i>
                                                    <p className="text-muted mb-0 fs-12">No existing suggestions</p>
                                                </div>
                                            )}
                                        </div>
                                    </Col>
                                </Row>
                            </Tab.Pane>
                            <Tab.Pane eventKey='ir-agent' className="pt-3 px-4 pb-4" role="tabpanel">
                                <Row className="gy-3">
                                    <Col xl={8} lg={8}>
                                        <Card className="custom-card h-100">
                                            <Card.Header className="d-flex justify-content-between align-items-center">
                                            </Card.Header>
                                            <Card.Body className="p-3">
                                                <div
                                                    className="overflow-auto"
                                                    style={{ maxHeight: '60vh' }}
                                                >
                                                    {irAgentMessages.length === 0 ? (
                                                        <div className="text-center py-5">
                                                            <i className="ri-robot-2-line fs-40 text-muted mb-3 d-block"></i>
                                                            <p className="text-muted mb-0">
                                                                Ask a question on the right to see IR Agent responses here.
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <div className="d-flex flex-column gap-3">
                                                            {irAgentMessages.map((msg) => (
                                                                <div
                                                                    key={msg.id}
                                                                    className={`d-flex align-items-start gap-2 ${msg.role === 'assistant' ? '' : 'justify-content-end'}`}
                                                                >
                                                                    {msg.role === 'assistant' && (
                                                                        <div
                                                                            className="avatar avatar-sm avatar-rounded d-flex align-items-center justify-content-center bg-primary-transparent text-primary flex-shrink-0"
                                                                            style={{ marginTop: '2px' }}
                                                                        >
                                                                            <i className="ri-robot-2-line"></i>
                                                                        </div>
                                                                    )}

                                                                    <div
                                                                        className={`p-2 rounded-2 ${msg.role === 'assistant'
                                                                            ? 'bg-light text-start'
                                                                            : 'bg-primary text-white text-start ir-agent-user-message'
                                                                            }`}
                                                                        style={{ maxWidth: '100%' }}
                                                                    >
                                                                        <div className="d-flex align-items-center gap-2 fw-semibold fs-13 mb-1">
                                                                            {msg.role === 'assistant' ? 'IR Agent' : (userData?.username ?? 'You')}
                                                                            {msg.role === 'assistant' && irAgentStreaming && msg.id === irAgentPendingAssistantId && (
                                                                                <span className="text-muted fw-normal fs-11" style={{ lineHeight: 1.2 }}>
                                                                                    {irAgentButtonText}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <div className="fs-14" style={{ whiteSpace: 'pre-wrap' }}>
                                                                            {msg.content}
                                                                        </div>
                                                                    </div>

                                                                    {msg.role !== 'assistant' && (
                                                                        <div
                                                                            className="avatar avatar-sm avatar-rounded d-flex align-items-center justify-content-center bg-primary-transparent text-primary flex-shrink-0"
                                                                            style={{ marginTop: '2px' }}
                                                                        >
                                                                            <i className="ri-user-line fs-16"></i>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                            <div ref={irAgentMessagesEndRef} />
                                                        </div>
                                                    )}
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    <Col xl={4} lg={4} style={{ position: 'sticky', top: '1rem', alignSelf: 'flex-start', zIndex: 1 }}>
                                        <Card className="custom-card h-100">
                                            <Card.Header>
                                            </Card.Header>
                                            <Card.Body>
                                                <Form.Group className="mb-3" controlId="irAgentQuestion">
                                                    <Form.Label className="fw-medium fs-13">Question</Form.Label>
                                                    <Form.Control
                                                        as="textarea"
                                                        rows={6}
                                                        value={irAgentInput}
                                                        onChange={(e) => setIrAgentInput(e.target.value)}
                                                        placeholder="Describe what you want IR Agent to analyze or explain..."
                                                        disabled={irAgentStreaming}
                                                    />
                                                </Form.Group>
                                            </Card.Body>
                                            <Card.Footer className="d-flex justify-content-end">
                                                <SpkButton
                                                    Buttontype="button"
                                                    Buttonvariant={irAgentStreaming ? "danger-light" : "primary"}
                                                    Customclass="btn btn-wave"
                                                    onClickfunc={irAgentStreaming ? handleIrAgentStop : handleIrAgentAsk}
                                                    Disabled={irAgentStreaming || !irAgentInput.trim()}
                                                >
                                                    {irAgentStreaming ? (
                                                        <>
                                                            <i className="ri-stop-circle-line me-2" aria-hidden="true"></i>
                                                            Stop
                                                        </>
                                                    ) : (
                                                        'Ask'
                                                    )}
                                                </SpkButton>
                                            </Card.Footer>
                                        </Card>
                                    </Col>
                                </Row>
                            </Tab.Pane>
                            <Tab.Pane eventKey='notes' className="pt-3 px-4 pb-4" role="tabpanel">
                                <Card className="custom-card">
                                    <Card.Header>
                                        <Card.Title>Notes</Card.Title>
                                    </Card.Header>
                                    <Card.Body className="overflow-auto" style={{ maxHeight: '50vh' }} onClick={handleNoteContentClick}>
                                        <ul className="list-unstyled profile-timeline mb-0">
                                            {ticketNotes.length === 0 ? (
                                                <li className="text-muted text-center py-4">No notes yet. Add one below.</li>
                                            ) : (
                                                ticketNotes.map((note) => (
                                                    <li key={note.id} className="mb-4">
                                                        <div>
                                                            <span className="avatar avatar-sm bg-primary-transparent avatar-rounded profile-timeline-avatar">
                                                                {note.authorInitial}
                                                            </span>
                                                            <div className="mb-2">
                                                                <span className="fw-medium d-block">{note.author}</span>
                                                                <span className="text-muted small" style={{ marginTop: '2px' }}>
                                                                    {formatUtcToUserTimezone(note.createdAt, userData?.timezone || 'UTC')}
                                                                </span>
                                                            </div>
                                                            <div className="text-muted mb-0 fs-13 ticket-note-content" dangerouslySetInnerHTML={{ __html: note.content || '' }} />
                                                        </div>
                                                    </li>
                                                ))
                                            )}
                                        </ul>
                                    </Card.Body>
                                    <Card.Footer>
                                        <div className="d-sm-flex align-items-start lh-1 gap-2">
                                            <span className="avatar avatar-sm bg-primary-transparent avatar-rounded flex-shrink-0 mt-1">
                                                {(userData?.username ?? 'Y').charAt(0).toUpperCase()}
                                            </span>
                                            <div className="flex-fill min-w-0">
                                                <div className="position-relative mb-2" style={{ minHeight: '120px' }}>
                                                    <SpkSunEditor
                                                        key={noteEditorKey}
                                                        defaulContent={noteEditorContent}
                                                        height="120px"
                                                        setoptions={{
                                                            buttonList: [['bold', 'italic', 'underline'], ['list']],
                                                            minHeight: '100px',
                                                            showPathLabel: false,
                                                        }}
                                                        onChange={setNoteEditorContent}
                                                        onEditorReady={(editor) => { noteEditorRef.current = editor as any; }}
                                                    />
                                                    <input
                                                        ref={noteImageInputRef}
                                                        type="file"
                                                        accept="image/*"
                                                        className="d-none"
                                                        onChange={handleNoteImageSelect}
                                                    />
                                                    <div className="position-absolute" style={{ top: '6px', left: '152px', zIndex: 10 }}>
                                                        <button
                                                            type="button"
                                                            className="ticket-note-image-btn border-0 rounded bg-transparent d-flex align-items-center justify-content-center p-0"
                                                            style={{ width: 34, height: 34, margin: 1, color: 'inherit', cursor: 'pointer' }}
                                                            onClick={() => noteImageInputRef.current?.click()}
                                                        >
                                                            <i className="ri-image-line" style={{ fontSize: 19 }} aria-hidden="true"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                                <SpkButton
                                                    Buttonvariant="primary"
                                                    Customclass="btn btn-wave"
                                                    Buttontype="button"
                                                    onClickfunc={handleAddNote}
                                                    Disabled={notesSaving}
                                                >
                                                    {notesSaving ? 'Saving...' : 'Post'}
                                                </SpkButton>
                                            </div>
                                        </div>
                                    </Card.Footer>
                                </Card>
                                <Lightboxcomponent
                                    open={noteLightboxOpen}
                                    close={() => setNoteLightboxOpen(false)}
                                    slides={noteLightboxSlides}
                                    index={noteLightboxIndex}
                                    zoom={{ maxZoomPixelRatio: 10, scrollToZoom: true }}
                                />
                            </Tab.Pane>
                        </Tab.Content>
                    </Card.Body>
                </Tab.Container>
            </Card>
                </Col>
            </Row>
            <style dangerouslySetInnerHTML={{__html: `
                /* Overrides .tab-style-6 .nav-item .nav-link { font-size: 0.813rem } in _navs_tabs.scss */
                .ticket-details-nav-tabs.tab-style-6 .nav-item .nav-link {
                    font-size: 0.900rem !important;
                }
                .ticket-details-tab-content,
                .ticket-details-tab-content > .tab-pane {
                    border: none !important;
                    box-shadow: none !important;
                }
                #severity-dropdown.dropdown-toggle {
                    padding-top: 0.25rem !important;
                    padding-bottom: 0.25rem !important;
                    line-height: 1.4 !important;
                    min-height: 28px !important;
                }
                /* Ticket Notes: tighten line spacing, keep images viewable */
                .ticket-note-content p,
                .ticket-note-content div {
                    margin-bottom: 0.25em !important;
                    line-height: 1.4 !important;
                }
                .ticket-note-content p:last-child,
                .ticket-note-content div:last-child {
                    margin-bottom: 0 !important;
                }
                .ticket-note-content ul,
                .ticket-note-content ol {
                    margin-top: 0.25em !important;
                    margin-bottom: 0.25em !important;
                    padding-left: 1.25em !important;
                }
                .ticket-note-content li {
                    margin-bottom: 0.15em !important;
                    line-height: 1.4 !important;
                }
                .ticket-note-content li:last-child {
                    margin-bottom: 0 !important;
                }
                .ticket-note-content img {
                    max-width: 100% !important;
                    max-height: 420px !important;
                    width: auto !important;
                    height: auto !important;
                    object-fit: contain !important;
                    border-radius: 4px;
                    cursor: pointer;
                }
                .ticket-note-image-btn:hover {
                    background-color: #e1e1e1 !important;
                }
                /* Overview > Attributes alternating row shades (Nesting-like striped feel) */
                .attributes-striped-list > .d-flex:nth-child(odd) {
                    background-color: rgba(var(--bs-emphasis-color-rgb), 0.025);
                }
                .attributes-striped-list > .d-flex:nth-child(even) {
                    background-color: transparent;
                }
                [data-theme-mode="dark"] .attributes-striped-list > .d-flex:nth-child(odd) {
                    background-color:rgb(10, 10, 10);
                }
                [data-theme-mode="dark"] .attributes-striped-list > .d-flex:nth-child(even) {
                    background-color:rgb(24, 24, 24);
                }
                /* Related Alerts Text Colors - Light Mode (default) */
                .related-alerts-text {
                    color: #000 !important;
                }
                .related-alerts-text-secondary {
                    color: #333 !important;
                }
                .related-alert-category-nav .nav-link.active .related-alerts-text-secondary {
                    color: #fff !important;
                }
                .related-alert-meta-pill {
                    border-color: #e5e7eb !important; /* same as related alert card border (light mode) */
                }
                /* Related Alerts Text Colors - Dark Mode */
                [data-theme-mode="dark"] .related-alerts-text {
                    color: #fff !important;
                }
                [data-theme-mode="dark"] .related-alerts-text-secondary {
                    color: rgba(255, 255, 255, 0.7) !important;
                }
                /* Related Alerts Card Borders - Dark Mode */
                [data-theme-mode="dark"] .related-alert-card {
                    border-top-color: #4b5563 !important;   /* muted grey */
                    border-right-color: #4b5563 !important; /* muted grey */
                    border-bottom-color: #4b5563 !important;/* muted grey */
                }
                [data-theme-mode="dark"] .related-alert-meta-pill {
                    border-color: #4b5563 !important; /* same as related alert card border (dark mode) */
                }
                /* Assigned To Dropdown Dark Mode Styles */
                [data-theme-mode="dark"] .react-select-container .react-select__control {
                    background-color: #1e293b !important;
                    border-color: #334155 !important;
                }
                [data-theme-mode="dark"] .react-select-container .react-select__control:hover {
                    border-color: #475569 !important;
                }
                [data-theme-mode="dark"] .react-select-container .react-select__single-value {
                    color: #fff !important;
                }
                [data-theme-mode="dark"] .react-select-container .react-select__placeholder {
                    color: #94a3b8 !important;
                }
                [data-theme-mode="dark"] .react-select-container .react-select__input-container {
                    color: #fff !important;
                }
                [data-theme-mode="dark"] .react-select-container .react-select__menu {
                    background-color: #1e293b !important;
                    border-color: #334155 !important;
                }
                [data-theme-mode="dark"] .react-select-container .react-select__menu-list {
                    background-color: #1e293b !important;
                }
                [data-theme-mode="dark"] .react-select-container .react-select__option {
                    background-color: #1e293b !important;
                    color: #fff !important;
                }
                [data-theme-mode="dark"] .react-select-container .react-select__option:hover {
                    background-color: #334155 !important;
                }
                [data-theme-mode="dark"] .react-select-container .react-select__option--is-focused {
                    background-color: #334155 !important;
                }
                [data-theme-mode="dark"] .react-select-container .react-select__option--is-selected {
                    background-color: #3b82f6 !important;
                    color: #fff !important;
                }
                [data-theme-mode="dark"] .react-select-container .react-select__indicator {
                    color: #94a3b8 !important;
                }
                [data-theme-mode="dark"] .react-select-container .react-select__indicator:hover {
                    color: #fff !important;
                }
                [data-theme-mode="dark"] .ir-agent-user-message,
                [data-theme-mode="dark"] .ir-agent-user-message * {
                    color: #fff !important;
                }
            `}} />
            
            {/* Closure Modal */}
            <Modal show={showClosureModal} centered onHide={handleClosureModalClose} className="modal fade" id="closure-modal" tabIndex={-1}>
                <Modal.Header className="modal-header">
                    <Modal.Title className="modal-title h6">Close Ticket</Modal.Title>
                    <SpkButton Buttonvariant="" Buttontype="button" Customclass="btn-close" data-bs-dismiss="modal"
                        aria-label="Close" onClickfunc={handleClosureModalClose} ></SpkButton>
                </Modal.Header>
                <Modal.Body className="modal-body px-4">
                    <div className="mb-3">
                        <p className="text-muted">You are closing ticket <strong>INV-{ticket?.id}</strong>.</p>
                    </div>
                    <Row className="gy-3">
                        <Col xl={12}>
                            <Form.Label htmlFor="closure-category">Closure Category</Form.Label>
                            <Form.Select 
                                id="closure-category"
                                value={closureForm.category}
                                onChange={(e) => setClosureForm(prev => ({ ...prev, category: e.target.value }))}
                            >
                                <option value="">Select Category</option>
                                <option value="True Positive">True Positive</option>
                                <option value="False Positive">False Positive</option>
                            </Form.Select>
                        </Col>
                        <Col xl={12}>
                            <Form.Label htmlFor="closure-reason">Closure Reason</Form.Label>
                            <Form.Control 
                                as="textarea" 
                                rows={3}
                                id="closure-reason"
                                placeholder="Enter closure reason..."
                                value={closureForm.reason}
                                onChange={(e) => setClosureForm(prev => ({ ...prev, reason: e.target.value }))}
                            />
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer className="modal-footer">
                    <div className="d-flex justify-content-between w-100">
                        <SpkButton 
                            Buttonvariant="light" 
                            Buttontype="button" 
                            Customclass="btn btn-light"
                            data-bs-dismiss="modal" 
                            onClickfunc={handleClosureModalClose}
                        >
                            Cancel
                        </SpkButton>
                        <SpkButton 
                            Buttonvariant="success" 
                            Buttontype="button" 
                            Customclass="btn btn-success"
                            onClickfunc={handleClosureSubmit}
                        >
                            <i className="ri-check-line me-1"></i> Close Ticket
                        </SpkButton>
                    </div>
                </Modal.Footer>
            </Modal>
        </Fragment>
    );
};

export default TicketDetails;
