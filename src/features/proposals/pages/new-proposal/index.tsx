import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Check, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'

import { errorMessage } from '@shared/api/error-message.helper'
import { FormError } from '@shared/components/form-error'
import { Button, buttonVariants } from '@shared/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@shared/components/ui/field'
import { Input } from '@shared/components/ui/input'
import { Spinner } from '@shared/components/ui/spinner'
import { Textarea } from '@shared/components/ui/textarea'
import { cn } from '@shared/helpers/cn.helper'
import { formatDate } from '@shared/helpers/date.helper'
import { AppShell } from '@features/app/components/app-shell'
import { GenerationPreview } from '@features/proposals/components/generation-preview'
import { proposalApi } from '@features/proposals/proposal.api'
import {
  BRIEFING_MAX_LENGTH,
  type ProposalInput,
  proposalSchema,
} from '@features/proposals/proposal.schema'
import { useGeneration } from '@features/proposals/use-generation.hook'

const BRIEFING_TIPS = [
  'Quem é o cliente e qual problema ele quer resolver',
  'O escopo: o que entra e o que fica de fora',
  'Prazos e datas importantes',
  'Orçamento, se já houver uma faixa',
  'Restrições e o que já foi combinado',
]

const BRIEFING_PLACEHOLDER = `Ex.: Padaria com duas lojas em Fortaleza quer um site com cardápio online e encomendas pelo WhatsApp.

Escopo: página inicial, cardápio atualizável pela equipe, formulário de encomendas.
Prazo: 6 semanas. Orçamento: a definir. Sem pagamento online nesta fase.`

export function NewProposalPage() {
  const navigate = useNavigate()
  const generation = useGeneration()
  const [proposalId, setProposalId] = useState<string | null>(null)
  const form = useForm<ProposalInput>({
    resolver: zodResolver(proposalSchema),
    defaultValues: { title: '', client_name: '', briefing: '' },
  })
  const { errors } = form.formState
  const briefingLength = useWatch({ control: form.control, name: 'briefing' }).length
  const title = useWatch({ control: form.control, name: 'title' })
  const client = useWatch({ control: form.control, name: 'client_name' })

  const generate = async (id: string) => {
    if (await generation.generate(id)) navigate(`/propostas/${id}`, { replace: true })
  }

  const create = useMutation({
    mutationFn: proposalApi.create,
    onSuccess: (proposal) => {
      setProposalId(proposal.id)
      void generate(proposal.id)
    },
  })

  return (
    <AppShell page="Nova proposta" parents={[{ label: 'Propostas', to: '/propostas' }]}>
      <div className="@container mx-auto w-full max-w-6xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Nova proposta</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Descreva o que o cliente precisa. A IA escreve a primeira versão, e você revisa depois.
          </p>
        </div>

        {generation.status === 'streaming' || generation.status === 'done' ? (
          <GenerationPreview
            text={generation.text}
            meta={[
              { label: 'Proposta', value: title },
              { label: 'Cliente', value: client },
              { label: 'Data', value: create.data ? formatDate(create.data.created_at) : '' },
            ]}
            onStop={generation.reset}
          />
        ) : proposalId ? (
          <div className="max-w-2xl space-y-4 rounded-xl border bg-card p-6">
            <FormError message={generation.error} />
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => void generate(proposalId)}>
                <Sparkles />
                Tentar novamente
              </Button>
              <Link
                to={`/propostas/${proposalId}`}
                className={buttonVariants({ variant: 'outline' })}
              >
                Abrir proposta
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              A proposta foi salva sem conteúdo. Você pode gerar o texto depois.
            </p>
          </div>
        ) : (
          <form
            noValidate
            onSubmit={form.handleSubmit((values) => create.mutate(values))}
            className="grid items-start gap-6 @4xl:grid-cols-[minmax(0,1fr)_18rem]"
          >
            <div className="rounded-xl border bg-card">
              <FieldGroup className="p-6">
                <FormError message={create.isError ? errorMessage(create.error) : null} />
                <div className="grid gap-6 sm:grid-cols-2">
                  <Field data-invalid={!!errors.title}>
                    <FieldLabel htmlFor="title">Título</FieldLabel>
                    <Input
                      id="title"
                      placeholder="Site institucional com cardápio online"
                      aria-invalid={!!errors.title}
                      {...form.register('title')}
                    />
                    <FieldError errors={[errors.title]} />
                  </Field>
                  <Field data-invalid={!!errors.client_name}>
                    <FieldLabel htmlFor="client_name">Cliente</FieldLabel>
                    <Input
                      id="client_name"
                      placeholder="Padaria Pão Quente"
                      aria-invalid={!!errors.client_name}
                      {...form.register('client_name')}
                    />
                    <FieldError errors={[errors.client_name]} />
                  </Field>
                </div>
                <Field data-invalid={!!errors.briefing}>
                  <div className="flex items-baseline justify-between gap-4">
                    <FieldLabel htmlFor="briefing">Briefing</FieldLabel>
                    <span
                      className={cn(
                        'text-xs text-muted-foreground tabular-nums',
                        briefingLength > BRIEFING_MAX_LENGTH && 'text-destructive',
                      )}
                    >
                      {briefingLength.toLocaleString('pt-BR')} /{' '}
                      {BRIEFING_MAX_LENGTH.toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <Textarea
                    id="briefing"
                    placeholder={BRIEFING_PLACEHOLDER}
                    aria-invalid={!!errors.briefing}
                    className="max-h-[60vh] min-h-80 resize-y leading-6"
                    {...form.register('briefing')}
                  />
                  <FieldDescription>
                    A IA usa só o que estiver aqui e marca o que faltar como [A DEFINIR].
                  </FieldDescription>
                  <FieldError errors={[errors.briefing]} />
                </Field>
              </FieldGroup>
              <div className="flex justify-end gap-2 border-t bg-muted/30 px-6 py-4">
                <Link to="/propostas" className={buttonVariants({ variant: 'ghost' })}>
                  Cancelar
                </Link>
                <Button type="submit" disabled={create.isPending}>
                  {create.isPending ? <Spinner /> : <Sparkles />}
                  Gerar proposta
                </Button>
              </div>
            </div>

            <aside className="space-y-4 @4xl:sticky @4xl:top-20">
              <div className="rounded-xl border bg-card p-5">
                <h2 className="text-sm font-medium">Um bom briefing inclui</h2>
                <ul className="mt-3 space-y-2.5 text-sm text-muted-foreground">
                  {BRIEFING_TIPS.map((tip) => (
                    <li key={tip} className="flex gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border bg-linear-to-b from-primary/5 to-transparent p-5">
                <h2 className="flex items-center gap-2 text-sm font-medium">
                  <Sparkles className="size-4 text-primary" />O que a IA entrega
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Uma proposta em seções (resumo, escopo, cronograma, investimento e próximos
                  passos), sem inventar valores. Você revisa e edita antes de enviar.
                </p>
              </div>
            </aside>
          </form>
        )}
      </div>
    </AppShell>
  )
}
