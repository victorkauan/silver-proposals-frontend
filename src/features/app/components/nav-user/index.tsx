import { ChevronsUpDown, LogOut, Monitor, Moon, Sun, UserRound } from 'lucide-react'
import { Link, useLocation } from 'react-router'

import { Avatar, AvatarFallback } from '@shared/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@shared/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@shared/components/ui/sidebar'
import { initials } from '@shared/helpers/initials.helper'
import { type Theme, useTheme } from '@shared/theme/theme.context'
import { useSession } from '@features/auth/session.context'

const THEMES: Array<{ value: Theme; label: string; icon: typeof Sun }> = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Escuro', icon: Moon },
  { value: 'system', label: 'Sistema', icon: Monitor },
]

function UserIdentity({ name, email }: { name: string; email: string }) {
  return (
    <>
      <Avatar className="size-8 rounded-md">
        <AvatarFallback className="rounded-md bg-gradient-to-br from-blue-500/15 to-violet-500/15 text-xs font-medium text-primary">
          {initials(name)}
        </AvatarFallback>
      </Avatar>
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-medium">{name}</span>
        <span className="truncate text-xs text-muted-foreground">{email}</span>
      </div>
    </>
  )
}

export function NavUser() {
  const { user, logout } = useSession()
  const { theme, setTheme } = useTheme()
  const { isMobile } = useSidebar()
  const { pathname } = useLocation()
  if (!user) return null
  const onAccount = pathname.startsWith('/conta')

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                isActive={onAccount}
                className="aria-expanded:bg-sidebar-accent data-active:bg-primary/10 data-active:hover:bg-primary/15"
              />
            }
          >
            <UserIdentity name={user.name} email={user.email} />
            <ChevronsUpDown className="ml-auto size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5">
                  <UserIdentity name={user.name} email={user.email} />
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link to="/conta" />}>
              <UserRound />
              Minha conta
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs text-muted-foreground">Tema</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={theme}
                onValueChange={(value) => setTheme(value as Theme)}
              >
                {THEMES.map(({ value, label, icon: Icon }) => (
                  <DropdownMenuRadioItem key={value} value={value}>
                    <Icon />
                    {label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => void logout()}>
              <LogOut />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
