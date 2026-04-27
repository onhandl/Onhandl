'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { authApi } from '@/api';
import { cn } from '@/lib/utils';
import {
  Home, LayoutDashboard, Box, Settings,
  ChevronLeft, ChevronRight,
  LogOut, Menu, User, Headphones, Shield,
  Building, Check, ChevronsUpDown, PlusCircle, LayoutGrid
} from 'lucide-react';
import { Button } from '@/components/ui/buttons/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/overlays/sheet';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/menus/dropdown-menu";

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Assets', href: '/dashboard/assets', icon: Box },
  { name: 'Support', href: '/support', icon: Headphones },
  { name: 'Settings', href: '/settings', icon: Settings },
];

function Avatar({ url, name, className }: { url?: string | null; name?: string | null; className?: string }) {
  return (
    <div className={cn('rounded-full bg-muted border border-border/60 overflow-hidden flex items-center justify-center flex-shrink-0', className)}>
      {url
        ? <img src={url} alt={name || 'avatar'} className="w-full h-full object-cover" />
        : <User className="w-[40%] h-[40%] text-muted-foreground" />}
    </div>
  );
}

const SidebarContent = ({
  collapsed, toggleCollapse, avatarUrl, userName, isAdmin,
}: {
  collapsed: boolean;
  toggleCollapse: () => void;
  avatarUrl?: string | null;
  userName?: string | null;
  isAdmin?: boolean;
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const { workspaces, activeWorkspace, setActiveWorkspaceId } = useWorkspace();

  return (
    <div className={cn(
      'h-full flex flex-col bg-background border-r border-border/60 transition-all duration-300 ease-in-out overflow-hidden',
      collapsed ? 'w-[60px]' : 'w-[220px]'
    )}>
      {/* Workspace Selector */}
      <div className={cn('px-2 py-2', collapsed && 'flex justify-center')}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={cn(
              "flex items-center gap-2 rounded-lg hover:bg-accent/40 transition-all duration-200 group text-left",
              collapsed ? "w-9 h-9 justify-center" : "w-full p-2"
            )}>
              <div className="w-8 h-8 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <Building className="w-4 h-4 text-primary" />
              </div>
              {!collapsed && (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground truncate uppercase tracking-wider">
                      {activeWorkspace?.name || 'My Studio'}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate uppercase tracking-widest font-medium">Workspace</p>
                  </div>
                  <ChevronsUpDown className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 rounded-xl border-border/40 p-1.5 shadow-2xl backdrop-blur-xl">
            <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2 py-1.5">
              Workspaces
            </DropdownMenuLabel>
            {workspaces.map((ws) => (
              <DropdownMenuItem
                key={ws._id}
                onClick={() => setActiveWorkspaceId(ws._id)}
                className="flex items-center justify-between rounded-lg px-2 py-2 text-sm font-medium focus:bg-primary/10 focus:text-primary cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded bg-muted flex items-center justify-center text-[10px] font-bold group-focus:bg-primary/20">
                    {ws.name.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="truncate max-w-[120px]">{ws.name}</span>
                </div>
                {activeWorkspace?._id === ws._id && <Check className="w-3.5 h-3.5" />}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator className="bg-border/40" />
            <DropdownMenuItem className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm font-medium focus:bg-primary/10 focus:text-primary cursor-pointer">
              <PlusCircle className="w-4 h-4" />
              <span>Create Workspace</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className={cn(
        'flex items-center border-b border-border/60 h-14 px-3 gap-3',
        collapsed ? 'justify-center focus:outline-none' : 'justify-between'
      )}>
        <Link href="/settings" className="flex items-center gap-2.5 min-w-0 overflow-hidden flex-1">
          <Avatar url={avatarUrl} name={userName} className="w-8 h-8 flex-shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="font-semibold text-sm tracking-tight whitespace-nowrap overflow-hidden truncate"
              >
                {userName || 'My Profile'}
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
        {!collapsed && (
          <button
            onClick={toggleCollapse}
            className="hidden md:flex w-6 h-6 rounded-md items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors shrink-0"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 overflow-y-auto space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group relative flex items-center rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer',
                collapsed ? 'h-9 w-9 justify-center mx-auto' : 'h-9 px-3 gap-3',
                isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-accent/40'
              )}
              title={collapsed ? item.name : undefined}
            >
              {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full" />}
              <item.icon className="w-[17px] h-[17px] shrink-0" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.15 }}
                    className="truncate overflow-hidden whitespace-nowrap"
                  >
                    {item.name}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}

        {/* Logout */}
        <button
          className={cn(
            'flex items-center rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-all duration-150 cursor-pointer',
            collapsed ? 'h-9 w-9 justify-center mx-auto' : 'h-9 px-3 gap-3 w-full'
          )}
          title={collapsed ? 'Logout' : undefined}
          onClick={async () => {
            try { await authApi.logout(); } finally { router.replace('/signin'); }
          }}
        >
          <LogOut className="w-[17px] h-[17px] shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15 }}
                className="whitespace-nowrap overflow-hidden"
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </nav>

      {/* Bottom */}
      <div className="border-t border-border/60 p-2 space-y-0.5">
        {isAdmin && (
          <Link
            href="/admin/auth"
            className={cn(
              'group relative flex items-center rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer',
              collapsed ? 'h-9 w-9 justify-center mx-auto' : 'h-9 px-3 gap-3',
              pathname.startsWith('/admin')
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/40'
            )}
            title={collapsed ? 'Admin' : undefined}
          >
            {pathname.startsWith('/admin') && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full" />
            )}
            <Shield className="w-[17px] h-[17px] shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.15 }}
                  className="truncate overflow-hidden whitespace-nowrap"
                >
                  Admin
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        )}
        {collapsed && (
          <button
            onClick={toggleCollapse}
            className="w-9 h-9 mx-auto flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors"
            aria-label="Expand sidebar"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    authApi.getMe()
      .then((data: any) => {
        setAvatarUrl(data.avatarUrl || null);
        setUserName(data.name || data.username || null);
        setIsAdmin(data.role === 'admin');
      })
      .catch(() => {/* unauthenticated */ });
  }, []);

  const sharedProps = { avatarUrl, userName, isAdmin };

  return (
    <>
      <div className="hidden md:block">
        <SidebarContent collapsed={collapsed} toggleCollapse={() => setCollapsed(!collapsed)} {...sharedProps} />
      </div>

      <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-12 bg-background border-b border-border/60 flex items-center px-3 gap-2">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="w-8 h-8 flex-shrink-0">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[220px]">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SheetDescription className="sr-only">Site navigation menu</SheetDescription>
            <SidebarContent collapsed={false} toggleCollapse={() => { }} {...sharedProps} />
          </SheetContent>
        </Sheet>

        <Link href="/settings" className="flex items-center gap-2 min-w-0">
          <Avatar url={avatarUrl} name={userName} className="w-7 h-7" />
          <span className="font-semibold text-sm text-foreground truncate">
            {userName || 'Onhandl'}
          </span>
        </Link>
      </div>
    </>
  );
};

export default Sidebar;
