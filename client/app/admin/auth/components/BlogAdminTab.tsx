'use client';
import { useState } from 'react';
import { adminApi } from '@/api';
import { Trash2, Snowflake, Play, FileText } from 'lucide-react';
import { Button } from '@/components/ui/buttons/button';

interface Post {
  _id: string;
  title: string;
  authorName: string;
  tags: string[];
  status: string;
  createdAt: string;
}

interface CmsSettings {
  cmsFrozen: boolean;
  reason?: string;
}

export function BlogAdminTab({
  posts: initial,
  cmsSettings: initialSettings,
}: {
  posts: Post[];
  cmsSettings: CmsSettings;
}) {
  const [posts, setPosts] = useState(initial);
  const [cms, setCms] = useState(initialSettings);
  const [freezeReason, setFreezeReason] = useState(initialSettings.reason ?? '');
  const [loading, setLoading] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);

  const deletePost = async (id: string) => {
    if (!confirm('Delete this blog post permanently?')) return;
    setLoading(id);
    await adminApi.deleteBlogPost(id);
    setPosts(p => p.filter(x => x._id !== id));
    setLoading(null);
  };

  const toggleFreeze = async () => {
    setToggling(true);
    const data = await adminApi.toggleCmsFreeze({ frozen: !cms.cmsFrozen, reason: freezeReason });
    setCms({ cmsFrozen: data.cmsFrozen, reason: data.reason });
    setCms({ cmsFrozen: data.cmsFrozen, reason: data.reason });
    setToggling(false);
  };

  return (
    <div className="space-y-6">
      {/* CMS Freeze control */}
      <div className={`rounded-lg border p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between ${cms.cmsFrozen ? 'border-blue-500/40 bg-blue-500/5' : 'border-border/60'
        }`}>
        <div className="flex items-center gap-3">
          <Snowflake className={`w-5 h-5 ${cms.cmsFrozen ? 'text-blue-400' : 'text-muted-foreground'}`} />
          <div>
            <p className="font-medium text-sm text-foreground">
              CMS is currently <span className={cms.cmsFrozen ? 'text-blue-400' : 'text-emerald-400'}>
                {cms.cmsFrozen ? 'frozen' : 'active'}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              {cms.cmsFrozen ? 'Users cannot publish new posts.' : 'Users can publish posts freely.'}
            </p>
            {cms.cmsFrozen && cms.reason && (
              <p className="text-xs text-blue-400 mt-0.5">Reason: {cms.reason}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {!cms.cmsFrozen && (
            <input
              value={freezeReason}
              onChange={e => setFreezeReason(e.target.value)}
              placeholder="Reason for freeze..."
              className="flex-1 sm:w-48 bg-background border border-border/60 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-primary"
            />
          )}
          <Button
            size="sm"
            variant={cms.cmsFrozen ? 'outline' : 'default'}
            disabled={toggling}
            onClick={toggleFreeze}
            className="shrink-0"
          >
            {cms.cmsFrozen ? <><Play className="w-3.5 h-3.5 mr-1.5" />Unfreeze</> : <><Snowflake className="w-3.5 h-3.5 mr-1.5" />Freeze CMS</>}
          </Button>
        </div>
      </div>

      {/* Posts table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 text-left text-muted-foreground">
              <th className="pb-3 pr-4 font-medium">Title</th>
              <th className="pb-3 pr-4 font-medium">Author</th>
              <th className="pb-3 pr-4 font-medium">Tags</th>
              <th className="pb-3 pr-4 font-medium">Date</th>
              <th className="pb-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {posts.map(p => (
              <tr key={p._id} className="hover:bg-accent/20 transition-colors">
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="font-medium text-foreground line-clamp-1">{p.title}</span>
                  </div>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">{p.authorName}</td>
                <td className="py-3 pr-4">
                  <div className="flex flex-wrap gap-1">
                    {p.tags.slice(0, 3).map(t => (
                      <span key={t} className="text-xs bg-accent/60 px-1.5 py-0.5 rounded">{t}</span>
                    ))}
                  </div>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</td>
                <td className="py-3">
                  <Button
                    size="sm" variant="ghost"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    disabled={loading === p._id}
                    onClick={() => deletePost(p._id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {posts.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">No blog posts yet.</p>}
      </div>
    </div>
  );
}
