import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { CircleCheck, Download, ExternalLink, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { toast } from 'sonner'

import { errorMessage } from '@shared/api/error-message.helper'
import { FormError } from '@shared/components/form-error'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@shared/components/ui/alert-dialog'
import { Button } from '@shared/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@shared/components/ui/field'
import { Input } from '@shared/components/ui/input'
import { Spinner } from '@shared/components/ui/spinner'
import { formatDate } from '@shared/helpers/date.helper'
import { accountApi, EXPORT_FILE_NAME } from '@features/account/account.api'
import { type DeleteAccountInput, deleteAccountSchema } from '@features/account/account.schema'
import { AccountLayout } from '@features/account/components/account-layout'
import { SettingsCard } from '@features/account/components/settings-card'
import { useSession } from '@features/auth/session.context'

function saveFile(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name
  anchor.click()
  URL.revokeObjectURL(url)
}

function PrivacyStatus() {
  const { user, setUser } = useSession()
  const accept = useMutation({
    mutationFn: accountApi.acceptPrivacy,
    onSuccess: (updated) => {
      setUser(updated)
      toast.success('Aviso de privacidade aceito.')
    },
  })
  if (!user) return null

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      {user.privacy_up_to_date && user.privacy_accepted_at ? (
        <p className="flex items-center gap-2 text-sm">
          <CircleCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
          Versão atual aceita em {formatDate(user.privacy_accepted_at)}.
        </p>
      ) : (
        <p className="flex items-center gap-2 text-sm">
          <TriangleAlert className="size-4 text-amber-600 dark:text-amber-400" />
          Há uma versão do aviso que você ainda não aceitou.
        </p>
      )}
      <div className="flex gap-2">
        <Link
          to="/privacidade"
          className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm hover:bg-muted"
        >
          Ler o aviso
          <ExternalLink className="size-3.5" />
        </Link>
        {!user.privacy_up_to_date && (
          <Button onClick={() => accept.mutate()} disabled={accept.isPending}>
            {accept.isPending && <Spinner />}
            Aceitar
          </Button>
        )}
      </div>
    </div>
  )
}

function ExportData() {
  const exporting = useMutation({
    mutationFn: accountApi.exportData,
    onSuccess: (blob) => {
      saveFile(blob, EXPORT_FILE_NAME)
      toast.success('Seus dados foram exportados.')
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <p className="max-w-md text-sm text-muted-foreground">
        Um arquivo JSON com sua conta, sessões, propostas, versões que você escreveu e links que
        você criou. Senhas e tokens nunca saem do sistema.
      </p>
      <Button variant="outline" onClick={() => exporting.mutate()} disabled={exporting.isPending}>
        {exporting.isPending ? <Spinner /> : <Download />}
        Exportar meus dados
      </Button>
    </div>
  )
}

function DeleteAccount() {
  const { endSession } = useSession()
  const [open, setOpen] = useState(false)
  const form = useForm<DeleteAccountInput>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: { password: '', confirmation: '' as 'EXCLUIR' },
  })
  const removal = useMutation({
    mutationFn: ({ password }: DeleteAccountInput) => accountApi.deleteAccount(password),
    // Ending the session sends the user to the login page, which shows the notice.
    onSuccess: () => endSession('account_deleted'),
  })
  const { errors } = form.formState
  const close = (next: boolean) => {
    setOpen(next)
    if (!next) {
      form.reset()
      removal.reset()
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-md text-sm text-muted-foreground">
          Apaga sua conta e as propostas em que você é o único dono. Nas propostas com outros donos,
          seu acesso é removido e suas versões ficam sem autor.
        </p>
        <Button variant="destructive" onClick={() => setOpen(true)}>
          Excluir conta
        </Button>
      </div>
      <AlertDialog open={open} onOpenChange={close}>
        <AlertDialogContent>
          <form
            noValidate
            onSubmit={form.handleSubmit((values) => removal.mutate(values))}
            className="grid gap-4"
          >
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir sua conta?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Se quiser guardar uma cópia, exporte seus dados
                antes.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <FieldGroup>
              <FormError message={removal.isError ? errorMessage(removal.error) : null} />
              <Field data-invalid={!!errors.password}>
                <FieldLabel htmlFor="delete-password">Senha atual</FieldLabel>
                <Input
                  id="delete-password"
                  type="password"
                  autoComplete="current-password"
                  aria-invalid={!!errors.password}
                  {...form.register('password')}
                />
                <FieldError errors={[errors.password]} />
              </Field>
              <Field data-invalid={!!errors.confirmation}>
                <FieldLabel htmlFor="delete-confirmation">
                  <span>
                    Para confirmar, digite <strong className="font-semibold">EXCLUIR</strong>
                  </span>
                </FieldLabel>
                <Input
                  id="delete-confirmation"
                  placeholder="EXCLUIR"
                  autoComplete="off"
                  aria-invalid={!!errors.confirmation}
                  {...form.register('confirmation')}
                />
                <FieldError errors={[errors.confirmation]} />
              </Field>
            </FieldGroup>
            <AlertDialogFooter>
              <AlertDialogCancel type="button">Cancelar</AlertDialogCancel>
              <Button type="submit" variant="destructive" disabled={removal.isPending}>
                {removal.isPending && <Spinner />}
                Excluir definitivamente
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export function DataPage() {
  return (
    <AccountLayout page="Privacidade e dados">
      <SettingsCard
        title="Aviso de privacidade"
        description="Como tratamos seus dados, por quanto tempo e quais são seus direitos (LGPD)."
      >
        <PrivacyStatus />
      </SettingsCard>
      <SettingsCard
        title="Exportar meus dados"
        description="Portabilidade e acesso aos seus dados pessoais (LGPD, art. 18)."
      >
        <ExportData />
      </SettingsCard>
      <SettingsCard
        title="Excluir conta"
        description="Eliminação dos seus dados pessoais (LGPD, art. 18)."
        tone="danger"
      >
        <DeleteAccount />
      </SettingsCard>
    </AccountLayout>
  )
}
