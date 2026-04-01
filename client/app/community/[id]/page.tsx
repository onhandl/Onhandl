import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Calendar, User, ArrowLeft, Tag, Zap } from 'lucide-react';
import { Navigation } from '@/components/landing/navigation';

const API = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '') + '/api';

async function getPost(id: string) {
  try {
    const res = await fetch(`${API}/blog/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export default async function CommunityPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) notFound();

  const isOfficial = post.postType === 'official';

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      <main className="max-w-3xl mx-auto px-6 pt-28 pb-16">
        <Link
          href="/community"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Community
        </Link>

        {isOfficial && (
          <div className="flex items-center gap-1.5 mb-4">
            <div className="flex items-center gap-1 bg-primary/10 text-primary text-xs font-semibold px-2.5 py-1 rounded-full">
              <Zap className="w-3 h-3 fill-primary" />
              FlawLess Official
            </div>
          </div>
        )}

        {post.tags?.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <Tag className="w-3.5 h-3.5 text-muted-foreground" />
            {post.tags.map((t: string) => (
              <span key={t} className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">{t}</span>
            ))}
          </div>
        )}

        <h1 className="text-3xl font-bold tracking-tight text-foreground leading-tight mb-4">
          {post.title}
        </h1>

        <div className="flex items-center gap-5 text-sm text-muted-foreground pb-8 border-b border-border/60 mb-8">
          <span className="flex items-center gap-1.5"><User className="w-4 h-4" />{post.authorName}</span>
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            {new Date(post.createdAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>

        <div className="space-y-4">
          {post.body.split('\n').map((para: string, i: number) =>
            para.trim() ? (
              <p key={i} className="text-foreground/90 leading-relaxed">{para}</p>
            ) : (
              <br key={i} />
            )
          )}
        </div>

        <div className="mt-12 pt-8 border-t border-border/60">
          <Link href="/community" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Community
          </Link>
        </div>
      </main>
    </div>
  );
}
