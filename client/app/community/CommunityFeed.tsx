'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Snowflake, Zap, Users, Plus } from 'lucide-react';
import { BlogCard } from './components/BlogCard';

const API = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '') + '/api';

interface Post {
  _id: string; title: string; body: string;
  tags: string[]; authorName: string; authorId: string;
  postType: 'official' | 'community'; createdAt: string;
}

type Filter = 'all' | 'official' | 'community';

interface Props {
  initialPosts: Post[];
  cmsFrozen: boolean;
  cmsReason?: string;
}

export function CommunityFeed({ initialPosts, cmsFrozen, cmsReason }: Props) {
  const [posts, setPosts] = useState(initialPosts);
  const [filter, setFilter] = useState<Filter>('all');

  // Client-side auth — avoids server cookie forwarding issues on public routes
  const [me, setMe] = useState<{ id: string; isAdmin: boolean } | null | undefined>(undefined);

  useEffect(() => {
    fetch(`${API}/auth/me`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => setMe(data ? { id: data._id ?? data.id ?? '', isAdmin: data.isAdmin ?? false } : null))
      .catch(() => setMe(null));
  }, []);

  const isAuthenticated = !!me;
  const isAdmin = me?.isAdmin ?? false;
  const currentUserId = me?.id ?? '';

  const handleDelete = (id: string) => setPosts(prev => prev.filter(p => p._id !== id));
  // Posts without postType (created before schema update) default to 'community'
  const resolvedType = (p: Post) => p.postType ?? 'community';
  const displayed = filter === 'all' ? posts : posts.filter(p => resolvedType(p) === filter);

  const tabs: { id: Filter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'official', label: 'Onhandl Official' },
    { id: 'community', label: 'Community' },
  ];

  // Show nothing in the action area while checking auth
  const authResolved = me !== undefined;

  return (
    <div className="space-y-6">
      {cmsFrozen && (
        <div className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/30 rounded-xl px-4 py-3">
          <Snowflake className="w-4 h-4 text-blue-400 shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-300">New posts are temporarily paused</p>
            {cmsReason && <p className="text-xs text-blue-400/80 mt-0.5">{cmsReason}</p>}
          </div>
        </div>
      )}

      {/* Tabs + Create button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-accent/30 rounded-lg p-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === t.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              {t.id === 'official' && <Zap className="w-3 h-3 text-primary fill-primary" />}
              {t.id === 'community' && <Users className="w-3 h-3" />}
              {t.label}
              <span className="ml-0.5 text-xs opacity-50">
                ({t.id === 'all' ? posts.length : posts.filter(p => resolvedType(p) === t.id).length})
              </span>
            </button>
          ))}
        </div>

        {authResolved && (
          isAuthenticated && (!cmsFrozen || isAdmin) ? (
            <Link
              href="/community/new"
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
            >
              <Plus className="w-4 h-4" />
              Create Post
            </Link>
          ) : !isAuthenticated ? (
            <Link
              href="/signin"
              className="flex items-center gap-2 px-4 py-2 border border-border/60 text-sm font-medium rounded-xl hover:bg-accent/40 transition-colors"
            >
              Sign in to post
            </Link>
          ) : null
        )}
      </div>

      {displayed.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border/60 rounded-xl">
          <p className="text-sm text-muted-foreground">No posts here yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {displayed.map(post => (
            <BlogCard
              key={post._id}
              post={post}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
