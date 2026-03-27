'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import {
  Home,
  LayoutDashboard,
  Bot,
  Box,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
} from 'lucide-react';
import { Button } from '@/components/ui/buttons/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/overlays/sheet';

const navItems = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Sandbox', href: '/sandbox', icon: Box },
  { name: 'Bot', href: '/bot', icon: Bot },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const Sidebar = () => {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  const SidebarContent = () => (
    <div className={cn('h-full flex flex-col border-r bg-background', collapsed ? 'w-16' : 'w-64')}>
      <div className="flex items-center justify-between p-4 border-b">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <Bot className="h-6 w-6" />
            <span className="font-bold text-xl">Omniflow</span>
          </Link>
        )}
        {collapsed && (
          <Link href="/dashboard">
            <Bot className="h-6 w-6 mx-auto" />
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapse}
          className={cn('hidden md:flex', collapsed && 'mx-auto')}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
      <div className="flex-1 py-4 overflow-y-auto">
        <nav className="space-y-1 px-2">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors',
                pathname === item.href
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-accent hover:text-accent-foreground',
                collapsed && 'justify-center'
              )}
            >
              <item.icon className={cn('h-5 w-5', collapsed ? 'mx-0' : 'mr-3')} />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          ))}
        </nav>
      </div>
      <div className="p-4 border-t">
        <Button
          variant="ghost"
          className={cn(
            'w-full flex items-center hover:text-destructive hover:bg-destructive/10 transition-colors',
            collapsed ? 'justify-center' : 'justify-start px-3'
          )}
          onClick={async () => {
            console.log('Initiating logout...');
            try {
              const res = await apiFetch('/auth/logout', { method: 'POST' });
              console.log('Logout API successful:', res);

              // Small delay to ensure the browser processes the Set-Cookie clear header
              setTimeout(() => {
                window.location.replace('/signin');
              }, 100);
            } catch (err) {
              console.error('Logout API failed:', err);
              // Fallback to direct redirect - if cookie is still there, middleware will bounce back
              window.location.replace('/signin');
            }
          }}
        >
          <LogOut className={cn('h-5 w-5', !collapsed && 'mr-3')} />
          {!collapsed && <span>Logout</span>}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="absolute top-4 left-4 z-50">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};

export default Sidebar;
