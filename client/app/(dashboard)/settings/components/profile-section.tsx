'use client';

import { useRef, useState } from 'react';
import { apiFetch } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Input, Label } from '@/components/ui';
import { Button } from '@/components/ui/buttons/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/overlays/alert-dialog';
import { Loader2, Save, CheckCircle2, User, Mail, Phone, MessageCircle, Camera } from 'lucide-react';

interface Props {
  user: { username: string; email: string; whatsapp: string; telegramUsername: string; avatarUrl: string };
  setUser: (u: any) => void;
}

export function ProfileSection({ user, setUser }: Props) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await apiFetch('/auth/me', { method: 'POST', body: JSON.stringify(user) });
      setSaved(true);
      alert('Profile updated!');
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      alert('Error: ' + (err.message || 'Failed to update profile.'));
    } finally {
      setSaving(false);
    }
  };

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'ml_default');
    const res = await fetch('https://api.cloudinary.com/v1_1/ddym5o8na/image/upload', {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Cloudinary upload failed');
    const data = await res.json();
    return data.secure_url as string;
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const cloudUrl = await uploadToCloudinary(file);
      setAvatarPreview(cloudUrl);
      await apiFetch('/auth/me', { method: 'POST', body: JSON.stringify({ avatarUrl: cloudUrl }) });
      setUser({ ...user, avatarUrl: cloudUrl });
      alert('Profile picture updated!');
    } catch (err: any) {
      setAvatarPreview(null);
      alert('Upload failed: ' + (err.message || 'Could not save picture.'));
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const confirmRemoveAvatar = async () => {
    setAvatarUploading(true);
    try {
      await apiFetch('/auth/me', { method: 'POST', body: JSON.stringify({ avatarUrl: '' }) });
      setUser({ ...user, avatarUrl: '' });
      setAvatarPreview(null);
      alert('Profile picture removed.');
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setAvatarUploading(false);
    }
  };

  const currentAvatar = avatarPreview || user.avatarUrl;

  const FIELDS = [
    { id: 'username', label: 'Username', icon: User, type: 'text', key: 'username', placeholder: 'Your username' },
    { id: 'email', label: 'Email Address', icon: Mail, type: 'email', key: 'email', placeholder: 'your@email.com' },
    { id: 'whatsapp', label: 'WhatsApp Number', icon: Phone, type: 'text', key: 'whatsapp', placeholder: '+1234567890' },
    { id: 'telegram', label: 'Telegram Username', icon: MessageCircle, type: 'text', key: 'telegramUsername', placeholder: 'username' },
  ] as const;

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="border-b border-border/50 bg-muted/5">
        <CardTitle className="flex items-center gap-2 text-base"><User className="h-4 w-4 text-primary" /> User Profile</CardTitle>
        <CardDescription>Update your profile picture, contact information and public identifiers.</CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">

        {/* Avatar */}
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-muted border-2 border-border overflow-hidden flex items-center justify-center flex-shrink-0">
            {currentAvatar
              ? <img src={currentAvatar} alt="Avatar" className="w-full h-full object-cover" />
              : <User className="w-8 h-8 text-muted-foreground" />}
          </div>

          <div className="space-y-1.5">
            <p className="text-sm font-medium">Profile Picture</p>
            <p className="text-xs text-muted-foreground">JPG, PNG, GIF or WebP</p>
            <div className="flex items-center gap-2 mt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs h-8"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
              >
                {avatarUploading
                  ? <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> Uploading…</>
                  : <><Camera className="w-3 h-3 mr-1.5" /> Change photo</>}
              </Button>

              {currentAvatar && !avatarUploading && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="ghost" size="sm" className="text-xs h-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                      Remove photo
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove profile picture?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Your current profile picture will be removed. You can always upload a new one later.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={confirmRemoveAvatar}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Yes, remove it
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>

        {/* Profile fields */}
        <form id="profile-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {FIELDS.map(({ id, label, icon: Icon, type, key, placeholder }) => (
            <div key={id} className="space-y-2">
              <Label htmlFor={id} className="font-medium text-sm">{label}</Label>
              <div className="relative">
                <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id={id} type={type} value={(user as any)[key]}
                  onChange={(e) => setUser({ ...user, [key]: e.target.value })}
                  placeholder={placeholder} className="pl-9" />
              </div>
            </div>
          ))}
        </form>
      </CardContent>
      <CardFooter className="flex justify-end border-t border-border/50 pt-5 bg-muted/5">
        <Button type="submit" form="profile-form" disabled={saving} className="rounded-full px-8">
          {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</>
            : saved ? <><CheckCircle2 className="mr-2 h-4 w-4" /> Saved!</>
              : <><Save className="mr-2 h-4 w-4" /> Save Profile</>}
        </Button>
      </CardFooter>
    </Card>
  );
}
