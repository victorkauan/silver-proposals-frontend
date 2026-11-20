import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Copy, Link2, Plus, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { errorMessage } from '@shared/api/error-message.helper'
import { Badge } from '@shared/components/ui/badge'
import { Button } from '@shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@shared/components/ui/dialog'
import { Input } from '@shared/components/ui/input'
import { Skeleton } from '@shared/components/ui/skeleton'
import { Spinner } from '@shared/components/ui/spinner'
import { ToggleGroup, ToggleGroupItem } from '@shared/components/ui/toggle-group'
import { formatDate, formatRelative } from '@shared/helpers/date.helper'
import { proposalApi, proposalKeys, shareUrl } from '@features/proposals/proposal.api'
import type { ShareLink } from '@features/proposals/proposal.type'

const EXPIRATIONS = [
  { days: 1, label: '1 dia' },
  { days: 7, label: '7 dias' },
  { days: 30, label: '30 dias' },
  { days: 90, label: '90 dias' },
]

function status(link: ShareLink): { label: string; variant: 'default' | 'secondary' | 'outline' } {
  if (link.active) return { label: 'Ativo', variant: 'default' }
  if (link.revoked_at) return { label: 'Revogado', variant: 'outline' }
  return { label: 'Expirado', variant: 'secondary' }
}

function CopyField({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success('Link copiado')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Não foi possível copiar. Selecione o link e copie manualmente.')
    }
  }
  return (
    <div className="flex gap-2">
      <Input
        readOnly
        value={url}
        aria-label="Link de compartilhamento"
        onFocus={(event) => event.target.select()}
        className="font-mono text-xs"
      />
      <Button onClick={() => void copy()} className="shrink-0">
        {copied ? <Check /> : <Copy />}
        {copied ? 'Copiado' : 'Copiar'}
      </Button>
    </div>
  )
}

function LinkRow({ link, proposalId }: { link: ShareLink; proposalId: string }) {
  const queryClient = useQueryClient()
  const [confirming, setConfirming] = useState(false)
  const revoke = useMutation({
    mutationFn: () => proposalApi.revokeShareLink(proposalId, link.id),
    onSuccess: async () => {
      void queryClient.invalidateQueries({ queryKey: proposalKeys.dashboard() })
      await queryClient.invalidateQueries({ queryKey: proposalKeys.shareLinks(proposalId) })
      toast.success('Link revogado', { description: 'Ele parou de funcionar imediatamente.' })
    },
    onError: (error) =>
      toast.error('Não foi possível revogar', { description: errorMessage(error) }),
  })
  const { label, variant } = status(link)

  return (
    <li className="flex items-center gap-3 py-2.5">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Link2 className="size-4" />
      </span>
      <span className="min-w-0 flex-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-2 text-sm text-foreground">
          Link criado {formatRelative(link.created_at)}
          <Badge variant={variant}>{label}</Badge>
        </span>
        {link.revoked_at
          ? `Revogado ${formatRelative(link.revoked_at)}`
          : link.active
            ? `Expira em ${formatDate(link.expires_at)}`
            : `Expirou em ${formatDate(link.expires_at)}`}
      </span>
      {link.active &&
        (confirming ? (
          <span className="flex shrink-0 gap-1">
            <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={revoke.isPending}
              onClick={() => revoke.mutate()}
            >
              {revoke.isPending && <Spinner />}
              Confirmar
            </Button>
          </span>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => setConfirming(true)}>
            Revogar
          </Button>
        ))}
    </li>
  )
}

function ShareContent({ proposalId }: { proposalId: string }) {
  const queryClient = useQueryClient()
  const [days, setDays] = useState(7)
  const [created, setCreated] = useState<string | null>(null)
  const links = useQuery({
    queryKey: proposalKeys.shareLinks(proposalId),
    queryFn: () => proposalApi.shareLinks(proposalId),
  })
  const create = useMutation({
    mutationFn: () => proposalApi.createShareLink(proposalId, days),
    onSuccess: async (link) => {
      setCreated(shareUrl(link.token))
      void queryClient.invalidateQueries({ queryKey: proposalKeys.dashboard() })
      await queryClient.invalidateQueries({ queryKey: proposalKeys.shareLinks(proposalId) })
    },
    onError: (error) =>
      toast.error('Não foi possível criar o link', { description: errorMessage(error) }),
  })
  const sorted = [...(links.data ?? [])].sort(
    (a, b) => Number(b.active) - Number(a.active) || b.created_at.localeCompare(a.created_at),
  )

  return (
    <div className="space-y-5">
      {created ? (
        <div className="space-y-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
          <p className="text-sm font-medium">Link criado</p>
          <CopyField url={created} />
          <p className="flex gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5 shrink-0" />
            Copie agora: por segurança, o link completo só aparece uma vez.
          </p>
          <Button variant="link" size="sm" className="h-auto p-0" onClick={() => setCreated(null)}>
            Criar outro link
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <p id="expiration" className="text-sm font-medium">
              Validade
            </p>
            <ToggleGroup
              aria-labelledby="expiration"
              value={[String(days)]}
              onValueChange={(values) => values[0] && setDays(Number(values[0]))}
              variant="outline"
              size="sm"
              spacing={0}
              className="w-full"
            >
              {EXPIRATIONS.map((option) => (
                <ToggleGroupItem key={option.days} value={String(option.days)} className="flex-1">
                  {option.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          <Button className="w-full" disabled={create.isPending} onClick={() => create.mutate()}>
            {create.isPending ? <Spinner /> : <Plus />}
            Criar link
          </Button>
        </div>
      )}

      <div>
        <h3 className="mb-1 text-xs font-medium tracking-wider text-muted-foreground uppercase">
          Links
        </h3>
        {links.isPending ? (
          <Skeleton className="h-12" />
        ) : links.isError ? (
          <p className="text-sm text-destructive">{errorMessage(links.error)}</p>
        ) : sorted.length === 0 ? (
          <p className="py-3 text-sm text-muted-foreground">Nenhum link criado ainda.</p>
        ) : (
          <ul className="max-h-60 divide-y overflow-y-auto">
            {sorted.map((link) => (
              <LinkRow key={link.id} link={link} proposalId={proposalId} />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export function ShareDialog({ proposalId }: { proposalId: string }) {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>
        <Link2 />
        Compartilhar
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Compartilhar proposta</DialogTitle>
          <DialogDescription>
            Quem tiver o link vê a versão atual da proposta, sem precisar de conta. O briefing e o
            histórico não são compartilhados.
          </DialogDescription>
        </DialogHeader>
        <ShareContent proposalId={proposalId} />
      </DialogContent>
    </Dialog>
  )
}
