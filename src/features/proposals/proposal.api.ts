import { requestJson } from '@shared/api/http.client'
import type { ProposalInput } from '@features/proposals/proposal.schema'
import type {
  ProposalDetail,
  ProposalPage,
  ShareLink,
  ShareLinkCreated,
  SharedProposal,
  VersionDetail,
  VersionPage,
} from '@features/proposals/proposal.type'

export const LIST_LIMIT = 100
export const CONTENT_MAX_LENGTH = 200_000

export const proposalKeys = {
  all: ['proposals'] as const,
  dashboard: () => [...proposalKeys.all, 'dashboard'] as const,
  list: () => [...proposalKeys.all, 'list'] as const,
  detail: (id: string) => [...proposalKeys.all, 'detail', id] as const,
  versions: (id: string) => [...proposalKeys.all, 'versions', id] as const,
  version: (id: string, number: number) => [...proposalKeys.versions(id), number] as const,
  shareLinks: (id: string) => [...proposalKeys.all, 'share-links', id] as const,
  shared: (token: string) => ['shared-proposal', token] as const,
}

const path = (id: string) => `/proposals/${encodeURIComponent(id)}`

export const proposalApi = {
  dashboard: () => [...proposalKeys.all, 'dashboard'] as const,
  list: () => requestJson<ProposalPage>(`/proposals?limit=${LIST_LIMIT}`),
  get: (id: string) => requestJson<ProposalDetail>(path(id)),
  create: (input: ProposalInput) =>
    requestJson<ProposalDetail>('/proposals', { method: 'POST', body: input }),
  saveContent: (id: string, content: string, baseVersion: number) =>
    requestJson<ProposalDetail>(`${path(id)}/content`, {
      method: 'PUT',
      body: { content, base_version: baseVersion },
    }),
  versions: (id: string) => requestJson<VersionPage>(`${path(id)}/versions?limit=${LIST_LIMIT}`),
  version: (id: string, number: number) =>
    requestJson<VersionDetail>(`${path(id)}/versions/${number}`),
  restore: (id: string, number: number) =>
    requestJson<ProposalDetail>(`${path(id)}/versions/${number}/restore`, { method: 'POST' }),
  shareLinks: (id: string) => requestJson<ShareLink[]>(`${path(id)}/share-links`),
  createShareLink: (id: string, expiresInDays: number) =>
    requestJson<ShareLinkCreated>(`${path(id)}/share-links`, {
      method: 'POST',
      body: { expires_in_days: expiresInDays },
    }),
  revokeShareLink: (id: string, linkId: string) =>
    requestJson<void>(`${path(id)}/share-links/${encodeURIComponent(linkId)}`, {
      method: 'DELETE',
    }),
}

export const publicApi = {
  get: (token: string) =>
    requestJson<SharedProposal>('/public/proposals/resolve', {
      method: 'POST',
      body: { token },
      auth: false,
    }),
}

export function shareUrl(token: string): string {
  return `${window.location.origin}/p/${token}`
}
