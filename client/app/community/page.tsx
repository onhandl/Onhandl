import { PublicNav } from '@/components/public-nav';
import { CommunityFeed } from './CommunityFeed';

const API = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '') + '/api';

async function fetchJson(path: string) {
  try {
    const res = await fetch(`${API}${path}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export default async function CommunityPage() {
  const [posts, cmsSettings] = await Promise.all([
    fetchJson('/blog'),
    fetchJson('/blog/settings'),
  ]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicNav />

      <main className="max-w-6xl mx-auto px-6 pt-28 pb-16 space-y-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Community</h1>
          <p className="text-muted-foreground">Official announcements and stories from the FlawLess community.</p>
        </div>

        <CommunityFeed
          initialPosts={posts ?? []}
          cmsFrozen={cmsSettings?.cmsFrozen ?? false}
          cmsReason={cmsSettings?.reason}
        />
      </main>
    </div>
  );
}
