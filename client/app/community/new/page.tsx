'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, X, Loader2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/buttons/button';
import { apiFetch } from '@/lib/api-client';
import { Navigation } from '@/components/landing/navigation';

export default function NewPostPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);

  // Redirect unauthenticated users
  useEffect(() => {
    fetch(
      `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '')}/api/auth/me`,
      { credentials: 'include' }
    )
      .then(r => { if (!r.ok) router.replace('/signin'); })
      .catch(() => router.replace('/signin'))
      .finally(() => setChecking(false));
  }, [router]);

  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/,/g, '');
    if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
    setTagInput('');
  };

  const handleSubmit = async () => {
    if (!title.trim()) { setError('Title is required.'); return; }
    if (!body.trim())  { setError('Body is required.'); return; }
    setSaving(true); setError('');
    try {
      const post = await apiFetch('/blog', {
        method: 'POST',
        body: JSON.stringify({ title, body, tags }),
      });
      router.push(`/community/${post._id}`);
    } catch (err: any) {
      setError(err.message ?? 'Failed to publish post');
      setSaving(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      <main className="max-w-3xl mx-auto px-6 pt-28 pb-16 space-y-8">
        {/* Back */}
        <Link
          href="/community"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Community
        </Link>

        {/* Heading */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Post</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Share knowledge, updates or stories with the FlawLess community.
          </p>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Title</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Give your post a compelling title..."
              className="w-full bg-card border border-border/60 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
            />
          </div>

          {/* Body */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Content</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Write your post content here. Use blank lines to separate paragraphs..."
              rows={16}
              className="w-full bg-card border border-border/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors resize-y font-mono placeholder:text-muted-foreground leading-relaxed"
            />
            <p className="text-xs text-muted-foreground">{body.length} characters</p>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Tags</label>
            <div className="flex gap-2">
              <input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); } }}
                placeholder="Type a tag and press Enter..."
                className="flex-1 bg-card border border-border/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
              />
              <Button variant="outline" onClick={addTag} type="button">Add</Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {tags.map(t => (
                  <span key={t} className="flex items-center gap-1.5 text-sm bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
                    {t}
                    <button onClick={() => setTags(prev => prev.filter(x => x !== t))} className="hover:text-destructive transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <Button onClick={handleSubmit} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {saving ? 'Publishing…' : 'Publish Post'}
            </Button>
            <Button variant="ghost" onClick={() => router.push('/community')}>Cancel</Button>
          </div>
        </div>
      </main>
    </div>
  );
}
