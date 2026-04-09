'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { bubbleApi } from '@/api/bubble-api';
import { GOSSIP_CATALOGS, CATALOG_COLORS } from '@/lib/gossipCatalogs';

// ── Canvas constants ──────────────────────────────────────────────────────────
const W = 620; const H = 540;
const CX = W / 2; const CY = H / 2;
const RING_R  = 185;
const AGENT_R = 31;
const MGR_R   = 42;

// Warm, saturated, non-AI palette
const PALETTE = ['#c4734a', '#4a88b8', '#5a9e6a', '#8f6abf', '#3aabb0', '#c49e3a', '#b85a78'];

const TYPE_COLOR: Record<string, string> = {
    capability_announce: '#6060e0',
    status:              '#22c566',
    offer:               '#e09020',
    task_claim:          '#9040c0',
    result_update:       '#0aabb8',
    task_request:        '#e04040',
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface AgentNode { id: string; name: string; x: number; y: number; color: string; catalog?: string }
interface Packet    { id: string; fromX: number; fromY: number; toX: number; toY: number; color: string }
interface CommArc   { id: string; x1: number; y1: number; x2: number; y2: number; color: string }

// ── Helpers ───────────────────────────────────────────────────────────────────
function ringLayout(agents: any[]): AgentNode[] {
    return agents.map((a, i) => {
        const angle = (2 * Math.PI * i) / Math.max(agents.length, 1) - Math.PI / 2;
        return {
            id: String(a._id), name: a.name,
            x: CX + RING_R * Math.cos(angle),
            y: CY + RING_R * Math.sin(angle),
            color: PALETTE[i % PALETTE.length],
            catalog: a.subscription?.catalog,
        };
    });
}

// Quadratic bezier arc with a natural bend
function arcPath(x1: number, y1: number, x2: number, y2: number, bend = 0.32) {
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const dx = x2 - x1, dy = y2 - y1;
    return `M${x1} ${y1} Q${mx - dy * bend} ${my + dx * bend} ${x2} ${y2}`;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function BubbleNetworkViz({ bubble, isInteracting = false }: { bubble: any; isInteracting?: boolean }) {
    const [nodes,    setNodes]    = useState<AgentNode[]>([]);
    const [packets,  setPackets]  = useState<Packet[]>([]);
    const [arcs,     setArcs]     = useState<CommArc[]>([]);
    const [heat,     setHeat]     = useState<Map<string, number>>(new Map());
    const [mgrTalks, setMgrTalks] = useState(false); // manager is actively communicating
    const [vp,       setVp]       = useState({ x: 0, y: 0, k: 1 });

    const nodesRef  = useRef<AgentNode[]>([]);
    const svgRef    = useRef<SVGSVGElement>(null);
    const dragRef   = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
    const mgrTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
    nodesRef.current = nodes;

    // Load enriched nodes
    useEffect(() => {
        if (!bubble?.agents?.length) return;
        Promise.all(
            bubble.agents.map((a: any) =>
                bubbleApi.getSubscription(String(a._id))
                    .then(sub => ({ ...a, subscription: sub }))
                    .catch(() => ({ ...a, subscription: null }))
            )
        ).then(enriched => setNodes(ringLayout(enriched)));
    }, [bubble]);

    // Handle an incoming gossip message
    const handleMsg = useCallback((msg: any) => {
        const all = nodesRef.current;
        const sender = all.find(n => n.id === String(msg.fromAgentId));
        if (!sender) return;

        const targetIds: string[] = (msg.toAgentIds ?? []).map(String);
        const targets = targetIds.length ? all.filter(n => targetIds.includes(n.id)) : [];
        const color   = TYPE_COLOR[msg.type] ?? '#6060e0';

        // Packets flying from sender → targets (or → manager if broadcast)
        const dests = targets.length ? targets : [{ id: 'mgr', x: CX, y: CY } as any];
        dests.forEach((t: any) => {
            const id = `pk-${msg._id ?? Date.now()}-${t.id}`;
            setPackets(p => [...p.slice(-30), { id, fromX: sender.x, fromY: sender.y, toX: t.x, toY: t.y, color }]);
            setTimeout(() => setPackets(p => p.filter(x => x.id !== id)), 1200);
        });

        // Curved arcs — sender → target(s)
        dests.forEach((t: any) => {
            const id = `arc-${msg._id ?? Date.now()}-${t.id}-${Date.now()}`;
            setArcs(a => [...a.slice(-16), { id, x1: sender.x, y1: sender.y, x2: t.x, y2: t.y, color }]);
            setTimeout(() => setArcs(a => a.filter(x => x.id !== id)), 1800);
        });

        // Manager "talking" glow on any gossip going through it
        setMgrTalks(true);
        if (mgrTimer.current) clearTimeout(mgrTimer.current);
        mgrTimer.current = setTimeout(() => setMgrTalks(false), 2000);

        // Heat ring for task_request recipients
        if (msg.type === 'task_request') {
            const ts = Date.now();
            setHeat(h => {
                const next = new Map(h);
                (targetIds.length ? targetIds : all.map(n => n.id)).forEach(id => next.set(id, ts));
                return next;
            });
        }

        // Return arc to manager on result/claim (feedback)
        if (msg.type === 'result_update' || msg.type === 'task_claim') {
            const id = `fb-${msg._id ?? Date.now()}-${Date.now()}`;
            setArcs(a => [...a.slice(-16), { id, x1: sender.x, y1: sender.y, x2: CX, y2: CY, color: '#e09020' }]);
            setTimeout(() => setArcs(a => a.filter(x => x.id !== id)), 2200);
        }
    }, []);

    // SSE stream
    useEffect(() => {
        if (!bubble?._id || bubble.status !== 'active') return;
        const es = bubbleApi.openStream(bubble._id);
        es.addEventListener('message', e => { try { handleMsg(JSON.parse(e.data)); } catch { /* skip */ } });
        return () => es.close();
    }, [bubble, handleMsg]);

    // Polling fallback — only while user is actively interacting
    useEffect(() => {
        if (!bubble?._id || !isInteracting) return;
        const t = setInterval(async () => {
            try {
                const msgs = await bubbleApi.getMessages(bubble._id, { limit: 3 });
                if (msgs.length) handleMsg(msgs[msgs.length - 1]);
            } catch { /* skip */ }
        }, 4500);
        return () => clearInterval(t);
    }, [bubble, isInteracting, handleMsg]);

    // Expire heat every second
    useEffect(() => {
        const t = setInterval(() => {
            const now = Date.now();
            setHeat(h => { const n = new Map(h); for (const [id, ts] of n) if (now - ts > 5000) n.delete(id); return n; });
        }, 1000);
        return () => clearInterval(t);
    }, []);

    // Non-passive wheel listener for zoom
    useEffect(() => {
        const el = svgRef.current;
        if (!el) return;
        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            const factor = e.deltaY > 0 ? 0.88 : 1.14;
            setVp(v => {
                const newK = Math.max(0.25, Math.min(6, v.k * factor));
                return { x: v.x + CX * (v.k - newK), y: v.y + CY * (v.k - newK), k: newK };
            });
        };
        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
    }, []);

    function onMouseDown(e: React.MouseEvent<SVGSVGElement>) {
        dragRef.current = { sx: e.clientX, sy: e.clientY, ox: vp.x, oy: vp.y };
    }
    function onMouseMove(e: React.MouseEvent<SVGSVGElement>) {
        const drag = dragRef.current;
        if (!drag) return;
        setVp(v => ({ ...v, x: drag.ox + (e.clientX - drag.sx), y: drag.oy + (e.clientY - drag.sy) }));
    }
    function onMouseUp() { dragRef.current = null; }

    const isActive = bubble?.status === 'active';
    const manColor = isActive ? '#c47a3a' : '#8a8070';
    const now      = Date.now();

    return (
        <div className="w-full h-full bg-[#f7f4ef] dark:bg-[#1c1916] rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing select-none relative">
            {/* Hint */}
            <p className="absolute bottom-2 right-3 text-[10px] text-[#b0a090] dark:text-[#60544a] pointer-events-none z-10">
                scroll to zoom · drag to pan
            </p>
            <svg ref={svgRef} width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}
                onMouseDown={onMouseDown} onMouseMove={onMouseMove}
                onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>

                <defs>
                    <filter id="nvShadow">
                        <feDropShadow dx="0" dy="2" stdDeviation="3.5" floodOpacity="0.18" />
                    </filter>
                    <filter id="nvGlow" x="-60%" y="-60%" width="220%" height="220%">
                        <feGaussianBlur stdDeviation="5" result="b" />
                        <feComposite in="SourceGraphic" in2="b" operator="over" />
                    </filter>
                </defs>

                {/* Zoom / pan group */}
                <g transform={`translate(${vp.x},${vp.y}) scale(${vp.k})`}>

                    {/* Warm dot grid background */}
                    {Array.from({ length: 11 }, (_, r) =>
                        Array.from({ length: 14 }, (_, c) => (
                            <circle key={`g-${r}-${c}`} cx={c * 46 + 20} cy={r * 52 + 20} r={1.4}
                                fill="rgba(160,140,110,0.18)" />
                        ))
                    )}

                    {/* Spokes — dashed warm lines */}
                    {nodes.map(n => (
                        <line key={`sp-${n.id}`} x1={CX} y1={CY} x2={n.x} y2={n.y}
                            stroke="rgba(150,128,100,0.22)" strokeWidth={1.4} strokeDasharray="5 6" />
                    ))}

                    {/* Live communication arcs */}
                    <AnimatePresence>
                        {arcs.map(arc => (
                            <motion.path key={arc.id}
                                d={arcPath(arc.x1, arc.y1, arc.x2, arc.y2)}
                                fill="none" stroke={arc.color} strokeWidth={2.2} strokeLinecap="round"
                                strokeDasharray="7 5"
                                initial={{ pathLength: 0, opacity: 1 }}
                                animate={{ pathLength: 1, opacity: 0.75 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.65, ease: 'easeOut' }}
                            />
                        ))}
                    </AnimatePresence>

                    {/* Agent nodes */}
                    {nodes.map(n => {
                        const isHot = heat.has(n.id) && (now - (heat.get(n.id) ?? 0)) < 5000;
                        const catColor = n.catalog ? (CATALOG_COLORS[n.catalog] ?? '#6060e0') : null;
                        return (
                            <g key={n.id}>
                                {/* Heat pulse ring */}
                                {isHot && (
                                    <motion.circle cx={n.x} cy={n.y} r={AGENT_R + 7}
                                        fill="none" stroke="#e04040" strokeWidth={2.5}
                                        animate={{ r: [AGENT_R + 5, AGENT_R + 15, AGENT_R + 5], opacity: [0.85, 0.15, 0.85] }}
                                        transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                                    />
                                )}
                                {/* Catalog ring */}
                                {catColor && (
                                    <circle cx={n.x} cy={n.y} r={AGENT_R + 5}
                                        fill="none" stroke={catColor} strokeWidth={2} opacity={0.55} />
                                )}
                                {/* Solid node */}
                                <circle cx={n.x} cy={n.y} r={AGENT_R}
                                    fill={n.color} stroke="#f7f4ef" strokeWidth={2.5}
                                    filter="url(#nvShadow)" />
                                {/* Agent initial letter */}
                                <text x={n.x} y={n.y - 3} textAnchor="middle"
                                    fill="rgba(255,255,255,0.95)" fontSize={13} fontWeight={800}
                                    style={{ fontFamily: 'system-ui,sans-serif' }}>
                                    {n.name.charAt(0).toUpperCase()}
                                </text>
                                <text x={n.x} y={n.y + 10} textAnchor="middle"
                                    fill="rgba(255,255,255,0.75)" fontSize={7.5} fontWeight={600}
                                    style={{ fontFamily: 'system-ui,sans-serif', letterSpacing: '0.2px' }}>
                                    {n.name.length > 9 ? n.name.slice(0, 8) + '…' : n.name}
                                </text>
                                {/* Catalog label below */}
                                {catColor && n.catalog && (
                                    <text x={n.x} y={n.y + AGENT_R + 14} textAnchor="middle"
                                        fill={catColor} fontSize={8} fontWeight={600}
                                        style={{ fontFamily: 'system-ui,sans-serif' }}>
                                        {GOSSIP_CATALOGS[n.catalog]?.label}
                                    </text>
                                )}
                            </g>
                        );
                    })}

                    {/* Gossip packets */}
                    <AnimatePresence>
                        {packets.map(pk => (
                            <motion.circle key={pk.id} r={7}
                                fill={pk.color} stroke="#fff" strokeWidth={1.5}
                                initial={{ cx: pk.fromX, cy: pk.fromY, scale: 0, opacity: 1 }}
                                animate={{ cx: pk.toX, cy: pk.toY, scale: [0, 1.4, 0.8, 0] }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 1.0, ease: 'easeInOut' }}
                            />
                        ))}
                    </AnimatePresence>

                    {/* Bubble Manager — center — person silhouette */}
                    <g filter="url(#nvShadow)">
                        {/* Outer active pulse */}
                        {isActive && (
                            <motion.circle cx={CX} cy={CY} r={MGR_R + 2}
                                fill="none" stroke={manColor} strokeWidth={1.8} opacity={0.4}
                                animate={{ r: [MGR_R + 2, MGR_R + 12, MGR_R + 2], opacity: [0.45, 0, 0.45] }}
                                transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                            />
                        )}
                        {/* "Talking" glow when communicating */}
                        <AnimatePresence>
                            {mgrTalks && (
                                <motion.circle key="mgrTalk" cx={CX} cy={CY} r={MGR_R + 4}
                                    fill="none" stroke="#e09020" strokeWidth={3}
                                    initial={{ opacity: 0, r: MGR_R + 2 }}
                                    animate={{ opacity: [0.9, 0.4, 0.9], r: MGR_R + 8 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.5, repeat: Infinity }}
                                    filter="url(#nvGlow)"
                                />
                            )}
                        </AnimatePresence>
                        {/* Solid base */}
                        <circle cx={CX} cy={CY} r={MGR_R} fill={manColor} stroke="#f7f4ef" strokeWidth={3} />
                        {/* Tabler-style person (head + body), all white stroke */}
                        <g transform={`translate(${CX - 11},${CY - 14})`}>
                            {/* Head circle */}
                            <circle cx={11} cy={7} r={5} fill="none" stroke="rgba(255,255,255,0.92)" strokeWidth={2.2} strokeLinecap="round" />
                            {/* Shoulders / body arc */}
                            <path d="M2 22 v-2 a6 6 0 0 1 6-6 h6 a6 6 0 0 1 6 6 v2"
                                fill="none" stroke="rgba(255,255,255,0.92)" strokeWidth={2.2}
                                strokeLinecap="round" strokeLinejoin="round" />
                        </g>
                    </g>
                    {/* Manager label */}
                    <text x={CX} y={CY + MGR_R + 15} textAnchor="middle"
                        fill="rgba(140,118,90,0.9)" fontSize={9.5} fontWeight={700}
                        style={{ fontFamily: 'system-ui,sans-serif' }}>
                        Manager
                    </text>
                    <text x={CX} y={CY + MGR_R + 26} textAnchor="middle"
                        fill={isActive ? '#c47a3a' : '#9a8878'} fontSize={8}
                        style={{ fontFamily: 'system-ui,sans-serif' }}>
                        {mgrTalks ? '↔ gossiping…' : isActive ? '● listening' : '○ paused'}
                    </text>

                </g>
            </svg>
        </div>
    );
}
