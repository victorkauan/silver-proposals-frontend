import { useMutation } from '@tanstack/react-query'
import { Copy, KeyRound, Smartphone } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { type FormEvent, useState } from 'react'
import { toast } from 'sonner'

import { errorMessage } from '@shared/api/error-message.helper'
import { FormError } from '@shared/components/form-error'
import { Button } from '@shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@shared/components/ui/dialog'
import { Field, FieldGroup, FieldLabel } from '@shared/components/ui/field'
import { Input } from '@shared/components/ui/input'
import { Spinner } from '@shared/components/ui/spinner'
import { AuthenticatorCodeInput } from '@features/auth/components/authenticator-code-input'

import { type ActiveSession, securityApi, type TwoFactorSetup } from './security.api'

export type SecurityAction =
  | { type: 'setup' | 'disable' | 'regenerate' | 'password' | 'endOthers' }
  | { type: 'endSession'; session: ActiveSession }

type Step = SecurityAction['type'] | 'confirmSetup' | 'codes'

const details: Record<Step, { title: string; description: string; submit?: string }> = {
  setup: {
    title: 'Ativar verificação em duas etapas',
    description: 'Confirme sua senha para configurar um app autenticador.',
    submit: 'Continuar',
  },
  confirmSetup: {
    title: 'Configurar app autenticador',
    description:
      'Escaneie o QR code ou insira a chave manualmente. Depois, confirme com o código de 6 dígitos.',
    submit: 'Confirmar e ativar',
  },
  codes: {
    title: 'Códigos de recuperação',
    description:
      'Guarde os códigos em um local seguro. Eles são exibidos uma única vez e cada código funciona apenas uma vez.',
  },
  disable: {
    title: 'Desativar verificação em duas etapas',
    description: 'Confirme sua senha e informe um código do app autenticador ou de recuperação.',
    submit: 'Confirmar desativação',
  },
  regenerate: {
    title: 'Gerar novos códigos de recuperação',
    description: 'Os códigos anteriores serão invalidados. Confirme sua senha para continuar.',
    submit: 'Gerar novos códigos',
  },
  password: {
    title: 'Trocar senha',
    description: 'Ao trocar a senha, todas as outras sessões serão encerradas.',
    submit: 'Salvar nova senha',
  },
  endSession: {
    title: 'Encerrar sessão',
    description: 'O navegador desta sessão precisará entrar novamente.',
    submit: 'Confirmar encerramento',
  },
  endOthers: {
    title: 'Encerrar outras sessões',
    description: 'Você continuará conectado neste navegador.',
    submit: 'Encerrar todas as outras',
  },
}

export function SecurityDialog({
  action,
  onClose,
  onChange,
}: {
  action: SecurityAction
  onClose: () => void
  onChange: (enabled?: boolean, endedCurrent?: boolean) => void
}) {
  const [step, setStep] = useState<Step>(action.type)
  const [setup, setSetup] = useState<TwoFactorSetup | null>(null)
  const [codes, setCodes] = useState<string[]>([])
  const [useRecovery, setUseRecovery] = useState(false)
  const [code, setCode] = useState('')
  const { title, description, submit } = details[step]
  const needsPassword = ['setup', 'disable', 'regenerate', 'password'].includes(step)
  const needsCode = step === 'confirmSetup' || step === 'disable'
  const ready = !needsCode || (useRecovery ? code.trim().length >= 10 : code.length === 6)

  const showCodes = (newCodes: string[]) => {
    setCodes(newCodes)
    setSetup(null)
    setStep('codes')
  }

  const mutation = useMutation({
    gcTime: 0,
    mutationFn: async (data: FormData) => {
      const password = String(data.get('password') ?? '')
      const code = String(data.get('code') ?? '').trim()
      switch (step) {
        case 'setup':
          setSetup(await securityApi.setup(password))
          setStep('confirmSetup')
          return
        case 'confirmSetup':
          showCodes((await securityApi.enable(code)).codes)
          onChange(true)
          return
        case 'regenerate':
          showCodes((await securityApi.regenerate(password)).codes)
          onChange()
          return
        case 'disable':
          await securityApi.disable(password, code)
          onChange(false)
          toast.success('Verificação em duas etapas desativada.')
          break
        case 'password':
          await securityApi.changePassword(password, String(data.get('newPassword') ?? ''))
          onChange()
          toast.success('Senha atualizada.')
          break
        case 'endSession':
          if (action.type !== 'endSession') return
          await securityApi.endSession(action.session.id)
          onChange(undefined, action.session.current)
          toast.success('Sessão encerrada.')
          break
        case 'endOthers':
          await securityApi.endOtherSessions()
          onChange()
          toast.success('Outras sessões encerradas.')
          break
        case 'codes':
          return
      }
      onClose()
    },
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (ready && !mutation.isPending)
      mutation.mutate(new FormData(event.currentTarget), {
        onSuccess: () => mutation.reset(),
      })
  }

  async function copy(value: string, message: string) {
    try {
      await navigator.clipboard.writeText(value)
      toast.success(message)
    } catch {
      toast.error('Não foi possível copiar. Selecione o texto para copiar manualmente.')
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !mutation.isPending) onClose()
      }}
    >
      <DialogContent showCloseButton={false} className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {step === 'confirmSetup' && setup && (
          <div className="space-y-3 rounded-lg border bg-muted/35 p-3">
            <div className="mx-auto w-fit rounded-md bg-white p-2">
              <QRCodeSVG
                value={setup.otpauth_uri}
                size={148}
                title="QR code do app autenticador"
                marginSize={4}
              />
            </div>
            <div className="flex items-center gap-2">
              <code
                aria-label="Chave manual"
                className="min-w-0 flex-1 font-mono text-xs break-all select-all"
              >
                {setup.secret}
              </code>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label="Copiar chave manual"
                onClick={() => void copy(setup.secret, 'Chave copiada.')}
              >
                <Copy />
              </Button>
            </div>
          </div>
        )}
        {step === 'codes' ? (
          <>
            <ul
              aria-label="Códigos de recuperação"
              className="grid grid-cols-2 gap-2 rounded-lg border bg-muted/35 p-3 text-center font-mono"
            >
              {codes.map((code) => (
                <li key={code} className="select-all">
                  {code}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => void copy(codes.join('\n'), 'Códigos copiados.')}
              >
                <Copy /> Copiar códigos
              </Button>
              <Button type="button" onClick={onClose}>
                Concluir
              </Button>
            </div>
          </>
        ) : (
          <form key={step} onSubmit={handleSubmit}>
            <FieldGroup className="gap-4">
              <FormError message={mutation.isError ? errorMessage(mutation.error) : null} />
              {needsPassword && (
                <Field>
                  <FieldLabel htmlFor="security-password">Senha atual</FieldLabel>
                  <Input
                    id="security-password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    maxLength={128}
                  />
                </Field>
              )}
              {step === 'password' && (
                <Field>
                  <FieldLabel htmlFor="security-new-password">Nova senha</FieldLabel>
                  <Input
                    id="security-new-password"
                    name="newPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    maxLength={128}
                  />
                </Field>
              )}
              {needsCode && (
                <Field>
                  <FieldLabel htmlFor="security-code">
                    {useRecovery ? 'Código de recuperação' : 'Código de 6 dígitos'}
                  </FieldLabel>
                  {useRecovery ? (
                    <Input
                      id="security-code"
                      name="code"
                      value={code}
                      onChange={(event) => setCode(event.target.value)}
                      required
                      autoComplete="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      placeholder="xxxxx-xxxxx"
                      maxLength={32}
                      className="font-mono"
                      disabled={mutation.isPending}
                    />
                  ) : (
                    <AuthenticatorCodeInput
                      id="security-code"
                      name="code"
                      value={code}
                      onChange={setCode}
                      required
                      disabled={mutation.isPending}
                    />
                  )}
                  {step === 'disable' && (
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="w-fit px-0"
                      disabled={mutation.isPending}
                      onClick={() => {
                        setCode('')
                        mutation.reset()
                        setUseRecovery(!useRecovery)
                      }}
                    >
                      {useRecovery ? <Smartphone /> : <KeyRound />}
                      {useRecovery ? 'Usar o app autenticador' : 'Usar um código de recuperação'}
                    </Button>
                  )}
                </Field>
              )}
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={mutation.isPending}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={mutation.isPending || !ready}>
                  {mutation.isPending && <Spinner />}
                  {submit}
                </Button>
              </div>
            </FieldGroup>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
