'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, useToast } from '@/components/ui';
import { MessageCircle } from 'lucide-react';

interface NotifState { telegram: boolean; dailySummaries: boolean; email: boolean }

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
    return (
        <button
            onClick={() => onChange(!value)}
            className={`w-11 h-6 rounded-full relative transition-colors duration-200 cursor-pointer ${value ? 'bg-primary' : 'bg-muted'}`}
            role="switch"
            aria-checked={value}
        >
            <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${value ? 'translate-x-5' : ''}`} />
        </button>
    );
}

export function NotificationsCard() {
    const [notif, setNotif] = useState<NotifState>({ telegram: false, dailySummaries: false, email: true });
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        apiFetch('/auth/notifications').then(setNotif).catch(() => {});
    }, []);

    const update = async (patch: Partial<NotifState>) => {
        const next = { ...notif, ...patch };
        setNotif(next);
        setSaving(true);
        try {
            await apiFetch('/auth/notifications', { method: 'PUT', body: JSON.stringify(patch) });
        } catch {
            toast({ title: 'Failed to save notification settings', variant: 'destructive' });
            setNotif(notif); // revert
        } finally {
            setSaving(false);
        }
    };

    const ITEMS = [
        { key: 'telegram'       as const, label: 'Telegram Alerts',     desc: 'Get instant trade execution notifications.' },
        { key: 'dailySummaries' as const, label: 'Daily Summaries',     desc: 'Receive daily performance reports via email.' },
        { key: 'email'          as const, label: 'Email Notifications',  desc: 'Get important platform updates via email.' },
    ];

    return (
        <Card className="border-border shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="border-b border-border/50 bg-muted/5">
                <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-primary" />
                    Notifications {saving && <span className="text-xs text-muted-foreground font-normal ml-1">saving…</span>}
                </CardTitle>
                <CardDescription>Configure how you receive alerts and summaries.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-5">
                {ITEMS.map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between p-4 rounded-lg bg-background border border-border/50">
                        <div className="space-y-0.5">
                            <p className="font-medium text-foreground text-sm">{label}</p>
                            <p className="text-xs text-muted-foreground">{desc}</p>
                        </div>
                        <Toggle value={notif[key]} onChange={(v) => update({ [key]: v })} />
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
