import type { ReactNode } from 'react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@shared/components/ui/card'
import { cn } from '@shared/helpers/cn.helper'

type SettingsCardProps = {
  title: string
  description: ReactNode
  tone?: 'default' | 'danger'
  children: ReactNode
}

export function SettingsCard({
  title,
  description,
  tone = 'default',
  children,
}: SettingsCardProps) {
  return (
    <Card className={cn(tone === 'danger' && 'border-destructive/30')}>
      <CardHeader>
        <CardTitle className={cn(tone === 'danger' && 'text-destructive')}>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
