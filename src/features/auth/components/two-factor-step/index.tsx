import { useMutation } from '@tanstack/react-query'
import { ArrowLeft, KeyRound, Smartphone } from 'lucide-react'
import { type FormEvent, useState } from 'react'

import { errorMessage } from '@shared/api/error-message.helper'
import { ApiError } from '@shared/api/http.client'
import { FormError } from '@shared/components/form-error'
import { Button } from '@shared/components/ui/button'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@shared/components/ui/field'
import { Input } from '@shared/components/ui/input'
import { Spinner } from '@shared/components/ui/spinner'
import { AuthenticatorCodeInput } from '@features/auth/components/authenticator-code-input'

type TwoFactorStepProps = {
  onSubmit: (code: string) => Promise<void>
  onBack: () => void
}

export function TwoFactorStep({ onSubmit, onBack }: TwoFactorStepProps) {
  const [mode, setMode] = useState<'app' | 'recovery'>('app')
  const [code, setCode] = useState('')
  const mutation = useMutation({
    gcTime: 0,
    mutationFn: onSubmit,
    onError: () => setCode(''),
  })
  const expired = mutation.error instanceof ApiError && mutation.error.code === 'invalid_challenge'
  const ready = mode === 'app' ? code.length === 6 : code.trim().length >= 10

  const submit = (value: string) => {
    if (!mutation.isPending) mutation.mutate(value)
  }
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (ready) submit(code)
  }
  const switchMode = () => {
    setMode(mode === 'app' ? 'recovery' : 'app')
    setCode('')
    mutation.reset()
  }

  return (
    <form noValidate onSubmit={handleSubmit}>
      <FieldGroup>
        <FormError message={mutation.isError ? errorMessage(mutation.error) : null} />
        {mode === 'app' ? (
          <Field>
            <FieldLabel htmlFor="two-factor-code">Código do app autenticador</FieldLabel>
            <AuthenticatorCodeInput
              id="two-factor-code"
              value={code}
              onChange={setCode}
              autoFocus
              disabled={mutation.isPending || expired}
              containerClassName="justify-center"
            />
            <FieldDescription className="text-center">
              Abra o app (Google Authenticator, Microsoft Authenticator, 1Password…) e digite o
              código de 6 dígitos.
            </FieldDescription>
          </Field>
        ) : (
          <Field>
            <FieldLabel htmlFor="recovery-code">Código de recuperação</FieldLabel>
            <Input
              id="recovery-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="xxxxx-xxxxx"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              autoFocus
              disabled={mutation.isPending || expired}
              className="font-mono"
            />
            <FieldDescription>Cada código de recuperação funciona uma única vez.</FieldDescription>
          </Field>
        )}
        {expired ? (
          <Button type="button" onClick={onBack} className="w-full">
            Entrar novamente
          </Button>
        ) : (
          <Button type="submit" disabled={!ready || mutation.isPending} className="w-full">
            {mutation.isPending && <Spinner />}
            Verificar
          </Button>
        )}
        <div className="flex flex-col items-center gap-1">
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={switchMode}
            disabled={mutation.isPending || expired}
          >
            {mode === 'app' ? <KeyRound /> : <Smartphone />}
            {mode === 'app' ? 'Usar um código de recuperação' : 'Usar o app autenticador'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onBack}
            disabled={mutation.isPending}
            className="text-muted-foreground"
          >
            <ArrowLeft />
            Voltar
          </Button>
        </div>
      </FieldGroup>
    </form>
  )
}
