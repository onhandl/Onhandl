'use client';

import { useState, useEffect } from 'react';
import { authApi } from '@/api/auth.api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui';
import { Button } from '@/components/ui/buttons/button';
import { Input } from '@/components/ui/forms/input';
import { Label } from '@/components/ui/forms/label';
import { OtpInput } from '@/components/ui/forms/otp-input';
import { Switch } from '@/components/ui/selection/switch';
import { Loader2, CheckCircle2, MessageCircle, Link, XCircle, ExternalLink, Bell, Edit3 } from 'lucide-react';
import { toast } from 'sonner';

export function TelegramSection() {
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<any>(null);
    const [permissions, setPermissions] = useState<{ notifications: boolean; write: boolean }>({ notifications: false, write: false });
    const [otp, setOtp] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [updatingPerms, setUpdatingPerms] = useState(false);

    const fetchStatus = async () => {
        setLoading(true);
        try {
            const statusData = await authApi.getTelegramStatus();
            setStatus(statusData);
            setPermissions(statusData?.permissions || { notifications: false, write: false });
        } catch (err) {
            console.error('Failed to load telegram status', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
    }, []);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!otp || otp.length !== 6) {
            toast.error('Please enter a valid 6-digit code');
            return;
        }

        setVerifying(true);
        try {
            await authApi.verifyTelegram(otp);
            toast.success('Telegram linked successfully!');
            setOtp('');
            fetchStatus();
        } catch (err: any) {
            toast.error(err.message || 'Verification failed');
        } finally {
            setVerifying(false);
        }
    };

    const handleUnlink = async () => {
        try {
            await authApi.unlinkTelegram();
            toast.success('Telegram unlinked');
            fetchStatus();
        } catch (err: any) {
            toast.error(err.message || 'Failed to unlink');
        }
    };

    const handlePermissionToggle = async (key: 'notifications' | 'write', value: boolean) => {
        setUpdatingPerms(true);
        try {
            const newPerms = { ...permissions, [key]: value };
            await authApi.updateTelegramPermissions(newPerms);
            setPermissions(newPerms);
            toast.success(`${key.charAt(0).toUpperCase() + key.slice(1)} permission updated`);
        } catch (err: any) {
            toast.error('Failed to update permissions');
        } finally {
            setUpdatingPerms(false);
        }
    };

    if (loading) {
        return (
            <Card className="border-border shadow-sm">
                <CardContent className="h-40 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </CardContent>
            </Card>
        );
    }

    // Treat accounts with placeholder usernames or missing dates as unlinked for safety
    const isGenuinelyLinked = status?.linked && status?.username && status?.linkedAt;

    if (isGenuinelyLinked) {
        return (
            <Card className="border-border shadow-sm">
                <CardHeader className="border-b border-border/50 bg-muted/5">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <MessageCircle className="h-4 w-4 text-primary" /> Telegram Integration
                    </CardTitle>
                    <CardDescription>Your account is successfully linked to Telegram.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/5 border border-primary/10">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <CheckCircle2 className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-foreground">Linked as @{status.username}</p>
                            <p className="text-xs text-muted-foreground">
                                Connected on {new Date(status.linkedAt).toLocaleDateString()}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-foreground px-1">Permissions</h4>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-4 rounded-xl border border-border/60 hover:bg-muted/30 transition-colors">
                                <div className="flex gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                                        <Bell className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Notifications</p>
                                        <p className="text-xs text-muted-foreground">Receive agent alerts and updates</p>
                                    </div>
                                </div>
                                <Switch
                                    checked={permissions.notifications}
                                    onCheckedChange={(val) => handlePermissionToggle('notifications', val)}
                                    disabled={updatingPerms}
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-xl border border-border/60 hover:bg-muted/30 transition-colors">
                                <div className="flex gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                                        <Edit3 className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Write Access</p>
                                        <p className="text-xs text-muted-foreground">Allow bot to perform agent actions</p>
                                    </div>
                                </div>
                                <Switch
                                    checked={permissions.write}
                                    onCheckedChange={(val) => handlePermissionToggle('write', val)}
                                    disabled={updatingPerms}
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end border-t border-border/50 pt-5 bg-muted/5">
                    <Button variant="outline" size="sm" onClick={handleUnlink} className="text-destructive hover:bg-destructive/10">
                        <XCircle className="w-4 h-4 mr-2" /> Unlink Account
                    </Button>
                </CardFooter>
            </Card>
        );
    }

    return (
        <Card className="border-border shadow-sm">
            <CardHeader className="border-b border-border/50 bg-muted/5">
                <CardTitle className="flex items-center gap-2 text-base">
                    <MessageCircle className="h-4 w-4 text-primary" /> Telegram Integration
                </CardTitle>
                <CardDescription>Link your Telegram account to receive real-time notifications and manage your agents.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
                <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                        <h4 className="text-sm font-bold mb-2 flex items-center gap-2">
                            Follow these steps to obtain a code:
                        </h4>
                        <ol className="text-xs text-muted-foreground space-y-2 list-decimal list-inside">
                            <li>Open Telegram and search for <span className="text-primary font-medium">@onhandlbot</span></li>
                            <li>Start a conversation or send <code className="bg-muted px-1 rounded">/login</code></li>
                            <li>Copy the <span className="font-bold">6-digit verification code</span> sent by the bot</li>
                        </ol>
                        <div className="mt-4">
                            <Button variant="secondary" size="sm" className="w-full text-xs" asChild>
                                <a href="https://t.me/onhandlbot" target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="w-3 h-3 mr-2" /> Open @onhandlbot
                                </a>
                            </Button>
                        </div>
                    </div>

                    <form onSubmit={handleVerify} className="space-y-6">
                        <div className="space-y-4">
                            <Label htmlFor="otp" className="text-xs font-bold uppercase tracking-widest text-muted-foreground block text-center">
                                Verification Code
                            </Label>
                            <OtpInput
                                value={otp}
                                onChange={setOtp}
                                disabled={verifying}
                                className="justify-center"
                            />
                            <Button
                                type="submit"
                                disabled={verifying || otp.length < 6}
                                className="w-full h-12 rounded-2xl bg-primary text-white font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20 mt-4"
                            >
                                {verifying ? (
                                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...</>
                                ) : (
                                    <><Link className="w-4 h-4 mr-2" /> Link Account</>
                                )}
                            </Button>
                        </div>
                    </form>

                    <div className="pt-6 border-t border-border/50 space-y-4">
                        <h4 className="text-sm font-semibold text-foreground px-1 opacity-50">Permissions (Available after linking)</h4>
                        <div className="space-y-3 opacity-50 pointer-events-none">
                            <div className="flex items-center justify-between p-4 rounded-xl border border-border/60">
                                <div className="flex gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                                        <Bell className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Notifications</p>
                                    </div>
                                </div>
                                <Switch checked={false} disabled={true} />
                            </div>
                            <div className="flex items-center justify-between p-4 rounded-xl border border-border/60">
                                <div className="flex gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                                        <Edit3 className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Write Access</p>
                                    </div>
                                </div>
                                <Switch checked={false} disabled={true} />
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
