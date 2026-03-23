"use client";

import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { supabase } from '@/shared/lib/supabase';
import { useTenantContext } from '@/shared/contextapi/TenantContext';
import { useDateRangeContext } from '@/shared/contextapi/DateRangeContext';
import { useUserContext } from '@/shared/contextapi/UserContext';
import { convertUserTimezoneToUTC } from '@/shared/lib/timezone';

const THEME = {
  primaryHex: '#7961f5',
  infoHex: '#28c8eb',
  dangerHex: '#fa4b42',
  orangeHex: '#ff8100',
  grayHex: '#7987a1',
};

const FLOW_LINE_LIGHT = '#64748b';

function subscribeHtmlThemeMode(onChange: () => void) {
  const root = document.documentElement;
  const obs = new MutationObserver(onChange);
  obs.observe(root, { attributes: true, attributeFilter: ['data-theme-mode'] });
  return () => obs.disconnect();
}

function getIsDarkThemeMode(): boolean {
  return document.documentElement.getAttribute('data-theme-mode') === 'dark';
}

function useIsDarkThemeMode(): boolean {
  return useSyncExternalStore(subscribeHtmlThemeMode, getIsDarkThemeMode, () => false);
}

/** Data source: name + optional icon (Remix class or image src). */
export interface DataSourceItem {
  name: string;
  /** Remix Icon class (e.g. "ri-cloud-line"). */
  iconClass?: string;
  /** Image src for logo (e.g. "/assets/images/brand-logos/azure-sentinel.png"). */
  iconImage?: string;
}

const DEFAULT_SOURCES: DataSourceItem[] = [
  { name: 'Endpoints', iconClass: 'ri-server-line' },
  { name: 'NGFW', iconClass: 'ri-shield-line' },
  { name: 'Google Cloud', iconClass: 'ri-cloud-line' },
  { name: 'Amazon AWS', iconClass: 'ri-cloud-line' },
  { name: 'Azure', iconImage: '/assets/images/brand-logos/azure-sentinel.png' },
  { name: 'Office 365', iconClass: 'ri-mail-line' },
  { name: 'Proofpoint', iconClass: 'ri-shield-check-line' },
  { name: 'Okta', iconClass: 'ri-shield-user-line' },
  { name: 'Apache', iconClass: 'ri-server-line' },
  { name: 'Prisma Cloud', iconClass: 'ri-cloud-line' },
];

// Default structure for open investigations by severity (High / Medium / Low)
const DEFAULT_OPEN_BY_SEVERITY = [
  { themeKey: 'danger' as const, count: 0 },  // High
  { themeKey: 'warning' as const, count: 0 }, // Medium
  { themeKey: 'info' as const, count: 0 },    // Low
];

export interface SecurityDashboardWidgetProps {
  /** Data sources shown in the left column. If omitted, default sources are used. */
  sources?: DataSourceItem[];
}

export default function SecurityDashboardWidget({ sources = DEFAULT_SOURCES }: SecurityDashboardWidgetProps) {
  const isDark = useIsDarkThemeMode();
  const flowCanvasRef = useRef<HTMLCanvasElement>(null);
  const orbCanvasRef = useRef<HTMLCanvasElement>(null);
  const caseCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [issueCount, setIssueCount] = useState(0);
  const [caseCount, setCaseCount] = useState(0);
  const [openInvestigations, setOpenInvestigations] = useState(0);
  const [resolvedInvestigations, setResolvedInvestigations] = useState(0);
  const [automatedInvestigations, setAutomatedInvestigations] = useState(0);
  const [manualInvestigations, setManualInvestigations] = useState(0);
  const [openBySeverity, setOpenBySeverity] = useState(DEFAULT_OPEN_BY_SEVERITY);

  const { assignedTenants, selectedTenantIds, isLoading: tenantsLoading } = useTenantContext();
  const { dateRange, isLoading: dateRangeLoading } = useDateRangeContext();
  const { userData, isLoading: userLoading } = useUserContext();

  // Count-up animation
  useEffect(() => {
    const issueTarget = 2404;
    const issueDur = 1600;
    let start: number | null = null;
    function step(ts: number) {
      if (!start) start = ts;
      const p = Math.min((ts - start) / issueDur, 1);
      setIssueCount(Math.floor(p * issueTarget));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, []);

  // Investigations (cases) count: match tickets table filters (tenants + date range)
  useEffect(() => {
    let cancelled = false;
    let animId: number | null = null;

    const fetchAndAnimateCases = async () => {
      try {
        // Helper to apply the same tenant + date filters as the tickets page
        const applyCommonFilters = (q: ReturnType<typeof supabase.from>) => {
          let query = q;

          // Tenant filter
          if (selectedTenantIds === 'all') {
            const tenantIds = assignedTenants.map((t) => t.id);
            if (tenantIds.length > 0) {
              query = query.in('tenant_id', tenantIds);
            }
          } else if (Array.isArray(selectedTenantIds) && selectedTenantIds.length > 0) {
            query = query.in('tenant_id', selectedTenantIds);
          } else if (typeof selectedTenantIds === 'string' && selectedTenantIds !== 'all') {
            query = query.eq('tenant_id', selectedTenantIds);
          }

          // Date range filter (created_at in UTC, converted from user's timezone)
          if (dateRange && dateRange[0] && dateRange[1] && userData?.timezone) {
            const startDate = new Date(dateRange[0].getTime());
            const endDate = new Date(dateRange[1].getTime());
            const startUTC = convertUserTimezoneToUTC(startDate, userData.timezone);
            const endUTC = convertUserTimezoneToUTC(endDate, userData.timezone);
            query = query.gte('created_at', startUTC).lte('created_at', endUTC);
          }

          return query;
        };

        // Total, open, resolved (closed), and automated ticket counts for the current filters.
        const { count: totalCount = 0 } = await applyCommonFilters(
          supabase.from('tickets').select('*', { count: 'exact', head: true })
        );
        const { count: openCount = 0 } = await applyCommonFilters(
          supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'open')
        );
        const { count: closedCount = 0 } = await applyCommonFilters(
          supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'closed')
        );
        const { count: automatedCount = 0 } = await applyCommonFilters(
          supabase
            .from('tickets')
            .select('*', { count: 'exact', head: true })
            .in('ai_status', ['Investigating', 'Completed'])
        );

        const target = totalCount;
        const openValue = openCount;
        const resolvedValue = closedCount;
        const automatedValue = automatedCount;
        const manualValue = Math.max(target - automatedValue, 0);

        // Open investigations by severity (High / Medium / Low) for current filters
        const [{ count: highCount = 0 }, { count: medCount = 0 }, { count: lowCount = 0 }] = await Promise.all([
          applyCommonFilters(
            supabase
              .from('tickets')
              .select('*', { count: 'exact', head: true })
              .eq('status', 'open')
              .eq('severity', 'High')
          ),
          applyCommonFilters(
            supabase
              .from('tickets')
              .select('*', { count: 'exact', head: true })
              .eq('status', 'open')
              .eq('severity', 'Medium')
          ),
          applyCommonFilters(
            supabase
              .from('tickets')
              .select('*', { count: 'exact', head: true })
              .eq('status', 'open')
              .eq('severity', 'Low')
          ),
        ]);

        if (cancelled) return;

        // Update per-severity open investigations counts (snapshot)
        setOpenBySeverity([
          { themeKey: 'danger', count: highCount },
          { themeKey: 'warning', count: medCount },
          { themeKey: 'info', count: lowCount },
        ]);

        // Animate all investigation-related counters together
        const caseDur = 1200;
        let start: number | null = null;

        const stepCase = (ts: number) => {
          if (!start) start = ts;
          const p = Math.min((ts - start) / caseDur, 1);
          const factor = p;
          setCaseCount(Math.floor(factor * target));
          setOpenInvestigations(Math.floor(factor * openValue));
          setResolvedInvestigations(Math.floor(factor * resolvedValue));
          setAutomatedInvestigations(Math.floor(factor * automatedValue));
          setManualInvestigations(Math.floor(factor * manualValue));
          if (p < 1 && !cancelled) {
            animId = requestAnimationFrame(stepCase);
          }
        };

        animId = requestAnimationFrame(stepCase);
      } catch (e) {
        console.error('Unexpected error fetching investigations counts:', e);
      }
    };

    // Avoid firing before contexts are ready
    if (!tenantsLoading && !dateRangeLoading && !userLoading) {
      fetchAndAnimateCases();
    }

    return () => {
      cancelled = true;
      if (animId !== null) {
        cancelAnimationFrame(animId);
      }
    };
  }, [
    tenantsLoading,
    dateRangeLoading,
    userLoading,
    JSON.stringify(assignedTenants.map((t) => t.id)),
    typeof selectedTenantIds === 'string' ? selectedTenantIds : JSON.stringify(selectedTenantIds),
    dateRange[0]?.getTime(),
    dateRange[1]?.getTime(),
    userData?.timezone,
  ]);

  // Left flow canvas (sized to the flow area only, right of the sources list)
  useEffect(() => {
    const canvas = flowCanvasRef.current;
    const parent = containerRef.current?.querySelector('.sec-dash-flow-wrap');
    if (!canvas || !parent) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const ctxNonNull = ctx;
    const canvasEl = canvas;

    const resize = () => {
      const rect = parent.getBoundingClientRect();
      canvasEl.width = rect.width;
      canvasEl.height = rect.height;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(parent);

    const flowColor = isDark ? THEME.grayHex : FLOW_LINE_LIGHT;
    let animId: number;
    let W = canvasEl.width;
    let H = canvasEl.height;
    const sourceCount = 10;
    const particles: { sy: number; t: number; speed: number; size: number }[] = [];
    for (let i = 0; i < 100; i++) {
      particles.push({
        sy: 0,
        t: Math.random(),
        speed: 0.0022 + Math.random() * 0.0018,
        size: 2 + Math.random(),
      });
    }

    function bez(t: number, p0: { x: number; y: number }, p1: { x: number; y: number }, p2: { x: number; y: number }, p3: { x: number; y: number }) {
      const m = 1 - t;
      return {
        x: m * m * m * p0.x + 3 * m * m * t * p1.x + 3 * m * t * t * p2.x + t * t * t * p3.x,
        y: m * m * m * p0.y + 3 * m * m * t * p1.y + 3 * m * t * t * p2.y + t * t * t * p3.y,
      };
    }

    function drawPath(
      p0: { x: number; y: number },
      p1: { x: number; y: number },
      p2: { x: number; y: number },
      p3: { x: number; y: number },
      color: string,
      w: number
    ) {
      const g = ctxNonNull.createLinearGradient(p0.x, p0.y, p3.x, p3.y);
      g.addColorStop(0, color + '50');
      g.addColorStop(1, color + '25');
      ctxNonNull.beginPath();
      ctxNonNull.moveTo(p0.x, p0.y);
      ctxNonNull.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
      ctxNonNull.strokeStyle = g;
      ctxNonNull.lineWidth = w;
      ctxNonNull.stroke();
    }

    function draw() {
      W = canvasEl.width;
      H = canvasEl.height;
      const cy = H * 0.5;
      const issuesEnd = { x: W, y: cy };
      const srcs = Array.from({ length: sourceCount }, (_, i) => H * 0.05 + i * (H * 0.9 / (sourceCount - 1)));

      ctxNonNull.clearRect(0, 0, W, H);
      srcs.forEach((sy) => {
        const src = { x: 0, y: sy };
        const c1 = { x: W * 0.25, y: sy };
        const c2 = { x: W * 0.7, y: cy };
        drawPath(src, c1, c2, issuesEnd, flowColor, 6);
      });

      particles.forEach((p) => {
        if (p.sy === 0) p.sy = srcs[Math.floor(Math.random() * srcs.length)];
        p.t += p.speed;
        if (p.t > 1) {
          p.sy = srcs[Math.floor(Math.random() * srcs.length)];
          p.t = 0;
        }
        const src = { x: 0, y: p.sy };
        const c1 = { x: W * 0.25, y: p.sy };
        const c2 = { x: W * 0.7, y: cy };
        const pos = bez(p.t, src, c1, c2, issuesEnd);
        ctxNonNull.beginPath();
        ctxNonNull.arc(pos.x, pos.y, p.size, 0, Math.PI * 2);
        ctxNonNull.fillStyle = flowColor + 'cc';
        ctxNonNull.fill();
      });
      animId = requestAnimationFrame(draw);
    }
    draw();
    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, [isDark]);

  // Orb canvas
  useEffect(() => {
    const canvas = orbCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const ctxNonNull = ctx;
    const cx = 80;
    const cy = 80;
    let angle = 0;
    let orbAnimId: number;
    const rings = [
      { r: 62, count: 28, color: THEME.infoHex, speed: 0.4, dotSize: 2.2 },
      { r: 48, count: 20, color: THEME.infoHex, speed: -0.6, dotSize: 2.2 },
      { r: 32, count: 11, color: THEME.dangerHex, speed: 0.8, dotSize: 1.3 },
      { r: 20, count: 8, color: THEME.orangeHex, speed: -1, dotSize: 1.2 },
      { r: 10, count: 6, color: THEME.infoHex, speed: 1.2, dotSize: 1 },
    ];

    function draw() {
      ctxNonNull.clearRect(0, 0, 160, 160);
      const g = ctxNonNull.createRadialGradient(cx, cy, 0, cx, cy, 70);
      g.addColorStop(0, THEME.infoHex + '18');
      g.addColorStop(1, 'transparent');
      ctxNonNull.beginPath();
      ctxNonNull.arc(cx, cy, 70, 0, Math.PI * 2);
      ctxNonNull.fillStyle = g;
      ctxNonNull.fill();

      rings.forEach((ring) => {
        ctxNonNull.beginPath();
        ctxNonNull.arc(cx, cy, ring.r, 0, Math.PI * 2);
        ctxNonNull.strokeStyle = ring.color + '30';
        ctxNonNull.lineWidth = 0.5;
        ctxNonNull.stroke();
        for (let i = 0; i < ring.count; i++) {
          const a = angle * ring.speed + (Math.PI * 2 / ring.count) * i;
          const x = cx + ring.r * Math.cos(a);
          const y = cy + ring.r * Math.sin(a);
          ctxNonNull.beginPath();
          ctxNonNull.arc(x, y, ring.dotSize, 0, Math.PI * 2);
          ctxNonNull.fillStyle = ring.color + 'cc';
          ctxNonNull.fill();
        }
      });
      angle += 0.012;
      orbAnimId = requestAnimationFrame(draw);
    }
    orbAnimId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(orbAnimId);
  }, []);

  // Right case flow canvas
  useEffect(() => {
    const canvas = caseCanvasRef.current;
    const parent = containerRef.current?.querySelector('.sec-dash-right');
    if (!canvas || !parent) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const ctxNonNull = ctx;
    const canvasEl = canvas;

    const resize = () => {
      const rect = parent.getBoundingClientRect();
      canvasEl.width = rect.width;
      canvasEl.height = rect.height;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(parent);

    let W = canvasEl.width;
    let H = canvasEl.height;
    const particles: { t: number; speed: number; toAuto: boolean; toOpenFromAuto: boolean; toResolvedFromManual: boolean; size: number }[] = [];
    for (let i = 0; i < 50; i++) {
      const toAuto = i < 36;
      particles.push({
        t: Math.random(),
        speed: 0.0018 + Math.random() * 0.0012,
        toAuto,
        toOpenFromAuto: toAuto && i % 4 === 0,
        toResolvedFromManual: !toAuto && (i - 36) % 4 === 0,
        size: 2 + Math.random(),
      });
    }

    function bez(t: number, p0: { x: number; y: number }, p1: { x: number; y: number }, p2: { x: number; y: number }, p3: { x: number; y: number }) {
      const m = 1 - t;
      return {
        x: m * m * m * p0.x + 3 * m * m * t * p1.x + 3 * m * t * t * p2.x + t * t * t * p3.x,
        y: m * m * m * p0.y + 3 * m * m * t * p1.y + 3 * m * t * t * p2.y + t * t * t * p3.y,
      };
    }

    function drawPath(
      p0: { x: number; y: number },
      p1: { x: number; y: number },
      p2: { x: number; y: number },
      p3: { x: number; y: number },
      color: string,
      w: number
    ) {
      const g = ctxNonNull.createLinearGradient(p0.x, p0.y, p3.x, p3.y);
      g.addColorStop(0, color + '50');
      g.addColorStop(1, color + '25');
      ctxNonNull.beginPath();
      ctxNonNull.moveTo(p0.x, p0.y);
      ctxNonNull.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
      ctxNonNull.strokeStyle = g;
      ctxNonNull.lineWidth = w;
      ctxNonNull.stroke();
    }

    const flowGray = isDark ? THEME.grayHex : FLOW_LINE_LIGHT;
    let animId: number;
    function draw() {
      W = canvasEl.width;
      H = canvasEl.height;
      const src = { x: W * 0.04, y: H * 0.5 };
      const autoN = { x: W * 0.3, y: H * 0.24 };
      const manN = { x: W * 0.3, y: H * 0.72 };
      const resolvedEnd = { x: W, y: H * 0.24 };
      const openEnd = { x: W, y: H * 0.72 };

      ctxNonNull.clearRect(0, 0, W, H);
      drawPath(src, { x: src.x + 60, y: src.y }, { x: autoN.x - 60, y: autoN.y }, autoN, THEME.primaryHex, 20);
      drawPath(src, { x: src.x + 60, y: src.y }, { x: manN.x - 60, y: manN.y }, manN, flowGray, 8);
      drawPath(autoN, { x: autoN.x + 60, y: autoN.y }, { x: resolvedEnd.x - 60, y: resolvedEnd.y }, resolvedEnd, THEME.primaryHex, 18);
      drawPath(manN, { x: manN.x + 60, y: manN.y }, { x: openEnd.x - 60, y: openEnd.y }, openEnd, flowGray, 6);
      // Automated → Open Investigations: gentle S-bend (larger radius), with moving particles
      const autoToOpenC1 = { x: W * 0.48, y: H * 0.20 };
      const autoToOpenC2 = { x: W * 0.56, y: H * 0.78 };
      drawPath(autoN, autoToOpenC1, autoToOpenC2, openEnd, THEME.primaryHex, 6);
      // Manual → Auto Resolved: gentle S-bend (larger radius), manual color style
      const manToResolvedC1 = { x: W * 0.48, y: H * 0.80 };
      const manToResolvedC2 = { x: W * 0.56, y: H * 0.22 };
      drawPath(manN, manToResolvedC1, manToResolvedC2, resolvedEnd, flowGray, 6);

      particles.forEach((p) => {
        p.t += p.speed;
        if (p.t > 1) p.t = 0;
        let pos: { x: number; y: number };
        if (p.t < 0.5) {
          pos =
            p.toAuto
              ? bez(p.t * 2, src, { x: src.x + 60, y: src.y }, { x: autoN.x - 60, y: autoN.y }, autoN)
              : bez(p.t * 2, src, { x: src.x + 60, y: src.y }, { x: manN.x - 60, y: manN.y }, manN);
        } else {
          if (p.toAuto && p.toOpenFromAuto) {
            pos = bez((p.t - 0.5) * 2, autoN, autoToOpenC1, autoToOpenC2, openEnd);
          } else if (p.toAuto) {
            pos = bez((p.t - 0.5) * 2, autoN, { x: autoN.x + 60, y: autoN.y }, { x: resolvedEnd.x - 60, y: resolvedEnd.y }, resolvedEnd);
          } else if (p.toResolvedFromManual) {
            pos = bez((p.t - 0.5) * 2, manN, manToResolvedC1, manToResolvedC2, resolvedEnd);
          } else {
            pos = bez((p.t - 0.5) * 2, manN, { x: manN.x + 60, y: manN.y }, { x: openEnd.x - 60, y: openEnd.y }, openEnd);
          }
        }
        ctxNonNull.beginPath();
        ctxNonNull.arc(pos.x, pos.y, p.size, 0, Math.PI * 2);
        ctxNonNull.fillStyle = (p.toAuto ? THEME.primaryHex : flowGray) + 'cc';
        ctxNonNull.fill();
      });
      animId = requestAnimationFrame(draw);
    }
    draw();
    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, [isDark]);

  return (
    <div ref={containerRef} className="sec-dash-dashboard">
      <style>{`
        .sec-dash-dashboard {
          width: 100%;
          max-width: none;
          min-height: calc(100vh - 8rem);
          height: 100%;
          background: #ffffff !important;
          border: none !important;
          border-radius: 0;
          display: grid;
          grid-template-columns: 1fr 0.65fr 1fr;
          grid-template-rows: auto 1fr;
          overflow: hidden;
          position: relative;
          color-scheme: light;
          padding-inline-start: 0.75rem;
        }
        [data-theme-mode="dark"] .sec-dash-dashboard {
          background: var(--custom-white) !important;
          color-scheme: dark;
        }
        .sec-dash-dashboard .sec-dash-title {
          grid-column: 1 / -1;
          margin: 0;
          padding: 0.75rem 1rem;
          font-family: var(--default-font-family, "Poppins", sans-serif);
          font-size: 1.125rem;
          font-weight: 500;
          color: #191919 !important;
          flex-shrink: 0;
        }
        [data-theme-mode="dark"] .sec-dash-dashboard .sec-dash-title {
          color: #e8f4f8 !important;
        }
        .sec-dash-left {
          display: flex;
          flex-direction: row;
          overflow: hidden;
          min-width: 0;
        }
        .sec-dash-sources {
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          justify-content: space-around;
          padding: 16px 12px 16px 16px;
          min-width: 188px;
        }
        .sec-dash-flow-wrap {
          flex: 1;
          position: relative;
          min-width: 0;
        }
        .sec-dash-flow-wrap canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          -webkit-mask-image: linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%);
          mask-image: linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%);
          mask-size: 100% 100%;
          mask-repeat: no-repeat;
        }
        .sec-dash-source-row {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 14px;
          color: #5c708f !important;
        }
        [data-theme-mode="dark"] .sec-dash-source-row {
          color: #90a4ae !important;
        }
        .sec-dash-source-row .sec-dash-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          border: 1px solid currentColor;
          margin-left: auto;
          margin-right: 4px;
          flex-shrink: 0;
        }
        .sec-dash-source-row .sec-dash-dot-manual {
          color: #7987a1 !important;
        }
        [data-theme-mode="dark"] .sec-dash-source-row .sec-dash-dot-manual {
          color: #9ba5b8 !important;
        }
        .sec-dash-source-row .sec-dash-source-icon {
          font-size: 14px;
          color: #5c708f !important;
          flex-shrink: 0;
        }
        [data-theme-mode="dark"] .sec-dash-source-row .sec-dash-source-icon {
          color: #90a4ae !important;
        }
        .sec-dash-source-row .sec-dash-source-logo {
          width: 20px;
          height: 20px;
          object-fit: contain;
          flex-shrink: 0;
        }
        .sec-dash-source-row .sec-dash-source-logo-only {
          width: 90px;
          height: 20px;
          object-fit: contain;
          flex-shrink: 0;
        }
        .sec-dash-center {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          padding: 0 0.25rem 0 0.75rem;
          z-index: 5;
        }
        .sec-dash-center-block {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          min-width: 100px;
        }
        .sec-dash-center-block.sec-dash-issues { align-items: flex-end; }
        .sec-dash-center-block.sec-dash-cases { align-items: flex-start; }
        .sec-dash-big-num {
          font-size: 42px;
          font-weight: 200;
          color: #191919 !important;
          letter-spacing: -2px;
          line-height: 1;
        }
        [data-theme-mode="dark"] .sec-dash-big-num {
          color: #e8f4f8 !important;
        }
        .sec-dash-label {
          color: #383853 !important;
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        [data-theme-mode="dark"] .sec-dash-label {
          color: #fff !important;
        }
        .sec-dash-right {
          position: relative;
        }
        .sec-dash-right canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          -webkit-mask-image: linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%);
          mask-image: linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%);
          mask-size: 100% 100%;
          mask-repeat: no-repeat;
        }
        .sec-dash-overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 2;
        }
        .sec-dash-node {
          position: absolute;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
        }
        .sec-dash-node-auto {
          width: 34px;
          height: 34px;
          background: linear-gradient(135deg, rgba(121, 97, 245, 0.5), #7961f5) !important;
          border: 2px solid #7961f5 !important;
          box-shadow: 0 0 16px rgba(121, 97, 245, 0.4);
          top: 24%;
          left: 30%;
          transform: translate(-50%, -50%);
        }
        .sec-dash-node-manual {
          width: 30px;
          height: 30px;
          background: transparent !important;
          border: 1.5px solid #64748b !important;
          color: #334155 !important;
          filter: none;
          top: 72%;
          left: 30%;
          transform: translate(-50%, -50%);
        }
        [data-theme-mode="dark"] .sec-dash-node-manual {
          border: 1.5px solid #9ba5b8 !important;
          color: #fff !important;
          filter: brightness(0) invert(1);
        }
        .sec-dash-stat {
          position: absolute;
        }
        .sec-dash-stat .sec-dash-n {
          font-size: 30px;
          font-weight: 200;
          color: #191919 !important;
          line-height: 1;
        }
        [data-theme-mode="dark"] .sec-dash-stat .sec-dash-n {
          color: #e8f4f8 !important;
        }
        .sec-dash-stat .sec-dash-l {
          font-size: 13px;
          color: #383853 !important;
        }
        [data-theme-mode="dark"] .sec-dash-stat .sec-dash-l {
          color: #fff !important;
        }
        .sec-dash-open-rows {
          display: flex;
          flex-direction: column;
          gap: 3px;
          margin-bottom: 5px;
        }
        .sec-dash-open-row {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 15px;
        }
        .sec-dash-sev-danger { color: #fa4b42 !important; }
        .sec-dash-sev-warning { color: #fab632 !important; }
        .sec-dash-sev-info { color: #28c8eb !important; }
      `}</style>

      <h2 className="sec-dash-title">Investigations Overview</h2>

      <div className="sec-dash-left">
        <div className="sec-dash-sources">
          {sources.map((s, i) => (
            <div key={i} className="sec-dash-source-row">
              {s.iconImage ? (
                <img src={s.iconImage} alt="" className="sec-dash-source-logo-only" />
              ) : (
                <>
                  {s.iconClass && <i className={`${s.iconClass} sec-dash-source-icon`} />}
                  <span>{s.name}</span>
                </>
              )}
              <span className="sec-dash-dot sec-dash-dot-manual" />
            </div>
          ))}
        </div>
        <div className="sec-dash-flow-wrap">
          <canvas ref={flowCanvasRef} />
        </div>
      </div>

      <div className="sec-dash-center">
        <div className="sec-dash-center-block sec-dash-issues">
          <div className="sec-dash-big-num">{caseCount.toLocaleString()}</div>
          <div className="sec-dash-label">Alerts</div>
        </div>
        <canvas ref={orbCanvasRef} width={160} height={160} />
        <div className="sec-dash-center-block sec-dash-cases">
          <div className="sec-dash-big-num">{caseCount.toLocaleString()}</div>
          <div className="sec-dash-label">Investigations</div>
        </div>
      </div>

      <div className="sec-dash-right">
        <canvas ref={caseCanvasRef} />
        <div className="sec-dash-overlay">
          <div className="sec-dash-node sec-dash-node-auto">⚙️</div>
          <div className="sec-dash-node sec-dash-node-manual">👤</div>
          <div className="sec-dash-stat" style={{ top: '10%', left: '30%', transform: 'translate(-50%, 0)', textAlign: 'center' }}>
            <div className="sec-dash-n">{automatedInvestigations.toLocaleString()}</div>
            <div className="sec-dash-l">Automated</div>
          </div>
          <div className="sec-dash-stat" style={{ top: '78%', left: '30%', transform: 'translate(-50%, 0)', textAlign: 'center' }}>
            <div className="sec-dash-n">{manualInvestigations.toLocaleString()}</div>
            <div className="sec-dash-l">Manual</div>
          </div>
          <div className="sec-dash-stat" style={{ top: '12%', right: '8%', textAlign: 'right' }}>
            <div className="sec-dash-n">{resolvedInvestigations.toLocaleString()}</div>
            <div className="sec-dash-l">Resolved Investigations</div>
          </div>
          <div className="sec-dash-stat" style={{ top: '52%', right: '8%', textAlign: 'right' }}>
            <div className="sec-dash-open-rows">
              {openBySeverity.map((row, i) => (
                <div
                  key={i}
                  className={`sec-dash-open-row sec-dash-sev-${row.themeKey}`}
                  style={{ justifyContent: 'flex-end' }}
                >
                  ▲ {row.count}
                </div>
              ))}
            </div>
            <div className="sec-dash-n">{openInvestigations.toLocaleString()}</div>
            <div className="sec-dash-l">Open Investigations</div>
          </div>
        </div>
      </div>
    </div>
  );
}
