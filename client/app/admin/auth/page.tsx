import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AdminDashboard } from './AdminDashboard';

const API = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '') + '/api';

async function fetchJson(path: string, cookieHeader: string) {
  try {
    const res = await fetch(`${API}${path}`, {
      headers: { Cookie: cookieHeader },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export default async function AdminAuthPage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  // Verify admin access
  const me = await fetchJson('/auth/me', cookieHeader);
  if (!me || !me.isAdmin) redirect('/dashboard');

  const [users, agents, drafts, executions, tickets, allPosts, cmsSettings] =
    await Promise.all([
      fetchJson('/admin/users', cookieHeader),
      fetchJson('/admin/agents', cookieHeader),
      fetchJson('/admin/drafts', cookieHeader),
      fetchJson('/admin/executions', cookieHeader),
      fetchJson('/admin/support-tickets', cookieHeader),
      fetchJson('/admin/blog', cookieHeader),
      fetchJson('/blog/settings', cookieHeader),
    ]);

  return (
    <AdminDashboard
      users={users ?? []}
      agents={agents ?? []}
      drafts={drafts ?? []}
      executions={executions?.runs ?? []}
      tickets={tickets ?? []}
      allPosts={allPosts ?? []}
      cmsSettings={cmsSettings ?? { cmsFrozen: false }}
    />
  );
}
