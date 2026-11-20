import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router'

import { errorMessage } from '@shared/api/error-message.helper'
import { FormError } from '@shared/components/form-error'
import { Button } from '@shared/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@shared/components/ui/field'
import { Input } from '@shared/components/ui/input'
import { Spinner } from '@shared/components/ui/spinner'
import { type LoginInput, loginSchema } from '@features/auth/auth.schema'
import { AuthLayout } from '@features/auth/components/auth-layout'
import { TwoFactorStep } from '@features/auth/components/two-factor-step'
import { useSession } from '@features/auth/session.context'

export function LoginPage() {
  const { login, completeTwoFactor, notice } = useSession()
  const [challenge, setChallenge] = useState<string | null>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })
  const mutation = useMutation({
    gcTime: 0,
    mutationFn: (values: LoginInput) => login(values),
    onSuccess: (result) => {
      mutation.reset()
      form.resetField('password')
      if (result.status === 'two_factor') setChallenge(result.challengeToken)
      else void navigate(from, { replace: true })
    },
  })
  const { errors } = form.formState

  if (challenge) {
    return (
      <AuthLayout
        title="Verificação em duas etapas"
        description="Confirme sua identidade para acessar suas propostas."
      >
        <TwoFactorStep
          onBack={() => setChallenge(null)}
          onSubmit={async (code) => {
            await completeTwoFactor(challenge, code)
            await navigate(from, { replace: true })
          }}
        />
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Entrar"
      description="Entre com seu e-mail para acessar suas propostas."
      footer={
        <>
          Ainda não tem conta?{' '}
          <Link
            to="/cadastro"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Criar conta
          </Link>
        </>
      }
    >
      <form noValidate onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
        <FieldGroup>
          {notice === 'account_deleted' && (
            <p role="status" className="rounded-lg border bg-muted/40 px-3 py-2 text-sm">
              Sua conta foi excluída. Obrigado por usar o Silver Proposals.
            </p>
          )}
          <FormError message={mutation.isError ? errorMessage(mutation.error) : null} />
          <Field data-invalid={!!errors.email}>
            <FieldLabel htmlFor="email">E-mail</FieldLabel>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="voce@empresa.com.br"
              aria-invalid={!!errors.email}
              {...form.register('email')}
            />
            <FieldError errors={[errors.email]} />
          </Field>
          <Field data-invalid={!!errors.password}>
            <FieldLabel htmlFor="password">Senha</FieldLabel>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              {...form.register('password')}
            />
            <FieldError errors={[errors.password]} />
          </Field>
          <Button type="submit" disabled={mutation.isPending} className="w-full">
            {mutation.isPending && <Spinner />}
            Entrar
          </Button>
        </FieldGroup>
      </form>
    </AuthLayout>
  )
}
