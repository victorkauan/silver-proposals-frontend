import type { ProposalStatus } from '@features/proposals/proposal.type'

export const PROPOSAL_STATUS_LABEL: Record<ProposalStatus, string> = {
  draft: 'Rascunho',
  generated: 'Gerada',
  edited: 'Editada',
  shared: 'Compartilhada',
  archived: 'Arquivada',
}
