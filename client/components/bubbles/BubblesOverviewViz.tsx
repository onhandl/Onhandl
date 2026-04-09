'use client';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { CATALOG_COLORS } from '@/lib/gossipCatalogs';

const W = 640; const H = 480;
const PALETTE = ['#6366f1', '#f59e0b', '#10b981', '#8b5cf6', '#06b6d4', '#ef4444', '#3b82f6'];

/** Lay out bubbles in a rough circle-packing arrangement */
function layoutBubbles(bubbles: any[]): { bubble: any; cx: number; cy: number; r: number }[] {
    const n = bubbles.length;
    if (n === 0) return [];

    // Radius proportional to agent count (min 48, max 110)
    const radii = bubbles.map(b => Math.min(110, Math.max(48, 38 + (b.agentIds?.length ?? 0) * 12)));

    if (n === 1) return [{ bubble: bubbles[0], cx: W / 2, cy: H / 2, r: radii[0] }];

    // Arrange in an elliptical ring
    return bubbles.map((b, i) => {
        const angle  = (2 * Math.PI * i) / n - Math.PI / 2;
        const rx     = Math.min(W / 2 - radii[i] - 16, 200);
        const ry     = Math.min(H / 2 - radii[i] - 16, 160);
        return { bubble: b, cx: W / 2 + rx * Math.cos(angle), cy: H / 2 + ry * Math.sin(angle), r: radii[i] };
    });
}

/** Inner agent positions within a bubble circle */
function agentLayout(count: number, cx: number, cy: number, bubbleR: number) {
    const agentR = Math.min(18, (bubbleR - 20) / Math.max(count, 1));
    const ring   = bubbleR * 0.52;
    return Array.from({ length: Math.min(count, 8) }, (_, i) => {
        const a = (2 * Math.PI * i) / Math.max(count, 1);
        return { x: cx + ring * Math.cos(a), y: cy + ring * Math.sin(a), r: agentR };
    });
}

export function BubblesOverviewViz({ bubbles }: { bubbles: any[] }) {
    const router  = useRouter();
    const laid    = layoutBubbles(bubbles);

    return (
        <div className="w-full h-full flex items-center justify-center bg-background/60 rounded-2xl overflow-hidden">
            <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="max-w-full max-h-full">

                {/* Background grid dots */}
                {Array.from({ length: 12 }, (_, row) =>
                    Array.from({ length: 16 }, (_, col) => (
                        <circle key={`${row}-${col}`}
                            cx={col * 44 + 8} cy={row * 44 + 8} r={1}
                            fill="rgba(148,163,184,0.12)" />
                    ))
                )}

                {laid.map(({ bubble, cx, cy, r }, bi) => {
                    const color     = PALETTE[bi % PALETTE.length];
                    const isActive  = bubble.status === 'active';
                    const agents    = agentLayout(bubble.agentIds?.length ?? 0, cx, cy, r);
                    const manColor  = isActive ? '#f59e0b' : '#6b7280';

                    return (
                        <g key={bubble._id} style={{ cursor: 'pointer' }} onClick={() => router.push(`/bubbles/${bubble._id}`)}>
                            {/* Bubble boundary */}
                            <motion.circle cx={cx} cy={cy} r={r}
                                fill={`${color}0a`} stroke={color} strokeWidth={1.5}
                                strokeDasharray={isActive ? '0' : '5 4'}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: bi * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                                whileHover={{ r: r + 4 }}
                            />

                            {/* Pulse ring for active bubbles */}
                            {isActive && (
                                <motion.circle cx={cx} cy={cy} r={r}
                                    fill="none" stroke={color} strokeWidth={0.8} opacity={0.4}
                                    animate={{ r: [r, r + 8, r], opacity: [0.4, 0, 0.4] }}
                                    transition={{ duration: 2.8, repeat: Infinity, delay: bi * 0.3 }}
                                />
                            )}

                            {/* Manager center dot */}
                            <motion.circle cx={cx} cy={cy} r={10}
                                fill={`${manColor}30`} stroke={manColor} strokeWidth={1.5}
                                animate={isActive ? { r: [10, 12, 10] } : {}}
                                transition={{ duration: 2, repeat: Infinity, delay: bi * 0.2 }}
                            />

                            {/* Agent dots in ring */}
                            {agents.map((ag, ai) => (
                                <motion.circle key={ai} cx={ag.x} cy={ag.y} r={ag.r}
                                    fill={`${color}25`} stroke={color} strokeWidth={1}
                                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                                    transition={{ delay: bi * 0.08 + ai * 0.04 }}
                                />
                            ))}

                            {/* Spoke lines from manager to agents */}
                            {agents.map((ag, ai) => (
                                <line key={`sp-${ai}`} x1={cx} y1={cy} x2={ag.x} y2={ag.y}
                                    stroke={color} strokeWidth={0.6} opacity={0.25} />
                            ))}

                            {/* Bubble name label */}
                            <text x={cx} y={cy + r + 14} textAnchor="middle" fill="rgba(148,163,184,0.85)" fontSize={9.5} fontWeight={700}>
                                {bubble.name.length > 16 ? bubble.name.slice(0, 15) + '…' : bubble.name}
                            </text>

                            {/* Agent count badge */}
                            <text x={cx} y={cy + r + 25} textAnchor="middle" fill={color} fontSize={8} opacity={0.7}>
                                {bubble.agentIds?.length ?? 0} agents · {bubble.messageCount ?? 0} msgs
                            </text>
                        </g>
                    );
                })}

                {/* Empty state */}
                {bubbles.length === 0 && (
                    <text x={W / 2} y={H / 2} textAnchor="middle" fill="rgba(148,163,184,0.5)" fontSize={12}>
                        No bubbles yet
                    </text>
                )}
            </svg>
        </div>
    );
}
