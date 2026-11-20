import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { errorMessage } from '@shared/api/error-message.helper'
import { FormError } from '@shared/components/form-error'
import { Button } from '@shared/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@shared/components/ui/field'
import { Input } from '@shared/components/ui/input'
import { Spinner } from '@shared/components/ui/spinner'
import { accountApi } from '@features/account/account.api'
import {
  type EmailInput,
  emailSchema,
  type ProfileInput,
  profileSchema,
} from '@features/account/account.schema'
import { AccountLayout } from '@features/account/components/account-layout'
import { SettingsCard } from '@features/account/components/settings-card'
import { useSession } from '@features/auth/session.context'

function NameForm() {
  const { user, setUser } = useSession()
  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    values: { name: user?.name ?? '' },
  })
  const mutation = useMutation({
    mutationFn: ({ name }: ProfileInput) => accountApi.updateProfile(name),
    onSuccess: (updated) => {
      setUser(updated)
      toast.success('Nome atualizado.')
    },
  })
  const { errors, isDirty } = form.formState

  return (
    <form noValidate onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
      <FieldGroup>
        <FormError message={mutation.isError ? errorMessage(mutation.error) : null} />
        <Field data-invalid={!!errors.name}>
          <FieldLabel htmlFor="name">Nome</FieldLabel>
          <Input
            id="name"
            autoComplete="name"
            aria-invalid={!!errors.name}
            {...form.register('name')}
          />
          <FieldError errors={[errors.name]} />
        </Field>
        <div className="flex justify-end">
          <Button type="submit" disabled={!isDirty || mutation.isPending}>
            {mutation.isPending && <Spinner />}
            Salvar nome
          </Button>
        </div>
      </FieldGroup>
    </form>
  )
}

function EmailForm() {
  const { user, setUser } = useSession()
  const form = useForm<EmailInput>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '', password: '' },
  })
  const mutation = useMutation({
    mutationFn: ({ email, password }: EmailInput) => accountApi.changeEmail(email, password),
    onSuccess: (updated) => {
      setUser(updated)
      form.reset()
      toast.success('E-mail atualizado.')
    },
  })
  const { errors } = form.formState

  return (
    <form noValidate onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
      <FieldGroup>
        <FormError message={mutation.isError ? errorMessage(mutation.error) : null} />
        <p className="text-sm text-muted-foreground">
          E-mail atual: <span className="font-medium text-foreground">{user?.email}</span>
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={!!errors.email}>
            <FieldLabel htmlFor="new-email">Novo e-mail</FieldLabel>
            <Input
              id="new-email"
              type="email"
              autoComplete="email"
              aria-invalid={!!errors.email}
              {...form.register('email')}
            />
            <FieldError errors={[errors.email]} />
          </Field>
          <Field data-invalid={!!errors.password}>
            <FieldLabel htmlFor="email-password">Senha atual</FieldLabel>
            <Input
              id="email-password"
              type="password"
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              {...form.register('password')}
            />
            <FieldError errors={[errors.password]} />
          </Field>
        </div>
        <div className="flex justify-end">
          <Button type="submit" variant="outline" disabled={mutation.isPending}>
            {mutation.isPending && <Spinner />}
            Alterar e-mail
          </Button>
        </div>
      </FieldGroup>
    </form>
  )
}

export function ProfilePage() {
  return (
    <AccountLayout page="Perfil">
      <SettingsCard
        title="Informações pessoais"
        description="Seu nome aparece no histórico de versões das propostas."
      >
        <NameForm />
      </SettingsCard>
      <SettingsCard
        title="E-mail de acesso"
        description="Usado para entrar na plataforma. Confirme com sua senha para alterar."
      >
        <EmailForm />
      </SettingsCard>
    </AccountLayout>
  )
}
