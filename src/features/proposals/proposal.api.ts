import { requestJson } from '@shared/api/http.client'
import type { ProposalInput } from '@features/proposals/proposal.schema'
import type { ProposalDetail, ProposalPage } from '@features/proposals/proposal.type'

export const LIST_LIMIT = 100

export const proposalKeys = {
  all: ['proposals'] as const,
  list: () => [...proposalKeys.all, 'list'] as const,
  detail: (id: string) => [...proposalKeys.all, 'detail', id] as const,
}

export const proposalApi = {
  list: () => requestJson<ProposalPage>(`/proposals?limit=${LIST_LIMIT}`),
  get: (id: string) => requestJson<ProposalDetail>(`/proposals/${encodeURIComponent(id)}`),
  create: (input: ProposalInput) =>
    requestJson<ProposalDetail>('/proposals', { method: 'POST', body: input }),
}
