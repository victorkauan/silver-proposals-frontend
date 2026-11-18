import { Fragment, type ReactNode } from 'react'
import { Link } from 'react-router'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@shared/components/ui/breadcrumb'
import { Separator } from '@shared/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@shared/components/ui/sidebar'
import { AppSidebar } from '@features/app/components/app-sidebar'

type Crumb = { label: string; to: string }

type AppShellProps = {
  page: string
  parents?: Crumb[]
  children: ReactNode
}

export function AppShell({ page, parents = [], children }: AppShellProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-vertical:h-4 data-vertical:self-auto"
          />
          <Breadcrumb>
            <BreadcrumbList>
              {parents.map(({ label, to }) => (
                <Fragment key={to}>
                  <BreadcrumbItem>
                    <BreadcrumbLink render={<Link to={to} />}>{label}</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                </Fragment>
              ))}
              <BreadcrumbItem>
                <BreadcrumbPage className="max-w-64 truncate">{page}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-1 flex-col">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
