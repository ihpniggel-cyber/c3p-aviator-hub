import { BookOpen, LayoutDashboard, User, GraduationCap, FileText, Plane } from "lucide-react";
import { NavLink } from "@/components/NavLink";
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

const mainNav = [
  { title: "Tableau de bord", url: "/", icon: LayoutDashboard },
  { title: "Bibliothèque", url: "/library", icon: BookOpen },
  { title: "Quiz & Tests", url: "/quizzes", icon: GraduationCap },
  { title: "Mon Profil", url: "/profile", icon: User },
  { title: "Atterrissage 04", url: "/atterrissage", icon: Plane },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { user, signOut } = useAuth();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-gold flex items-center justify-center shadow-gold shrink-0">
            <Plane className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <span className="font-display text-lg text-foreground leading-none">C3P</span>
              <span className="block text-[10px] text-muted-foreground uppercase tracking-[3px]">Formation</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground text-[10px] uppercase tracking-[2px]">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="hover:bg-accent/50"
                      activeClassName="bg-accent text-accent-foreground font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        {!collapsed && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground truncate">
              {user?.email}
            </p>
            <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={signOut}>
              Déconnexion
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
