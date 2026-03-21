"use client"
import React, { useState, useEffect, useMemo, Fragment } from "react";
import { Card, Col, Row, Button, Form, InputGroup, Dropdown, Modal, Spinner } from "react-bootstrap";
import Image from "next/image";
import Seo from "@/shared/layouts-components/seo/seo";
import { supabase } from "@/shared/lib/supabase";
import { useTenantContext } from "@/shared/contextapi/TenantContext";

interface ToolFieldRequirement {
    id: string;
    type: 'string' | 'boolean' | 'string_list' | 'select' | 'number';
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

interface IntegrationType {
    id: number;
    name: string;
    version: string;
    category: string;
    logo: string;
    description: string;
    configuredInstances: number;
    status: 'active' | 'inactive' | 'pending';
    statusColor: string;
    parameters: IntegrationParameter[];
    tools?: MarketplaceTool[];
    modal_info?: string;
}

interface IntegrationParameter {
    id: string;
    label: string;
    type: 'text' | 'password' | 'email' | 'url' | 'number' | 'select' | 'checkbox';
    required: boolean;
    placeholder?: string;
    defaultValue?: any;
    description?: string;
    options?: { label: string; value: string }[];
}

interface IntegrationInstance {
    id: number;
    integration_id: number;
    tenant_id: string;
    tenant_name?: string;
    instance_name: string;
    incident_type?: string;
    classifier?: string;
    mapper?: string;
    logo?: string;
    configuration: { [key: string]: any };
    status: 'active' | 'inactive' | 'inprogress';
    last_tested_at?: string;
    created_at?: string;
    updated_at?: string;
}

interface InstanceToolRow {
    tool_name: string;
    status?: string;
    allowed_role?: string | null;
    approval_required?: boolean | null;
    approver_emails?: string | null;
    severity?: string | null;
    type?: string | null;
}

function getToolFieldList(tool: MarketplaceTool): ToolFieldRequirement[] {
    return tool.when_enabled?.fields ?? [];
}

function initEmptyToolConfig(tool: MarketplaceTool): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const f of getToolFieldList(tool)) {
        if (f.default !== undefined) {
            out[f.id] = f.default;
        } else if (f.type === 'boolean') {
            out[f.id] = false;
        } else if (f.type === 'string_list') {
            out[f.id] = '';
        } else if (f.type === 'number') {
            out[f.id] = '';
        } else {
            out[f.id] = '';
        }
    }
    return out;
}

function shouldShowToolField(field: ToolFieldRequirement, values: Record<string, unknown>): boolean {
    const cond = field.required_when?.all;
    if (!cond?.length) return true;
    return cond.every((c) => values[c.field] === c.equals);
}

function isToolFieldRequiredNow(field: ToolFieldRequirement, values: Record<string, unknown>): boolean {
    if (!shouldShowToolField(field, values)) return false;
    if (field.required === true) return true;
    // Only `required_when` (no `required`) → treat as required when the conditional block is visible
    if (field.required_when?.all?.length) return true;
    return false;
}

function validateToolPolicies(
    tools: MarketplaceTool[],
    toolToggles: Record<string, boolean>,
    toolConfigs: Record<string, Record<string, unknown>>
): { [key: string]: string } {
    const errors: { [key: string]: string } = {};
    for (const tool of tools) {
        if (!toolToggles[tool.name]) continue;
        const values = toolConfigs[tool.name] ?? {};
        for (const field of getToolFieldList(tool)) {
            if (!shouldShowToolField(field, values)) continue;
            const errKey = `tool_${tool.name}_${field.id}`;
            const required = isToolFieldRequiredNow(field, values);
            if (!required) continue;
            const v = values[field.id];
            if (field.type === 'boolean') {
                if (v === undefined || v === null) {
                    errors[errKey] = `${field.label} is required`;
                }
                continue;
            }
            if (field.type === 'string_list') {
                const s = typeof v === 'string' ? v : '';
                const parts = s
                    .split(/[\n,]+/)
                    .map((x) => x.trim())
                    .filter(Boolean);
                if (parts.length === 0) {
                    errors[errKey] = `${field.label} is required`;
                }
                continue;
            }
            if (field.type === 'number') {
                const n = v === '' || v === undefined || v === null ? NaN : Number(v);
                if (Number.isNaN(n)) {
                    errors[errKey] = `${field.label} is required`;
                }
                continue;
            }
            const str = v === undefined || v === null ? '' : String(v).trim();
            if (str === '') {
                errors[errKey] = `${field.label} is required`;
            }
        }
    }
    return errors;
}

function formatApproverEmailsForDb(val: unknown): string | null {
    if (val == null || val === '') return null;
    if (Array.isArray(val)) {
        const parts = val.map((x) => String(x).trim()).filter(Boolean);
        return parts.length ? parts.join(', ') : null;
    }
    const s = String(val).trim();
    if (!s) return null;
    const parts = s.split(/[\n,]+/).map((x) => x.trim()).filter(Boolean);
    return parts.length ? parts.join(', ') : null;
}

function buildInstanceToolInsertRow(
    tool: MarketplaceTool,
    config: Record<string, unknown>,
    instanceName: string,
    instanceId: number,
    tenantId: string | null
): Record<string, unknown> {
    return {
        tool_name: tool.name,
        instance_name: instanceName,
        instance_id: instanceId,
        status: 'Enabled',
        allowed_role: (config.allowed_role != null ? String(config.allowed_role).trim() : '') || null,
        approval_required: config.approval_required === true,
        approver_emails: formatApproverEmailsForDb(config.approver_emails),
        severity: (config.severity != null ? String(config.severity).trim() : '') || null,
        type: tool.type ?? null,
        tenant_id: tenantId,
    };
}

function applyInstanceRowToToolConfig(tool: MarketplaceTool, row?: InstanceToolRow): Record<string, unknown> {
    const base = initEmptyToolConfig(tool);
    if (!row) return base;
    const ext = row as unknown as Record<string, unknown>;
    for (const f of getToolFieldList(tool)) {
        const id = f.id;
        const val = ext[id];
        if (val === undefined || val === null) continue;
        if (f.type === 'boolean') base[id] = val === true;
        else if (f.type === 'string_list') base[id] = String(val);
        else base[id] = val;
    }
    return base;
}

const IntegrationsList = () => {
    // Context hooks
    const { assignedTenants, selectedTenantIds } = useTenantContext();
    
    const [integrations, setIntegrations] = useState<IntegrationType[]>([]);
    const [integrationInstances, setIntegrationInstances] = useState<IntegrationInstance[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [availableCategories, setAvailableCategories] = useState<{ label: string; value: string }[]>([]);
    const [expandedIntegrations, setExpandedIntegrations] = useState<Set<number>>(new Set());
    const [showAddInstanceModal, setShowAddInstanceModal] = useState(false);
    const [showEditInstanceModal, setShowEditInstanceModal] = useState(false);
    const [selectedIntegration, setSelectedIntegration] = useState<IntegrationType | null>(null);
    const [selectedInstance, setSelectedInstance] = useState<IntegrationInstance | null>(null);
    const [formData, setFormData] = useState<{ [key: string]: any }>({});
    const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
    const [isTesting, setIsTesting] = useState(false);
    const [testingInstanceId, setTestingInstanceId] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [checkboxStates, setCheckboxStates] = useState<{ [key: number]: boolean }>({});
    const [toolToggles, setToolToggles] = useState<Record<string, boolean>>({});
    /** Per-tool config: field id → value (from marketplace when_enabled.fields) */
    const [toolConfigs, setToolConfigs] = useState<Record<string, Record<string, unknown>>>({});
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [modalMessage, setModalMessage] = useState('');

    // Fetch integration instances from Supabase
    const fetchIntegrationInstances = async () => {
        try {
            if (!assignedTenants?.length) {
                setIntegrationInstances([]);
                return;
            }

            // Get tenant IDs based on selection
            let tenantIds: string[];
            if (selectedTenantIds === 'all') {
                tenantIds = assignedTenants.map(t => t.id);
            } else if (Array.isArray(selectedTenantIds)) {
                tenantIds = selectedTenantIds;
            } else {
                tenantIds = [selectedTenantIds];
            }

            const { data, error } = await supabase
                .from('integration_instances')
                .select('*')
                .in('tenant_id', tenantIds)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching integration instances:', error);
                setIntegrationInstances([]);
            } else {
                setIntegrationInstances(data || []);
            }
        } catch (error) {
            console.error('Error fetching integration instances:', error);
            setIntegrationInstances([]);
        }
    };

    // Fetch integrations from Supabase
    const fetchIntegrations = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('marketplace_integrations')
                .select('*')
                .order('name');

            if (error) {
                console.error('Error fetching integrations:', error);
                setIntegrations([]);
            } else {
                // Transform Supabase data to match our interface
                const transformedData = data?.map(item => ({
                    id: item.id,
                    name: item.name,
                    version: item.version,
                    category: item.category,
                    logo: item.logo,
                    description: item.description,
                    configuredInstances: item.configured_instances,
                    status: item.status,
                    statusColor: item.status_color,
                    parameters: item.parameters || [],
                    tools: item.tools || [],
                    modal_info: item.modal_info || ''
                })) || [];
                setIntegrations(transformedData);
                
                // Extract unique categories from the data
                const uniqueCategories = [...new Set(data?.map(item => item.category) || [])];
                const categories = [
                    { label: 'All', value: 'all' },
                    ...uniqueCategories.map(category => ({
                        label: category,
                        value: category
                    }))
                ];
                setAvailableCategories(categories);
            }
        } catch (error) {
            console.error('Error fetching integrations:', error);
            setIntegrations([]);
            setAvailableCategories([]);
        } finally {
            setLoading(false);
        }
    };

    // Load integrations and instances on component mount
    useEffect(() => {
        fetchIntegrations();
        fetchIntegrationInstances();
    }, [assignedTenants, selectedTenantIds]);

    // Filter integrations based on search query and category
    const filteredIntegrations = useMemo(() => {
        let filtered = integrations;

        // Filter by category
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(integration => integration.category === selectedCategory);
        }

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(integration => 
                integration.name?.toLowerCase().includes(query) ||
                integration.description?.toLowerCase().includes(query)
            );
        }

        return filtered;
    }, [integrations, selectedCategory, searchQuery]);

    // Group integrations by category
    const groupedIntegrations = useMemo(() => {
        const groups: { [key: string]: IntegrationType[] } = {};
        filteredIntegrations.forEach(integration => {
            if (!groups[integration.category]) {
                groups[integration.category] = [];
            }
            groups[integration.category].push(integration);
        });
        return groups;
    }, [filteredIntegrations]);

    // Handle search input change
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    // Handle category selection
    const handleCategorySelect = (category: string) => {
        setSelectedCategory(category);
    };

    // Handle dropdown toggle
    const toggleIntegrationDropdown = (integrationId: number) => {
        setExpandedIntegrations(prev => {
            const newSet = new Set(prev);
            if (newSet.has(integrationId)) {
                newSet.delete(integrationId);
            } else {
                newSet.add(integrationId);
            }
            return newSet;
        });
    };

    // Get instances for a specific integration
    const getInstancesForIntegration = (integrationId: number) => {
        return integrationInstances.filter(instance => instance.integration_id === integrationId);
    };

    const fetchEnabledToolsForInstance = async (instanceId: number): Promise<InstanceToolRow[]> => {
        const { data, error } = await supabase
            .from('instance_tools')
            .select('*')
            .eq('instance_id', instanceId);

        if (error) {
            console.error('Error fetching instance tools:', error);
            return [];
        }

        return (data || []).filter((row: InstanceToolRow & { status?: string }) => {
            const status = (row?.status || "").toString().toLowerCase();
            return status === "enabled" || status === "true";
        }) as InstanceToolRow[];
    };

    // Handle edit instance
    const handleEditInstance = async (instance: IntegrationInstance, integration: IntegrationType) => {
        setSelectedInstance(instance);
        setSelectedIntegration(integration);
        setFormData({
            ...instance.configuration,
            instance_name: instance.instance_name,
            incident_type: instance.incident_type || '',
            classifier: instance.classifier || '',
            mapper: instance.mapper || ''
        });
        setFormErrors({});

        // Reset toggles immediately to avoid showing stale values
        const tools = integration.tools || [];
        const nextToolToggles: Record<string, boolean> = {};
        const nextToolConfigs: Record<string, Record<string, unknown>> = {};
        tools.forEach((tool) => {
            nextToolToggles[tool.name] = false;
            nextToolConfigs[tool.name] = initEmptyToolConfig(tool);
        });
        setToolToggles(nextToolToggles);
        setToolConfigs(nextToolConfigs);

        // Prefill tool toggles from instance_tools for the specific configured instance
        const enabledTools = await fetchEnabledToolsForInstance(instance.id);
        const enabledToolNames = new Set(enabledTools.map((t) => t.tool_name));

        tools.forEach((tool) => {
            nextToolToggles[tool.name] = enabledToolNames.has(tool.name);
            const row = enabledTools.find((t) => t.tool_name === tool.name);
            nextToolConfigs[tool.name] = applyInstanceRowToToolConfig(tool, row);
        });

        setToolToggles({ ...nextToolToggles });
        setToolConfigs({ ...nextToolConfigs });
        setShowEditInstanceModal(true);
    };

    // Handle enable/disable instance (fake functionality)
    const handleToggleInstanceStatus = async (instanceId: number, currentStatus: string) => {
        // Allow checkbox toggle for active status without any alerts or status changes
        // This will be implemented later for different actions
        if (currentStatus === 'active') {
            // Toggle the checkbox state
            setCheckboxStates(prev => ({
                ...prev,
                [instanceId]: !prev[instanceId]
            }));
        }
    };

    // Handle add instance button click
    const handleAddInstance = (integration: IntegrationType) => {
        setSelectedIntegration(integration);

        const tools = integration.tools || [];
        const nextToolToggles: Record<string, boolean> = {};
        const nextToolConfigs: Record<string, Record<string, unknown>> = {};
        tools.forEach((tool) => {
            nextToolToggles[tool.name] = false;
            nextToolConfigs[tool.name] = initEmptyToolConfig(tool);
        });
        setToolToggles(nextToolToggles);
        setToolConfigs(nextToolConfigs);

        setFormData({
            // Start empty so the user explicitly enters the instance name.
            instance_name: '',
            incident_type: '',
            classifier: '',
            mapper: ''
        });
        setFormErrors({});
        setShowAddInstanceModal(true);
    };

    // Handle form input change
    const handleFormChange = (paramId: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [paramId]: value
        }));
        
        // Clear error for this field
        if (formErrors[paramId]) {
            setFormErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[paramId];
                return newErrors;
            });
        }
    };

    // Validate form
    const validateForm = (): boolean => {
        if (!selectedIntegration) return false;

        const errors: { [key: string]: string } = {};
        
        // Validate instance name
        if (!formData.instance_name || formData.instance_name.toString().trim() === '') {
            errors.instance_name = 'Instance name is required';
        }
        
        selectedIntegration.parameters?.forEach(param => {
            if (param.required && (!formData[param.id] || formData[param.id].toString().trim() === '')) {
                errors[param.id] = `${param.label} is required`;
            }
        });

        const tools = selectedIntegration.tools || [];
        const toolPolicyErrors = validateToolPolicies(tools, toolToggles, toolConfigs);
        const merged = { ...errors, ...toolPolicyErrors };
        setFormErrors(merged);
        return Object.keys(merged).length === 0;
    };

    // Handle test connection (for form in modal)
    const handleTestConnection = async () => {
        if (!validateForm()) return;

        setIsTesting(true);
        try {
            // TODO: Implement actual API call to test connection
            await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
            
            // For now, just show success
            setModalMessage('Connection test successful!');
            setShowSuccessModal(true);
            setShowErrorModal(false);
        } catch (error) {
            setModalMessage('Connection test failed. Please check your parameters.');
            setShowErrorModal(true);
            setShowSuccessModal(false);
        } finally {
            setIsTesting(false);
        }
    };

    // Handle test connection for existing instance
    const handleTestInstanceConnection = async (instance: IntegrationInstance) => {
        setTestingInstanceId(instance.id);
        try {
            // TODO: Implement actual API call to test connection using instance.configuration
            await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
            
            setModalMessage(`Connection test successful for ${instance.instance_name}!`);
            setShowSuccessModal(true);
            setShowErrorModal(false);
        } catch (error) {
            setModalMessage(`Connection test failed for ${instance.instance_name}. Please check your configuration.`);
            setShowErrorModal(true);
            setShowSuccessModal(false);
        } finally {
            setTestingInstanceId(null);
        }
    };

    // Handle save instance
    const handleSaveInstance = async () => {
        if (!validateForm() || !selectedIntegration) return;

        // Get tenant_id and tenant_name from context
        let tenantId: string | null = null;
        let tenantName: string | null = null;
        if (assignedTenants && assignedTenants.length > 0) {
            if (selectedTenantIds === 'all') {
                // Use first tenant if 'all' is selected
                tenantId = assignedTenants[0]?.id || null;
                tenantName = assignedTenants[0]?.name || null;
            } else if (Array.isArray(selectedTenantIds) && selectedTenantIds.length > 0) {
                // Use first selected tenant
                tenantId = selectedTenantIds[0];
                const selectedTenant = assignedTenants.find(t => t.id === tenantId);
                tenantName = selectedTenant?.name || null;
            } else if (typeof selectedTenantIds === 'string') {
                tenantId = selectedTenantIds;
                const selectedTenant = assignedTenants.find(t => t.id === tenantId);
                tenantName = selectedTenant?.name || null;
            }
        }

        if (!tenantId) {
            setModalMessage('No tenant selected. Please select a tenant first.');
            setShowErrorModal(true);
            setShowSuccessModal(false);
            return;
        }

        setIsSaving(true);
        try {
            // Extract instance_name, incident_type, classifier, mapper from formData and create configuration without them
            const { instance_name, incident_type, classifier, mapper, ...configuration } = formData;
            const instanceNameToSave = instance_name?.toString().trim() || `${selectedIntegration.name} Instance`;
            
            // Save instance to Supabase
            const { data, error } = await supabase
                .from('integration_instances')
                .insert({
                    integration_id: selectedIntegration.id,
                    tenant_id: tenantId,
                    tenant_name: tenantName,
                    name: selectedIntegration.name,
                    logo: selectedIntegration.logo,
                    instance_name: instanceNameToSave,
                    incident_type: incident_type?.toString().trim() || null,
                    classifier: classifier?.toString().trim() || null,
                    mapper: mapper?.toString().trim() || null,
                    configuration: configuration,
                    status: 'pending'
                })
                .select();

            if (error) {
                console.error('Error saving instance:', error);
                setModalMessage(`Failed to save integration instance: ${error.message || 'Unknown error'}`);
                setShowErrorModal(true);
                setShowSuccessModal(false);
                return;
            }

            // Save enabled tools for this instance
            const insertedInstance = data?.[0];
            const insertedInstanceId = insertedInstance?.id;
            const tools = selectedIntegration.tools || [];
            const enabledTools = tools.filter((tool) => toolToggles[tool.name]);

            if (insertedInstanceId && enabledTools.length > 0) {
                const { error: toolsError } = await supabase
                    .from("instance_tools")
                    .insert(
                        enabledTools.map((tool) =>
                            buildInstanceToolInsertRow(
                                tool,
                                toolConfigs[tool.name] ?? {},
                                instanceNameToSave,
                                insertedInstanceId,
                                tenantId
                            )
                        )
                    );

                if (toolsError) {
                    console.error("Error saving instance tools:", toolsError);
                    setModalMessage(`Failed to save tools for integration instance: ${toolsError.message || "Unknown error"}`);
                    setShowErrorModal(true);
                    setShowSuccessModal(false);
                    return;
                }
            }

            // Update the integration's configured instances count
            const { error: updateError } = await supabase
                .from('marketplace_integrations')
                .update({ 
                    configured_instances: selectedIntegration.configuredInstances + 1 
                })
                .eq('id', selectedIntegration.id);

            if (updateError) {
                console.error('Error updating integration count:', updateError);
            }

            // Refresh integrations and instances list
            await fetchIntegrations();
            await fetchIntegrationInstances();
            
            setShowAddInstanceModal(false);
            setFormData({});
            setFormErrors({});
            setToolToggles({});
            setToolConfigs({});
            setModalMessage('Integration instance saved successfully!');
            setShowSuccessModal(true);
            setShowErrorModal(false);
        } catch (error: any) {
            console.error('Error saving instance:', error);
            setModalMessage(`Failed to save integration instance: ${error?.message || 'Unknown error'}`);
            setShowErrorModal(true);
            setShowSuccessModal(false);
        } finally {
            setIsSaving(false);
        }
    };

    // Handle update instance
    const handleUpdateInstance = async () => {
        if (!validateForm() || !selectedInstance) return;

        setIsUpdating(true);
        try {
            // Extract instance_name, incident_type, classifier, mapper from formData and create configuration without them
            const { instance_name, incident_type, classifier, mapper, ...configuration } = formData;
            const instanceNameToSave = instance_name?.toString().trim() || selectedInstance.instance_name;
            
            // Update instance in Supabase
            const { error } = await supabase
                .from('integration_instances')
                .update({
                    instance_name: instanceNameToSave,
                    incident_type: incident_type?.toString().trim() || null,
                    classifier: classifier?.toString().trim() || null,
                    mapper: mapper?.toString().trim() || null,
                    configuration: configuration
                })
                .eq('id', selectedInstance.id);

            if (error) {
                console.error('Error updating instance:', error);
                setModalMessage(`Failed to update integration instance: ${error.message || 'Unknown error'}`);
                setShowErrorModal(true);
                setShowSuccessModal(false);
                return;
            }

            // Sync enabled tools in instance_tools table
            const tools = selectedIntegration?.tools || [];
            const enabledTools = tools.filter((tool) => toolToggles[tool.name]);

            const { error: deleteToolsError } = await supabase
                .from("instance_tools")
                .delete()
                .eq("instance_id", selectedInstance.id);

            if (deleteToolsError) {
                console.error("Error deleting instance tools:", deleteToolsError);
                setModalMessage(`Failed to sync tools: ${deleteToolsError.message || "Unknown error"}`);
                setShowErrorModal(true);
                setShowSuccessModal(false);
                return;
            }

            if (enabledTools.length > 0) {
                const { error: insertToolsError } = await supabase
                    .from("instance_tools")
                    .insert(
                        enabledTools.map((tool) =>
                            buildInstanceToolInsertRow(
                                tool,
                                toolConfigs[tool.name] ?? {},
                                instanceNameToSave,
                                selectedInstance.id,
                                selectedInstance.tenant_id ?? null
                            )
                        )
                    );

                if (insertToolsError) {
                    console.error("Error inserting instance tools:", insertToolsError);
                    setModalMessage(`Failed to sync tools: ${insertToolsError.message || "Unknown error"}`);
                    setShowErrorModal(true);
                    setShowSuccessModal(false);
                    return;
                }
            }

            // Refresh instances list
            await fetchIntegrationInstances();
            
            setShowEditInstanceModal(false);
            setFormData({});
            setFormErrors({});
            setToolToggles({});
            setToolConfigs({});
            setModalMessage('Integration instance updated successfully!');
            setShowSuccessModal(true);
            setShowErrorModal(false);
        } catch (error: any) {
            console.error('Error updating instance:', error);
            setModalMessage(`Failed to update integration instance: ${error?.message || 'Unknown error'}`);
            setShowErrorModal(true);
            setShowSuccessModal(false);
        } finally {
            setIsUpdating(false);
        }
    };

    // Render parameter input based on type
    const renderParameterInput = (param: IntegrationParameter) => {
        // When adding a new instance we should not prefill any defaults from the marketplace.
        // When editing an instance, we keep showing whatever is in `formData` (loaded from instance configuration).
        const rawValue = formData[param.id];
        const shouldUseDefault = showEditInstanceModal && rawValue === undefined;
        const value = rawValue ?? (shouldUseDefault ? (param.defaultValue ?? '') : '');
        const error = formErrors[param.id];

        switch (param.type) {
            case 'select':
                return (
                    <Form.Select
                        value={value}
                        onChange={(e) => handleFormChange(param.id, e.target.value)}
                        isInvalid={!!error}
                    >
                        <option value="">Select {param.label}</option>
                        {param.options?.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </Form.Select>
                );
            
            case 'checkbox':
                return (
                    <Form.Check
                        type="checkbox"
                        checked={!!value}
                        onChange={(e) => handleFormChange(param.id, e.target.checked)}
                        isInvalid={!!error}
                    />
                );
            
            case 'password':
                return (
                    <Form.Control
                        type="password"
                        value={value}
                        onChange={(e) => handleFormChange(param.id, e.target.value)}
                        placeholder={param.placeholder}
                        isInvalid={!!error}
                    />
                );
            
            case 'number':
                return (
                    <Form.Control
                        type="number"
                        value={value}
                        onChange={(e) => handleFormChange(param.id, e.target.value)}
                        placeholder={param.placeholder}
                        isInvalid={!!error}
                    />
                );
            
            case 'email':
                return (
                    <Form.Control
                        type="email"
                        value={value}
                        onChange={(e) => handleFormChange(param.id, e.target.value)}
                        placeholder={param.placeholder}
                        isInvalid={!!error}
                    />
                );
            
            case 'url':
                return (
                    <Form.Control
                        type="url"
                        value={value}
                        onChange={(e) => handleFormChange(param.id, e.target.value)}
                        placeholder={param.placeholder}
                        isInvalid={!!error}
                    />
                );
            
            default:
                return (
                    <Form.Control
                        type="text"
                        value={value}
                        onChange={(e) => handleFormChange(param.id, e.target.value)}
                        placeholder={param.placeholder}
                        isInvalid={!!error}
                    />
                );
        }
    };

    const setToolConfigValue = (toolName: string, fieldId: string, value: unknown) => {
        setToolConfigs((prev) => ({
            ...prev,
            [toolName]: { ...(prev[toolName] || {}), [fieldId]: value },
        }));
        const errKey = `tool_${toolName}_${fieldId}`;
        setFormErrors((prev) => {
            if (!prev[errKey]) return prev;
            const next = { ...prev };
            delete next[errKey];
            return next;
        });
    };

    const renderToolMarketplaceField = (tool: MarketplaceTool, field: ToolFieldRequirement, idPrefix: string) => {
        const merged = { ...initEmptyToolConfig(tool), ...(toolConfigs[tool.name] || {}) };
        if (!shouldShowToolField(field, merged)) return null;
        const errKey = `tool_${tool.name}_${field.id}`;
        const err = formErrors[errKey];
        const v = merged[field.id];

        const label = (
            <Form.Label className="small mb-1">
                {field.label}
                {isToolFieldRequiredNow(field, merged) && <span className="text-danger ms-1">*</span>}
            </Form.Label>
        );

        let control: React.ReactElement | null = null;
        switch (field.type) {
            case 'boolean':
                control = (
                    <Form.Check
                        type="switch"
                        id={`${idPrefix}-tool-${tool.name}-${field.id}`}
                        label={
                            <span className="form-label small mb-0">
                                {field.label}
                            </span>
                        }
                        checked={v === true}
                        onChange={(e) => setToolConfigValue(tool.name, field.id, e.target.checked)}
                        isInvalid={!!err}
                    />
                );
                break;
            case 'string_list':
                control = (
                    <>
                        {label}
                        <Form.Control
                            as="textarea"
                            rows={2}
                            id={`${idPrefix}-tool-${tool.name}-${field.id}`}
                            size="sm"
                            value={v == null ? '' : String(v)}
                            placeholder={field.placeholder || field.help}
                            onChange={(e) => setToolConfigValue(tool.name, field.id, e.target.value)}
                            isInvalid={!!err}
                        />
                    </>
                );
                break;
            case 'select':
                control = (
                    <>
                        {label}
                        <Form.Select
                            size="sm"
                            id={`${idPrefix}-tool-${tool.name}-${field.id}`}
                            value={v == null ? '' : String(v)}
                            onChange={(e) => setToolConfigValue(tool.name, field.id, e.target.value)}
                            isInvalid={!!err}
                        >
                            <option value="">Select {field.label}</option>
                            {field.options?.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </Form.Select>
                    </>
                );
                break;
            case 'number':
                control = (
                    <>
                        {label}
                        <Form.Control
                            type="number"
                            size="sm"
                            id={`${idPrefix}-tool-${tool.name}-${field.id}`}
                            value={
                                v === '' || v === undefined || v === null
                                    ? ''
                                    : String(v)
                            }
                            min={field.min}
                            max={field.max}
                            onChange={(e) => {
                                const raw = e.target.value;
                                setToolConfigValue(
                                    tool.name,
                                    field.id,
                                    raw === '' ? '' : Number(raw)
                                );
                            }}
                            isInvalid={!!err}
                        />
                    </>
                );
                break;
            default:
                control = (
                    <>
                        {label}
                        <Form.Control
                            type="text"
                            size="sm"
                            id={`${idPrefix}-tool-${tool.name}-${field.id}`}
                            value={v == null ? '' : String(v)}
                            placeholder={field.placeholder}
                            onChange={(e) => setToolConfigValue(tool.name, field.id, e.target.value)}
                            isInvalid={!!err}
                        />
                    </>
                );
        }

        return (
            <Form.Group key={field.id} className="mb-2">
                {field.type === 'boolean' ? (
                    <>
                        {control}
                        {err && <div className="text-danger small mt-1">{err}</div>}
                    </>
                ) : (
                    <>
                        {control}
                        {field.help && <Form.Text className="text-muted">{field.help}</Form.Text>}
                        {err && <div className="invalid-feedback d-block">{err}</div>}
                    </>
                )}
            </Form.Group>
        );
    };

    const renderToolsSidebar = (switchIdPrefix: string, marketplaceFieldPrefix: string) => {
        const tools = selectedIntegration?.tools || [];
        return (
            <div className="mt-4">
                <div className="d-flex justify-content-between align-items-center">
                    <h6 className="mb-0">Tools</h6>
                </div>
                <div className="d-flex flex-column gap-2 mt-2">
                    {tools.length === 0 ? (
                        <div className="text-muted">No tools defined for this integration.</div>
                    ) : (
                        tools.map((tool) => {
                            const enabled = !!toolToggles[tool.name];
                            const fields = getToolFieldList(tool);
                            return (
                                <div key={tool.name} className="border rounded p-2">
                                    <div className="d-flex justify-content-between align-items-start gap-2">
                                        <div>
                                            <span className="fw-medium">{tool.name}</span>
                                            {tool.type ? (
                                                <span className="text-muted small ms-2">({tool.type})</span>
                                            ) : null}
                                        </div>
                                        <Form.Check
                                            type="switch"
                                            id={`${switchIdPrefix}-${tool.name}`}
                                            label={enabled ? 'Enabled' : 'Disabled'}
                                            checked={enabled}
                                            onChange={(e) => {
                                                const checked = e.target.checked;
                                                setToolToggles((prev) => ({
                                                    ...prev,
                                                    [tool.name]: checked,
                                                }));
                                                if (checked) {
                                                    setToolConfigs((prev) => ({
                                                        ...prev,
                                                        [tool.name]: {
                                                            ...initEmptyToolConfig(tool),
                                                            ...prev[tool.name],
                                                        },
                                                    }));
                                                }
                                            }}
                                        />
                                    </div>
                                    {enabled && fields.length > 0 && (
                                        <Card className="mt-2 bg-light border-0">
                                            <Card.Body className="py-2 px-2">
                                                <div className="small fw-semibold text-muted mb-2">
                                                    Tool configuration
                                                </div>
                                                {fields.map((field) =>
                                                    renderToolMarketplaceField(tool, field, marketplaceFieldPrefix)
                                                )}
                                            </Card.Body>
                                        </Card>
                                    )}
                                    {enabled && fields.length === 0 && (
                                        <div className="text-muted small mt-2">
                                            No extra configuration for this tool.
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        );
    };

    return (
        <Fragment>
            <Seo title="Integrations" />
            
            <div className="container-fluid">
                {/* Header Section */}
                <Row>
                    <Col xl={12}>
                        <div className="d-flex justify-content-between align-items-center" style={{ paddingTop: '0.75rem', paddingBottom: '0.75rem', marginBottom: 0 }}>
                            <h5 className="mb-0">Instances</h5>
                        </div>
                    </Col>
                </Row>

                {/* Search and Filter Section */}
                <Row>
                    <Col xl={12}>
                        <Card className="mb-4">
                            <Card.Body>
                                <Row className="align-items-center">
                                    <Col md={2}>
                                        <Dropdown>
                                            <Dropdown.Toggle variant="outline-secondary" className="w-100">
                                                Category: {selectedCategory === 'all' ? 'All' : selectedCategory}
                                            </Dropdown.Toggle>
                                            <Dropdown.Menu>
                                                {availableCategories.map(category => (
                                                    <Dropdown.Item
                                                        key={category.value}
                                                        onClick={() => handleCategorySelect(category.value)}
                                                        active={selectedCategory === category.value}
                                                    >
                                                        {category.label}
                                                    </Dropdown.Item>
                                                ))}
                                            </Dropdown.Menu>
                                        </Dropdown>
                                    </Col>
                                    <Col md={4}>
                                        <InputGroup>
                                            <Form.Control
                                                type="text"
                                                placeholder="Search integrations..."
                                                value={searchQuery}
                                                onChange={handleSearchChange}
                                            />
                                            <Button variant="outline-secondary">
                                                <i className="ri-search-line"></i>
                                            </Button>
                                        </InputGroup>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Integrations List */}
                <Row>
                    <Col xl={12}>
                        {loading ? (
                            <Card>
                                <Card.Body className="text-center py-5">
                                    <Spinner animation="border" className="mb-3" />
                                    <h5 className="text-muted">Loading integrations...</h5>
                                </Card.Body>
                            </Card>
                        ) : (
                            <>
                                {Object.entries(groupedIntegrations).map(([category, categoryIntegrations]) => (
                                    <div key={category} className="mb-4">
                                        <h6 className="mb-3 fs-6">{category} ({categoryIntegrations.length})</h6>
                                        
                                        {categoryIntegrations.map(integration => {
                                            const instances = getInstancesForIntegration(integration.id);
                                            const isExpanded = expandedIntegrations.has(integration.id);
                                            
                                            return (
                                                <Card key={integration.id} className="mb-3">
                                                    <Card.Body>
                                                        <Row className="align-items-center">
                                                            <Col md={1}>
                                                                <div className="d-flex align-items-center">
                                                                    <i 
                                                                        className={`ri-arrow-${isExpanded ? 'down' : 'right'}-s-line me-2 cursor-pointer`}
                                                                        onClick={() => toggleIntegrationDropdown(integration.id)}
                                                                        style={{ cursor: 'pointer' }}
                                                                    ></i>
                                                                    <div className="integration-logo me-3">
                                                                        {integration.logo ? (
                                                                            <Image
                                                                                src={integration.logo}
                                                                                alt={`${integration.name} logo`}
                                                                                width={70}
                                                                                height={50}
                                                                                className="rounded"
                                                                                style={{ objectFit: 'contain' }}
                                                                            />
                                                                        ) : (
                                                                            <div className="logo-placeholder">
                                                                                <i className="ri-radar-line"></i>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </Col>
                                                            <Col md={8}>
                                                                <div className="integration-info">
                                                                    <h6 className="mb-1">
                                                                        {integration.name} {integration.version}
                                                                        <span className="text-muted ms-2">({instances.length} configured)</span>
                                                                        <i className={`ri-check-line text-success ms-2 ${instances.length > 0 ? '' : 'd-none'}`}></i>
                                                                    </h6>
                                                                    <p className="text-muted mb-0">
                                                                        {integration.description}
                                                                        <span className="text-primary ms-1">Show more</span>
                                                                    </p>
                                                                </div>
                                                            </Col>
                                                            <Col md={3} className="text-end">
                                                                <Button
                                                                    variant="outline-secondary"
                                                                    onClick={() => handleAddInstance(integration)}
                                                                    className="d-flex align-items-center"
                                                                >
                                                                    <i className="ri-add-line me-1"></i>
                                                                    Add instance
                                                                </Button>
                                                            </Col>
                                                        </Row>
                                                        
                                                        {/* Expanded instances section */}
                                                        {isExpanded && instances.length > 0 && (
                                                            <div className="mt-3 pt-3 border-top">
                                                                <h6 className="mb-3 fs-6">Configured Instances</h6>
                                                                {instances.map(instance => (
                                                                    <Card key={instance.id} className="mb-2 bg-light">
                                                                        <Card.Body className="py-2">
                                                                            <Row className="align-items-center">
                                                                                <Col md={6}>
                                                                                    <div className="d-flex align-items-center">
                                                                                        <h6 className="mb-0 me-3 instance-name-text">{instance.instance_name}</h6>
                        <span className={`badge ${instance.status === 'active' ? 'bg-success' : instance.status === 'inactive' ? 'bg-secondary' : 'bg-warning'}`}>
                            {instance.status}
                        </span>
                                                                                    </div>
                                                                                </Col>
                                                                                <Col md={6} className="text-end">
                                                                                    <div className="d-flex align-items-center justify-content-end">
                        <Form.Check
                            type="checkbox"
                            label="Enabled"
                            checked={instance.status === 'active' ? (checkboxStates[instance.id] ?? true) : false}
                            onChange={() => handleToggleInstanceStatus(instance.id, instance.status)}
                            disabled={instance.status === 'inactive' || instance.status === 'inprogress'}
                            className="me-3"
                        />
                                                                                        <Button
                                                                                            variant="outline-info"
                                                                                            size="sm"
                                                                                            onClick={() => handleTestInstanceConnection(instance)}
                                                                                            disabled={testingInstanceId !== null}
                                                                                            className="me-2"
                                                                                        >
                                                                                            {testingInstanceId === instance.id ? (
                                                                                                <Spinner size="sm" />
                                                                                            ) : (
                                                                                                'Test'
                                                                                            )}
                                                                                        </Button>
                                                                                        <Button
                                                                                            variant="outline-primary"
                                                                                            size="sm"
                                                                                            onClick={() => handleEditInstance(instance, integration)}
                                                                                            className="me-2"
                                                                                        >
                                                                                            <i className="ri-settings-3-line"></i>
                                                                                        </Button>
                                                                                    </div>
                                                                                </Col>
                                                                            </Row>
                                                                        </Card.Body>
                                                                    </Card>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </Card.Body>
                                                </Card>
                                            );
                                        })}
                                    </div>
                                ))}

                                {filteredIntegrations.length === 0 && !loading && (
                                    <Card>
                                        <Card.Body className="text-center py-5">
                                            <i className="ri-search-line text-muted" style={{ fontSize: '3rem' }}></i>
                                            <h5 className="mt-3 text-muted">No integrations found</h5>
                                            <p className="text-muted">Try adjusting your search criteria or category filter.</p>
                                        </Card.Body>
                                    </Card>
                                )}
                            </>
                        )}
                    </Col>
                </Row>
            </div>

            {/* Add Instance Modal */}
            <Modal show={showAddInstanceModal} onHide={() => setShowAddInstanceModal(false)} size="xl">
                <Modal.Header closeButton>
                    <Modal.Title>
                        Add Instance - {selectedIntegration?.name} {selectedIntegration?.version}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedIntegration && (
                        <Row>
                            <Col md={7}>
                                <Form>
                                    <Row>
                                        <Col md={12} className="mb-3">
                                            <Form.Group>
                                                <Form.Label>
                                                    Instance Name
                                                    <span className="text-danger ms-1">*</span>
                                                </Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={formData.instance_name || ''}
                                                    onChange={(e) => handleFormChange('instance_name', e.target.value)}
                                                    placeholder={`${selectedIntegration.name} Instance`}
                                                    isInvalid={!!formErrors.instance_name}
                                                />
                                                {formErrors.instance_name && (
                                                    <Form.Control.Feedback type="invalid">
                                                        {formErrors.instance_name}
                                                    </Form.Control.Feedback>
                                                )}
                                                <Form.Text className="text-muted">
                                                    Enter a unique name for this integration instance
                                                </Form.Text>
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                    <Row>
                                        {selectedIntegration.parameters?.map(param => (
                                            <Col md={6} key={param.id} className="mb-3">
                                                <Form.Group>
                                                    <Form.Label>
                                                        {param.label}
                                                        {param.required && <span className="text-danger ms-1">*</span>}
                                                    </Form.Label>
                                                    {renderParameterInput(param)}
                                                    {formErrors[param.id] && (
                                                        <Form.Control.Feedback type="invalid">
                                                            {formErrors[param.id]}
                                                        </Form.Control.Feedback>
                                                    )}
                                                    {param.description && (
                                                        <Form.Text className="text-muted">
                                                            {param.description}
                                                        </Form.Text>
                                                    )}
                                                </Form.Group>
                                            </Col>
                                        ))}
                                    </Row>
                                    <Row>
                                        <Col md={4} className="mb-3">
                                            <Form.Group>
                                                <Form.Label>Incident Type</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={formData.incident_type || ''}
                                                    onChange={(e) => handleFormChange('incident_type', e.target.value)}
                                                    placeholder="Enter incident type"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={4} className="mb-3">
                                            <Form.Group>
                                                <Form.Label>Classifier</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={formData.classifier || ''}
                                                    onChange={(e) => handleFormChange('classifier', e.target.value)}
                                                    placeholder="Enter classifier"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={4} className="mb-3">
                                            <Form.Group>
                                                <Form.Label>Mapper</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={formData.mapper || ''}
                                                    onChange={(e) => handleFormChange('mapper', e.target.value)}
                                                    placeholder="Enter mapper"
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </Form>
                            </Col>
                            <Col md={5}>
                                <div className="border-start ps-4" style={{ minHeight: '100%' }}>
                                    <h6 className="mb-3">Information</h6>
                                    <div 
                                        className="text-muted"
                                        style={{ 
                                            fontSize: '0.9rem',
                                            lineHeight: '1.6',
                                            whiteSpace: 'pre-wrap'
                                        }}
                                        dangerouslySetInnerHTML={{ 
                                            __html: selectedIntegration.modal_info || '<p class="text-muted">No information available.</p>' 
                                        }}
                                    />

                                    {renderToolsSidebar('tool-switch-right', 'add')}
                                </div>
                            </Col>
                        </Row>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowAddInstanceModal(false)}>
                        Cancel
                    </Button>
                    <Button 
                        variant="primary" 
                        onClick={handleSaveInstance}
                        disabled={isTesting || isSaving}
                    >
                        {isSaving ? (
                            <>
                                <Spinner size="sm" className="me-2" />
                                Saving...
                            </>
                        ) : (
                            'Save'
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Edit Instance Modal */}
            <Modal show={showEditInstanceModal} onHide={() => setShowEditInstanceModal(false)} size="xl">
                <Modal.Header closeButton>
                    <Modal.Title>
                        Edit Instance - {selectedInstance?.instance_name}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedIntegration && (
                        <Row>
                            <Col md={7}>
                                <Form>
                                    <Row>
                                        <Col md={12} className="mb-3">
                                            <Form.Group>
                                                <Form.Label>
                                                    Instance Name
                                                    <span className="text-danger ms-1">*</span>
                                                </Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={formData.instance_name || ''}
                                                    onChange={(e) => handleFormChange('instance_name', e.target.value)}
                                                    placeholder="Enter instance name"
                                                    isInvalid={!!formErrors.instance_name}
                                                />
                                                {formErrors.instance_name && (
                                                    <Form.Control.Feedback type="invalid">
                                                        {formErrors.instance_name}
                                                    </Form.Control.Feedback>
                                                )}
                                                <Form.Text className="text-muted">
                                                    Enter a unique name for this integration instance
                                                </Form.Text>
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                    <Row>
                                        {selectedIntegration.parameters?.map(param => (
                                            <Col md={6} key={param.id} className="mb-3">
                                                <Form.Group>
                                                    <Form.Label>
                                                        {param.label}
                                                        {param.required && <span className="text-danger ms-1">*</span>}
                                                    </Form.Label>
                                                    {renderParameterInput(param)}
                                                    {formErrors[param.id] && (
                                                        <Form.Control.Feedback type="invalid">
                                                            {formErrors[param.id]}
                                                        </Form.Control.Feedback>
                                                    )}
                                                    {param.description && (
                                                        <Form.Text className="text-muted">
                                                            {param.description}
                                                        </Form.Text>
                                                    )}
                                                </Form.Group>
                                            </Col>
                                        ))}
                                    </Row>
                                    <Row>
                                        <Col md={4} className="mb-3">
                                            <Form.Group>
                                                <Form.Label>Incident Type</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={formData.incident_type || ''}
                                                    onChange={(e) => handleFormChange('incident_type', e.target.value)}
                                                    placeholder="Enter incident type"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={4} className="mb-3">
                                            <Form.Group>
                                                <Form.Label>Classifier</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={formData.classifier || ''}
                                                    onChange={(e) => handleFormChange('classifier', e.target.value)}
                                                    placeholder="Enter classifier"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={4} className="mb-3">
                                            <Form.Group>
                                                <Form.Label>Mapper</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={formData.mapper || ''}
                                                    onChange={(e) => handleFormChange('mapper', e.target.value)}
                                                    placeholder="Enter mapper"
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </Form>
                            </Col>
                            <Col md={5}>
                                <div className="border-start ps-4" style={{ minHeight: '100%' }}>
                                    <h6 className="mb-3">Information</h6>
                                    <div 
                                        className="text-muted"
                                        style={{ 
                                            fontSize: '0.9rem',
                                            lineHeight: '1.6',
                                            whiteSpace: 'pre-wrap'
                                        }}
                                        dangerouslySetInnerHTML={{ 
                                            __html: selectedIntegration.modal_info || '<p class="text-muted">No information available.</p>' 
                                        }}
                                    />
                                    {renderToolsSidebar('tool-switch-edit-right', 'edit')}
                                </div>
                            </Col>
                        </Row>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowEditInstanceModal(false)}>
                        Cancel
                    </Button>
                    <Button 
                        variant="outline-primary" 
                        onClick={handleTestConnection}
                        disabled={isTesting || isUpdating}
                    >
                        {isTesting ? (
                            <>
                                <Spinner size="sm" className="me-2" />
                                Testing...
                            </>
                        ) : (
                            'Test'
                        )}
                    </Button>
                    <Button 
                        variant="primary" 
                        onClick={handleUpdateInstance}
                        disabled={isTesting || isUpdating}
                    >
                        {isUpdating ? (
                            <>
                                <Spinner size="sm" className="me-2" />
                                Updating...
                            </>
                        ) : (
                            'Update'
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>

            <style jsx>{`
                .integration-logo {
                    width: 70px;
                    height: 50px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .integration-logo img {
                    max-width: 100%;
                    max-height: 100%;
                    border-radius: 6px;
                }
                
                .integration-logo .logo-placeholder {
                    width: 70px;
                    height: 50px;
                    background-color: #f8f9fa;
                    border-radius: 6px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.2rem;
                    color: #6c757d;
                }
                
                .integration-info h6 {
                    font-weight: 600;
                }
                
                .integration-info .text-muted {
                    font-size: 0.875rem;
                }
                
                .instance-name-text {
                    font-size: 0.9rem;
                }
            `}</style>

            {/* Success Modal */}
            <Modal centered show={showSuccessModal} onHide={() => setShowSuccessModal(false)} keyboard={false} className="modal fade">
                <Modal.Header closeButton>
                    <Modal.Title>
                        <i className="ri-checkbox-circle-line text-success me-2"></i>
                        Success
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p className="mb-0">{modalMessage}</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="primary" onClick={() => setShowSuccessModal(false)}>
                        OK
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Error Modal */}
            <Modal centered show={showErrorModal} onHide={() => setShowErrorModal(false)} keyboard={false} className="modal fade">
                <Modal.Header closeButton>
                    <Modal.Title>
                        <i className="ri-error-warning-line text-danger me-2"></i>
                        Error
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p className="mb-0">{modalMessage}</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowErrorModal(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </Fragment>
    );
};

export default IntegrationsList;
