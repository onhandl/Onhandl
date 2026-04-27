'use client';
import { useState } from 'react';
import { adminApi } from '@/api';
import { Trash2, Shield, ShieldOff, User } from 'lucide-react';
import { Button } from '@/components/ui/buttons/button';

interface UserRow {
  _id: string;
  email?: string;
  username?: string;
  name?: string;
  plan: string;
  isAdmin: boolean;
  tokens: number;
  createdAt: string;
}

export function UsersTab({ users: initial }: { users: UserRow[] }) {
  const [users, setUsers] = useState(initial);
  const [loading, setLoading] = useState<string | null>(null);

  const deleteUser = async (id: string) => {
    if (!confirm('Delete this user permanently?')) return;
    setLoading(id);
    await adminApi.deleteUser(id);
    setUsers(u => u.filter(x => x._id !== id));
    setLoading(null);
  };

  const toggleAdmin = async (user: UserRow) => {
    setLoading(user._id);
    const data = await adminApi.toggleAdminStatus(user._id, !user.isAdmin);
    setUsers(u => u.map(x => x._id === user._id ? { ...x, isAdmin: data.isAdmin } : x));
    setLoading(null);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/60 text-left text-muted-foreground">
            <th className="pb-3 pr-4 font-medium">User</th>
            <th className="pb-3 pr-4 font-medium">Plan</th>
            <th className="pb-3 pr-4 font-medium">Tokens</th>
            <th className="pb-3 pr-4 font-medium">Joined</th>
            <th className="pb-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {users.map(u => (
            <tr key={u._id} className="hover:bg-accent/20 transition-colors">
              <td className="py-3 pr-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{u.name ?? u.username ?? '—'}</p>
                    <p className="text-xs text-muted-foreground">{u.email ?? '—'}</p>
                  </div>
                  {u.isAdmin && (
                    <span className="text-xs bg-primary/15 text-primary px-1.5 py-0.5 rounded font-medium">Admin</span>
                  )}
                </div>
              </td>
              <td className="py-3 pr-4">
                <span className="capitalize text-xs bg-accent/60 px-2 py-1 rounded">{u.plan}</span>
              </td>
              <td className="py-3 pr-4 text-muted-foreground">{u.tokens.toLocaleString()}</td>
              <td className="py-3 pr-4 text-muted-foreground">
                {new Date(u.createdAt).toLocaleDateString()}
              </td>
              <td className="py-3">
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm" variant="ghost"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                    disabled={loading === u._id}
                    onClick={() => toggleAdmin(u)}
                    title={u.isAdmin ? 'Remove admin' : 'Make admin'}
                  >
                    {u.isAdmin ? <ShieldOff className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                  </Button>
                  <Button
                    size="sm" variant="ghost"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    disabled={loading === u._id}
                    onClick={() => deleteUser(u._id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {users.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">No users found.</p>}
    </div>
  );
}
