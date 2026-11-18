import { z } from 'zod'

const name = (required: string) =>
  z.string().trim().min(1, required).max(200, 'Use no máximo 200 caracteres.')

export const BRIEFING_MAX_LENGTH = 10_000

export const proposalSchema = z.object({
  title: name('Informe o título.'),
  client_name: name('Informe o cliente.'),
  briefing: z
    .string()
    .trim()
    .min(1, 'Descreva o briefing para a IA gerar a proposta.')
    .max(BRIEFING_MAX_LENGTH, 'Use no máximo 10.000 caracteres.'),
})

export type ProposalInput = z.infer<typeof proposalSchema>
