import { FileText, House } from 'lucide-react'
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
  useSidebar,
} from '@shared/components/ui/sidebar'
import { NavUser } from '@features/app/components/nav-user'

// Product areas only; account settings live in the user menu in the footer.
const NAVIGATION = [
  { title: 'Início', to: '/', icon: House },
  { title: 'Propostas', to: '/propostas', icon: FileText },
]

export function AppSidebar() {
  const { pathname } = useLocation()
  const { setOpenMobile } = useSidebar()
  const closeMobile = () => setOpenMobile(false)

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link to="/" onClick={closeMobile} />}>
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
            {NAVIGATION.map(({ title, to, icon: Icon }) => {
              const active = pathname === to || pathname.startsWith(`${to}/`)
              return (
                <SidebarMenuItem key={to}>
                  <SidebarMenuButton
                    tooltip={title}
                    isActive={active}
                    render={
                      <Link
                        to={to}
                        aria-current={active ? 'page' : undefined}
                        onClick={closeMobile}
                      />
                    }
                    className="data-active:bg-primary/10 data-active:text-primary data-active:hover:bg-primary/15"
                  >
                    <Icon />
                    <span>{title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
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
