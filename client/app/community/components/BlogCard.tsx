'use client';
import Link from 'next/link';
import { Trash2, Calendar, User, Zap } from 'lucide-react';
import { Button } from '@/components/ui/buttons/button';
import { apiFetch } from '@/lib/api-client';

interface Post {
  _id: string;
  title: string;
  body: string;
  tags: string[];
  authorName: string;
  authorId: string;
  postType: 'official' | 'community';
  createdAt: string;
}

interface Props {
  post: Post;
  currentUserId?: string;
  isAdmin?: boolean;
  onDelete: (id: string) => void;
}

export function BlogCard({ post, currentUserId, isAdmin, onDelete }: Props) {
  const canDelete = isAdmin || post.authorId === currentUserId;
  const preview = post.body.slice(0, 200) + (post.body.length > 200 ? '…' : '');
  const isOfficial = (post.postType ?? 'community') === 'official';

  const handleDelete = async () => {
    if (!confirm('Delete this post?')) return;
    const endpoint = isAdmin ? `/admin/blog/${post._id}` : `/blog/${post._id}`;
    await apiFetch(endpoint, { method: 'DELETE' });
    onDelete(post._id);
  };

  return (
    <article className={`bg-card border rounded-xl p-5 hover:border-border transition-colors group ${
      isOfficial ? 'border-primary/30 hover:border-primary/50' : 'border-border/60'
    }`}>
      {/* Official badge */}
      {isOfficial && (
        <div className="flex items-center gap-1.5 mb-3">
          <div className="flex items-center gap-1 bg-primary/10 text-primary text-xs font-semibold px-2 py-0.5 rounded-full">
            <Zap className="w-3 h-3 fill-primary" />
            FlawLess Official
          </div>
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <Link href={`/community/${post._id}`} className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
            {post.title}
          </h3>
        </Link>
        {canDelete && (
          <Button
            size="sm" variant="ghost"
            className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
            onClick={handleDelete}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      <p className="text-sm text-muted-foreground mt-2 line-clamp-3 leading-relaxed">{preview}</p>

      <div className="flex flex-wrap gap-1.5 mt-3">
        {post.tags.map(t => (
          <span key={t} className="text-xs bg-accent/60 text-muted-foreground px-2 py-0.5 rounded-full">{t}</span>
        ))}
      </div>

      <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <User className="w-3 h-3" />
          {post.authorName}
        </span>
        <span className="flex items-center gap-1.5">
          <Calendar className="w-3 h-3" />
          {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      </div>
    </article>
  );
}
