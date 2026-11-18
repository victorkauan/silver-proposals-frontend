import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
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
import { useSession } from '@features/auth/session.context'

export function LoginPage() {
  const { login } = useSession()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })
  const mutation = useMutation({
    mutationFn: (values: LoginInput) => login(values),
    onSuccess: () => navigate(from, { replace: true }),
  })
  const { errors } = form.formState

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
