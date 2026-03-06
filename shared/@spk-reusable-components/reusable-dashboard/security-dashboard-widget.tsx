"use client";

import React, { useEffect, useRef, useState } from 'react';

// Theme-aligned colors (match app CSS variables: primary, info, success, danger, warning)
const THEME = {
  primary: 'rgb(121, 97, 245)',
  primaryHex: '#7961f5',
  info: 'rgb(40, 200, 235)',
  infoHex: '#28c8eb',
  success: 'rgb(133, 204, 65)',
  danger: 'rgb(250, 75, 66)',
  dangerHex: '#fa4b42',
  warning: 'rgb(250, 182, 50)',
  warningHex: '#fab632',
  orange: 'rgb(255, 129, 0)',
  orangeHex: '#ff8100',
  successHex: '#85cc41',
  gray: 'rgb(121, 114, 142)',
  grayHex: '#7987a1',
};

const SOURCES = [
  { label: '19.2K', icon: '🖥', name: 'Endpoints', themeKey: 'primary' as const },
  { badge: 'NG', name: 'NGFW', themeKey: 'danger' as const },
  { badge: 'G', name: 'Google Cloud', themeKey: 'info' as const },
  { badge: 'AW', name: 'Amazon AWS', themeKey: 'warning' as const },
  { badge: 'Az', name: 'Azure', themeKey: 'info' as const },
  { badge: 'O3', name: 'Office 365', themeKey: 'orange' as const },
  { badge: 'PP', name: 'Proofpoint', themeKey: 'info' as const },
  { badge: 'Ok', name: 'Okta', themeKey: 'info' as const },
  { badge: 'AP', name: 'Apache', themeKey: 'danger' as const },
  { badge: 'PC', name: 'Prisma Cloud', themeKey: 'teal' as const },
];

const OPEN_BY_SEVERITY = [
  { themeKey: 'danger' as const, count: 3 },
  { themeKey: 'danger' as const, count: 2 },
  { themeKey: 'warning' as const, count: 5 },
  { themeKey: 'info' as const, count: 0 },
];

export default function SecurityDashboardWidget() {
  const flowCanvasRef = useRef<HTMLCanvasElement>(null);
  const orbCanvasRef = useRef<HTMLCanvasElement>(null);
  const caseCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [issueCount, setIssueCount] = useState(0);
  const [caseCount, setCaseCount] = useState(0);

  // Count-up animation
  useEffect(() => {
    const issueTarget = 2404;
    const caseTarget = 1024;
    const issueDur = 1600;
    const caseDur = 1200;
    let start: number | null = null;
    function step(ts: number) {
      if (!start) start = ts;
      const p = Math.min((ts - start) / issueDur, 1);
      setIssueCount(Math.floor(p * issueTarget));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);

    start = null;
    function stepCase(ts: number) {
      if (!start) start = ts;
      const p = Math.min((ts - start) / caseDur, 1);
      setCaseCount(Math.floor(p * caseTarget));
      if (p < 1) requestAnimationFrame(stepCase);
    }
    setTimeout(() => requestAnimationFrame(stepCase), 200);
  }, []);

  // Left flow canvas (sized to the flow area only, right of the sources list)
  useEffect(() => {
    const canvas = flowCanvasRef.current;
    const parent = containerRef.current?.querySelector('.sec-dash-flow-wrap');
    if (!canvas || !parent) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const cvs = canvas;
    const ctx2 = ctx;

    const resize = () => {
      const rect = parent.getBoundingClientRect();
      cvs.width = rect.width;
      cvs.height = rect.height;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(parent);

    const flowColor = THEME.grayHex;
    let animId: number;
    let W = cvs.width;
    let H = cvs.height;
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
      const g = ctx2.createLinearGradient(p0.x, p0.y, p3.x, p3.y);
      g.addColorStop(0, color + '50');
      g.addColorStop(1, color + '25');
      ctx2.beginPath();
      ctx2.moveTo(p0.x, p0.y);
      ctx2.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
      ctx2.strokeStyle = g;
      ctx2.lineWidth = w;
      ctx2.stroke();
    }

    function draw() {
      W = cvs.width;
      H = cvs.height;
      const cy = H * 0.5;
      const issuesEnd = { x: W, y: cy };
      const srcs = Array.from({ length: sourceCount }, (_, i) => H * 0.05 + i * (H * 0.9 / (sourceCount - 1)));

      ctx2.clearRect(0, 0, W, H);
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
        ctx2.beginPath();
        ctx2.arc(pos.x, pos.y, p.size, 0, Math.PI * 2);
        ctx2.fillStyle = flowColor + 'cc';
        ctx2.fill();
      });
      animId = requestAnimationFrame(draw);
    }
    draw();
    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, []);

  // Orb canvas
  useEffect(() => {
    const canvas = orbCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const cvs = canvas;
    const ctx2 = ctx;
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
      ctx2.clearRect(0, 0, 160, 160);
      const g = ctx2.createRadialGradient(cx, cy, 0, cx, cy, 70);
      g.addColorStop(0, THEME.infoHex + '18');
      g.addColorStop(1, 'transparent');
      ctx2.beginPath();
      ctx2.arc(cx, cy, 70, 0, Math.PI * 2);
      ctx2.fillStyle = g;
      ctx2.fill();

      rings.forEach((ring) => {
        const dotSize = 'dotSize' in ring ? ring.dotSize : 2.2;
        ctx2.beginPath();
        ctx2.arc(cx, cy, ring.r, 0, Math.PI * 2);
        ctx2.strokeStyle = ring.color + '30';
        ctx2.lineWidth = 0.5;
        ctx2.stroke();
        for (let i = 0; i < ring.count; i++) {
          const a = angle * ring.speed + (Math.PI * 2 / ring.count) * i;
          const x = cx + ring.r * Math.cos(a);
          const y = cy + ring.r * Math.sin(a);
          ctx2.beginPath();
          ctx2.arc(x, y, dotSize, 0, Math.PI * 2);
          ctx2.fillStyle = ring.color + 'cc';
          ctx2.fill();
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
    const cvs = canvas;
    const ctx2 = ctx;

    const resize = () => {
      const rect = parent.getBoundingClientRect();
      cvs.width = rect.width;
      cvs.height = rect.height;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(parent);

    let W = cvs.width;
    let H = cvs.height;
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
      const g = ctx2.createLinearGradient(p0.x, p0.y, p3.x, p3.y);
      g.addColorStop(0, color + '50');
      g.addColorStop(1, color + '25');
      ctx2.beginPath();
      ctx2.moveTo(p0.x, p0.y);
      ctx2.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
      ctx2.strokeStyle = g;
      ctx2.lineWidth = w;
      ctx2.stroke();
    }

    let animId: number;
    function draw() {
      W = cvs.width;
      H = cvs.height;
      const src = { x: W * 0.04, y: H * 0.5 };
      const autoN = { x: W * 0.3, y: H * 0.24 };
      const manN = { x: W * 0.3, y: H * 0.72 };
      const resolvedEnd = { x: W, y: H * 0.24 };
      const openEnd = { x: W, y: H * 0.72 };

      ctx2.clearRect(0, 0, W, H);
      drawPath(src, { x: src.x + 60, y: src.y }, { x: autoN.x - 60, y: autoN.y }, autoN, THEME.primaryHex, 20);
      drawPath(src, { x: src.x + 60, y: src.y }, { x: manN.x - 60, y: manN.y }, manN, THEME.grayHex, 8);
      drawPath(autoN, { x: autoN.x + 60, y: autoN.y }, { x: resolvedEnd.x - 60, y: resolvedEnd.y }, resolvedEnd, THEME.primaryHex, 18);
      drawPath(manN, { x: manN.x + 60, y: manN.y }, { x: openEnd.x - 60, y: openEnd.y }, openEnd, THEME.grayHex, 6);
      // Automated → Open Investigations: gentle S-bend (larger radius), with moving particles
      const autoToOpenC1 = { x: W * 0.48, y: H * 0.20 };
      const autoToOpenC2 = { x: W * 0.56, y: H * 0.78 };
      drawPath(autoN, autoToOpenC1, autoToOpenC2, openEnd, THEME.primaryHex, 6);
      // Manual → Auto Resolved: gentle S-bend (larger radius), manual color style
      const manToResolvedC1 = { x: W * 0.48, y: H * 0.80 };
      const manToResolvedC2 = { x: W * 0.56, y: H * 0.22 };
      drawPath(manN, manToResolvedC1, manToResolvedC2, resolvedEnd, THEME.grayHex, 6);

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
        ctx2.beginPath();
        ctx2.arc(pos.x, pos.y, p.size, 0, Math.PI * 2);
        ctx2.fillStyle = (p.toAuto ? THEME.primaryHex : THEME.grayHex) + 'cc';
        ctx2.fill();
      });
      animId = requestAnimationFrame(draw);
    }
    draw();
    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className="sec-dash-dashboard">
      <style>{`
        .sec-dash-dashboard {
          width: 100%;
          max-width: none;
          min-height: calc(100vh - 8rem);
          height: 100%;
          background: #0d0c20 !important;
          border: 1px solid rgba(121, 97, 245, 0.35) !important;
          border-radius: 0;
          display: grid;
          grid-template-columns: 1fr 0.65fr 1fr;
          grid-template-rows: auto 1fr;
          overflow: hidden;
          position: relative;
          color-scheme: dark;
          padding-inline-start: 0.75rem;
        }
        .sec-dash-dashboard .sec-dash-title {
          grid-column: 1 / -1;
          margin: 0;
          padding: 0.75rem 1rem;
          font-family: var(--default-font-family, "Poppins", sans-serif);
          font-size: 1.125rem;
          font-weight: 500;
          color: #e8f4f8 !important;
          flex-shrink: 0;
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
          font-size: 13px;
          color: #90a4ae !important;
        }
        .sec-dash-source-row .sec-dash-badge {
          width: 26px;
          height: 17px;
          border-radius: 3px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          font-weight: 700;
          flex-shrink: 0;
        }
        .sec-dash-badge.sec-dash-t-primary { background: rgba(121, 97, 245, 0.2); color: #7961f5 !important; border: 1px solid rgba(121, 97, 245, 0.4); }
        .sec-dash-badge.sec-dash-t-danger { background: rgba(250, 75, 66, 0.2); color: #fa4b42 !important; border: 1px solid rgba(250, 75, 66, 0.4); }
        .sec-dash-badge.sec-dash-t-info { background: rgba(40, 200, 235, 0.2); color: #28c8eb !important; border: 1px solid rgba(40, 200, 235, 0.4); }
        .sec-dash-badge.sec-dash-t-warning { background: rgba(250, 182, 50, 0.2); color: #fab632 !important; border: 1px solid rgba(250, 182, 50, 0.4); }
        .sec-dash-badge.sec-dash-t-orange { background: rgba(255, 129, 0, 0.2); color: #ff8100 !important; border: 1px solid rgba(255, 129, 0, 0.4); }
        .sec-dash-badge.sec-dash-t-teal { background: rgba(0, 216, 216, 0.2); color: #00d8d8 !important; border: 1px solid rgba(0, 216, 216, 0.4); }
        .sec-dash-dot.sec-dash-t-primary { color: #7961f5 !important; }
        .sec-dash-dot.sec-dash-t-danger { color: #fa4b42 !important; }
        .sec-dash-dot.sec-dash-t-info { color: #28c8eb !important; }
        .sec-dash-dot.sec-dash-t-warning { color: #fab632 !important; }
        .sec-dash-dot.sec-dash-t-orange { color: #ff8100 !important; }
        .sec-dash-dot.sec-dash-t-teal { color: #00d8d8 !important; }
        .sec-dash-source-row .sec-dash-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          border: 1px solid currentColor;
          margin-left: auto;
          margin-right: 4px;
          flex-shrink: 0;
        }
        .sec-dash-top-label {
          font-size: 13px;
          font-weight: 700;
          color: #7961f5 !important;
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
          color: #e8f4f8 !important;
          letter-spacing: -2px;
          line-height: 1;
        }
        .sec-dash-label {
          color: #fff !important;
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
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
          border: 1.5px solid #9ba5b8 !important;
          color: #fff !important;
          filter: brightness(0) invert(1);
          top: 72%;
          left: 30%;
          transform: translate(-50%, -50%);
        }
        .sec-dash-stat {
          position: absolute;
        }
        .sec-dash-stat .sec-dash-n {
          font-size: 30px;
          font-weight: 200;
          color: #e8f4f8 !important;
          line-height: 1;
        }
        .sec-dash-stat .sec-dash-l {
          font-size: 13px;
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
          {SOURCES.map((s, i) => (
            <div key={i} className="sec-dash-source-row">
              {'label' in s && <span className="sec-dash-top-label">{s.label}</span>}
              {'badge' in s && (
                <span className={`sec-dash-badge sec-dash-t-${s.themeKey}`}>
                  {s.badge}
                </span>
              )}
              {'icon' in s && <span style={{ fontSize: 10 }}>{s.icon}</span>}
              <span>{s.name}</span>
              <span className={`sec-dash-dot sec-dash-t-${s.themeKey}`} />
            </div>
          ))}
        </div>
        <div className="sec-dash-flow-wrap">
          <canvas ref={flowCanvasRef} />
        </div>
      </div>

      <div className="sec-dash-center">
        <div className="sec-dash-center-block sec-dash-issues">
          <div className="sec-dash-big-num">{issueCount.toLocaleString()}</div>
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
            <div className="sec-dash-n">76</div>
            <div className="sec-dash-l">Automated</div>
          </div>
          <div className="sec-dash-stat" style={{ top: '78%', left: '30%', transform: 'translate(-50%, 0)', textAlign: 'center' }}>
            <div className="sec-dash-n">16</div>
            <div className="sec-dash-l">Manual</div>
          </div>
          <div className="sec-dash-stat" style={{ top: '12%', right: '8%', textAlign: 'right' }}>
            <div className="sec-dash-n">82</div>
            <div className="sec-dash-l">Resolved Investigations</div>
          </div>
          <div className="sec-dash-stat" style={{ top: '52%', right: '8%', textAlign: 'right' }}>
            <div className="sec-dash-open-rows">
              {OPEN_BY_SEVERITY.map((row, i) => (
                <div key={i} className={`sec-dash-open-row sec-dash-sev-${row.themeKey}`} style={{ justifyContent: 'flex-end' }}>
                  ▲ {row.count}
                </div>
              ))}
            </div>
            <div className="sec-dash-n">10</div>
            <div className="sec-dash-l">Open Investigations</div>
          </div>
        </div>
      </div>
    </div>
  );
}
