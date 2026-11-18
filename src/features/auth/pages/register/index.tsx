import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'

import { errorMessage } from '@shared/api/error-message.helper'
import { FormError } from '@shared/components/form-error'
import { Button } from '@shared/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@shared/components/ui/field'
import { Input } from '@shared/components/ui/input'
import { Spinner } from '@shared/components/ui/spinner'
import { type RegisterInput, registerSchema } from '@features/auth/auth.schema'
import { AuthLayout } from '@features/auth/components/auth-layout'
import { useSession } from '@features/auth/session.context'

export function RegisterPage() {
  const { register } = useSession()
  const navigate = useNavigate()
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '' },
  })
  const mutation = useMutation({
    mutationFn: (values: RegisterInput) => register(values),
    onSuccess: () => navigate('/', { replace: true }),
  })
  const { errors } = form.formState

  return (
    <AuthLayout
      title="Criar conta"
      description="Comece a gerar propostas comerciais com IA em minutos."
      footer={
        <>
          Já tem conta?{' '}
          <Link
            to="/entrar"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Entrar
          </Link>
        </>
      }
    >
      <form noValidate onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
        <FieldGroup>
          <FormError message={mutation.isError ? errorMessage(mutation.error) : null} />
          <Field data-invalid={!!errors.name}>
            <FieldLabel htmlFor="name">Nome</FieldLabel>
            <Input
              id="name"
              autoComplete="name"
              placeholder="Seu nome"
              aria-invalid={!!errors.name}
              {...form.register('name')}
            />
            <FieldError errors={[errors.name]} />
          </Field>
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
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              {...form.register('password')}
            />
            <FieldDescription>Mínimo de 8 caracteres.</FieldDescription>
            <FieldError errors={[errors.password]} />
          </Field>
          <Button type="submit" disabled={mutation.isPending} className="w-full">
            {mutation.isPending && <Spinner />}
            Criar conta
          </Button>
        </FieldGroup>
      </form>
    </AuthLayout>
  )
}
