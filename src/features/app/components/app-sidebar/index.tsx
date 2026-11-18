import { FileText } from 'lucide-react'
import { Link, useLocation } from 'react-router'

import { BrandMark } from '@shared/components/brand'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@shared/components/ui/sidebar'
import { NavUser } from '@features/app/components/nav-user'

const NAVIGATION = [{ title: 'Propostas', to: '/', icon: FileText, section: '/propostas' }]

export function AppSidebar() {
  const { pathname } = useLocation()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link to="/" />}>
              <BrandMark className="size-8" />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold tracking-tight">Silver Proposals</span>
                <span className="truncate text-xs text-muted-foreground">Propostas com IA</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Plataforma</SidebarGroupLabel>
          <SidebarMenu>
            {NAVIGATION.map(({ title, to, icon: Icon, section }) => (
              <SidebarMenuItem key={to}>
                <SidebarMenuButton
                  tooltip={title}
                  isActive={pathname === to || pathname.startsWith(section)}
                  render={<Link to={to} />}
                  className="data-active:bg-primary/10 data-active:text-primary data-active:hover:bg-primary/15"
                >
                  <Icon />
                  <span>{title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
