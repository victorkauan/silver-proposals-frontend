import { useQuery, useQueryClient } from '@tanstack/react-query'
import { KeyRound, Monitor, ShieldCheck, ShieldOff, Smartphone } from 'lucide-react'
import { useState } from 'react'

import { errorMessage } from '@shared/api/error-message.helper'
import { FormError } from '@shared/components/form-error'
import { Badge } from '@shared/components/ui/badge'
import { Button } from '@shared/components/ui/button'
import { Skeleton } from '@shared/components/ui/skeleton'
import { formatDateTime } from '@shared/helpers/date.helper'
import { AccountLayout } from '@features/account/components/account-layout'
import { SettingsCard } from '@features/account/components/settings-card'
import { useSession } from '@features/auth/session.context'

import { securityApi } from './security.api'
import { type SecurityAction, SecurityDialog } from './security-dialog'

function deviceName(agent: string | null) {
  if (!agent) return 'Dispositivo desconhecido'
  const browser = /Edg(?:A|iOS)?\//.test(agent)
    ? 'Edge'
    : /(?:Firefox|FxiOS)\//.test(agent)
      ? 'Firefox'
      : /(?:Chrome|CriOS)\//.test(agent)
        ? 'Chrome'
        : /Safari\//.test(agent)
          ? 'Safari'
          : 'Navegador'
  const platform = /Android/.test(agent)
    ? 'Android'
    : /iPhone|iPad/.test(agent)
      ? 'iOS'
      : /Windows/.test(agent)
        ? 'Windows'
        : /Macintosh/.test(agent)
          ? 'macOS'
          : /Linux/.test(agent)
            ? 'Linux'
            : null
  return platform ? `${browser} · ${platform}` : browser
}

export function SecurityPage() {
  const { user, setUser, endSession } = useSession()
  const client = useQueryClient()
  const [action, setAction] = useState<SecurityAction | null>(null)
  const scope = ['account-security', user?.id]
  const status = useQuery({ queryKey: [...scope, 'two-factor'], queryFn: securityApi.status })
  const sessions = useQuery({ queryKey: [...scope, 'sessions'], queryFn: securityApi.sessions })
  const hasOthers = sessions.data?.some((session) => !session.current)

  return (
    <AccountLayout page="Segurança">
      <SettingsCard
        title="Verificação em duas etapas"
        description="Proteja sua conta com um código do app autenticador ao entrar."
      >
        {status.isPending && (
          <Skeleton className="h-16 w-full" aria-label="Carregando verificação em duas etapas" />
        )}
        {status.isError && (
          <div className="space-y-3">
            <FormError message={errorMessage(status.error)} />
            <Button variant="outline" onClick={() => void status.refetch()}>
              Tentar novamente
            </Button>
          </div>
        )}
        {status.data &&
          (status.data.enabled ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-lg border bg-muted/35 p-3">
                <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                <div className="space-y-1">
                  <Badge>Ativada</Badge>
                  <p className="text-sm text-muted-foreground">
                    {status.data.recovery_codes_remaining} de 10 códigos de recuperação disponíveis.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => setAction({ type: 'regenerate' })}>
                  Gerar novos códigos
                </Button>
                <Button variant="ghost" onClick={() => setAction({ type: 'disable' })}>
                  Desativar
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/35 p-3">
              <div className="flex items-center gap-2.5 text-sm font-medium text-muted-foreground">
                <span className="grid size-8 shrink-0 place-items-center rounded-md border bg-background">
                  <ShieldOff className="size-4" aria-hidden="true" />
                </span>
                Desativada
              </div>
              <Button onClick={() => setAction({ type: 'setup' })}>
                <Smartphone /> Ativar verificação
              </Button>
            </div>
          ))}
      </SettingsCard>

      <SettingsCard
        title="Senha"
        description="Ao trocar a senha, você permanece conectado apenas neste navegador."
      >
        <Button variant="outline" onClick={() => setAction({ type: 'password' })}>
          <KeyRound /> Trocar senha
        </Button>
      </SettingsCard>

      <SettingsCard
        title="Sessões ativas"
        description="Veja os navegadores conectados e encerre as sessões que não reconhece."
      >
        {sessions.isPending && <Skeleton className="h-20 w-full" aria-label="Carregando sessões" />}
        {sessions.isError && (
          <div className="space-y-3">
            <FormError message={errorMessage(sessions.error)} />
            <Button variant="outline" onClick={() => void sessions.refetch()}>
              Tentar novamente
            </Button>
          </div>
        )}
        {sessions.data?.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma sessão ativa.</p>
        )}
        {!!sessions.data?.length && (
          <ul aria-label="Sessões ativas" className="divide-y rounded-lg border">
            {[...sessions.data]
              .sort((a, b) => Number(b.current) - Number(a.current))
              .map((session) => (
                <li key={session.id} className="flex flex-wrap items-start gap-3 p-3">
                  <Monitor
                    className="mt-0.5 size-5 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <div className="min-w-36 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium" title={session.user_agent ?? undefined}>
                        {deviceName(session.user_agent)}
                      </span>
                      {session.current && <Badge variant="secondary">Sessão atual</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Última atividade em{' '}
                      <time dateTime={session.last_active_at}>
                        {formatDateTime(session.last_active_at)}
                      </time>
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAction({ type: 'endSession', session })}
                  >
                    {session.current ? 'Sair deste navegador' : 'Encerrar sessão'}
                  </Button>
                </li>
              ))}
          </ul>
        )}
        {hasOthers && (
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => setAction({ type: 'endOthers' })}
          >
            Encerrar outras sessões
          </Button>
        )}
      </SettingsCard>

      {action && (
        <SecurityDialog
          action={action}
          onClose={() => setAction(null)}
          onChange={(enabled, endedCurrent) => {
            if (endedCurrent) {
              endSession()
              return
            }
            if (user && enabled !== undefined) setUser({ ...user, two_factor_enabled: enabled })
            void client.invalidateQueries({ queryKey: scope })
          }}
        />
      )}
    </AccountLayout>
  )
}
