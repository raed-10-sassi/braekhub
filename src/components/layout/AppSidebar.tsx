import {
  LayoutDashboard,
  Grid3X3,
  Users,
  Clock,
  CreditCard,
  Receipt,
  LogOut,
  CircleDot,
  Settings,
  Coffee,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const mainNavItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Tables", url: "/tables", icon: Grid3X3 },
  { title: "Customers", url: "/customers", icon: Users },
  { title: "Consumptions", url: "/consumptions", icon: Coffee },
];

const financeNavItems = [
  { title: "Payments", url: "/payments", icon: CreditCard },
  { title: "Credits", url: "/credits", icon: Receipt },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { signOut, user, userRole } = useAuth();
  const collapsed = state === "collapsed";

  const isActive = (path: string) => location.pathname === path;

  const NavItem = ({ item }: { item: (typeof mainNavItems)[0] }) => (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <NavLink
          to={item.url}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
            isActive(item.url)
              ? "bg-sidebar-primary text-sidebar-primary-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          )}
        >
          <item.icon className="h-5 w-5 shrink-0" />
          {!collapsed && <span className="font-medium">{item.title}</span>}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-sidebar-primary flex items-center justify-center shrink-0">
            <CircleDot className="h-6 w-6 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="font-bold text-sidebar-foreground truncate">Break'hub Pro</h1>
              <p className="text-xs text-sidebar-foreground/60 capitalize">{userRole || "Staff"}</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-sidebar-foreground/50">Main</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <NavItem key={item.title} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-sidebar-foreground/50">Finance</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {financeNavItems.map((item) => (
                <NavItem key={item.title} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        {!collapsed && user && (
          <div className="mb-3 px-2">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{user.email}</p>
          </div>
        )}
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={signOut}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span>Sign Out</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
