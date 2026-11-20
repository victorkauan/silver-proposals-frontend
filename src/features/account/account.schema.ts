import { z } from 'zod'

const password = z.string().min(1, 'Informe sua senha.').max(128, 'Use no máximo 128 caracteres.')

export const profileSchema = z.object({
  name: z.string().trim().min(1, 'Informe seu nome.').max(120, 'Use no máximo 120 caracteres.'),
})

export const emailSchema = z.object({
  email: z.email('Informe um e-mail válido.'),
  password,
})

export const deleteAccountSchema = z.object({
  password,
  confirmation: z.literal('EXCLUIR', { error: 'Digite EXCLUIR para confirmar.' }),
})

export type ProfileInput = z.infer<typeof profileSchema>
export type EmailInput = z.infer<typeof emailSchema>
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>
