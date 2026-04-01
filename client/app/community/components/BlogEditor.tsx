'use client';
import { useState } from 'react';
import { X, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/buttons/button';
import { apiFetch } from '@/lib/api-client';

interface Props {
  onPublished: (post: any) => void;
  cmsFrozen: boolean;
}

export function BlogEditor({ onPublished, cmsFrozen }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
    setTagInput('');
  };

  const removeTag = (t: string) => setTags(prev => prev.filter(x => x !== t));

  const handleSubmit = async () => {
    if (!title.trim() || !body.trim()) { setError('Title and body are required.'); return; }
    setSaving(true); setError('');
    try {
      const data = await apiFetch('/blog', {
        method: 'POST',
        body: JSON.stringify({ title, body, tags }),
      });
      onPublished(data);
      setTitle(''); setBody(''); setTags([]); setOpen(false);
    } catch (err: any) {
      setError(err.message ?? 'Failed to publish');
    } finally { setSaving(false); }
  };

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} disabled={cmsFrozen} size="sm" className="gap-2">
        <Plus className="w-4 h-4" />
        {cmsFrozen ? 'CMS Frozen' : 'New Post'}
      </Button>
    );
  }

  return (
    <div className="bg-card border border-border/60 rounded-xl p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-foreground">New Blog Post</h2>
        <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {error && <p className="text-sm text-destructive bg-destructive/10 rounded px-3 py-2">{error}</p>}

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Title</label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Post title..."
          className="w-full bg-background border border-border/60 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Body</label>
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Write your post content here..."
          rows={10}
          className="w-full bg-background border border-border/60 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors resize-y font-mono"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Tags</label>
        <div className="flex gap-2">
          <input
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); } }}
            placeholder="Add tag and press Enter..."
            className="flex-1 bg-background border border-border/60 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
          />
          <Button variant="outline" size="sm" onClick={addTag} type="button">Add</Button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {tags.map(t => (
              <span key={t} className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                {t}
                <button onClick={() => removeTag(t)} className="hover:text-destructive transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-1">
        <Button onClick={handleSubmit} disabled={saving} size="sm">
          {saving && <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />}
          Publish Post
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </div>
  );
}
