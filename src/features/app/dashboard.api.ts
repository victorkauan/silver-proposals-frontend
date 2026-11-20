import { requestJson } from '@shared/api/http.client'
import type { ProposalRole } from '@features/proposals/proposal.type'

export type ProposalStatus = 'draft' | 'generated' | 'edited' | 'shared' | 'archived'
export type ActivityKind = 'generated' | 'edited' | 'restored' | 'link_created' | 'link_revoked'

export type DashboardSummary = {
  proposal_counts: Record<ProposalStatus, number>
  generations_last_30_days: number
  active_link_count: number
  expiring_link_count: number
  recent_proposals: Array<{
    id: string
    title: string
    client_name: string
    role: ProposalRole
    status: ProposalStatus
    updated_at: string
  }>
  active_links: Array<{
    id: string
    proposal_id: string
    proposal_title: string
    expires_at: string
  }>
  recent_activity: Array<{
    event_id: string
    kind: ActivityKind
    proposal_id: string
    proposal_title: string
    occurred_at: string
    version: number | null
  }>
}

export const getDashboard = () => requestJson<DashboardSummary>('/dashboard/summary')
