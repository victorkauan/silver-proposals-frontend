export type ProposalRole = 'owner' | 'editor' | 'viewer'

export type ProposalSummary = {
  id: string
  title: string
  client_name: string
  role: ProposalRole
  archived_at: string | null
  updated_at: string
}

export type ProposalDetail = ProposalSummary & {
  briefing: string
  content: string
  version: number
  created_at: string
}

export type ProposalPage = {
  items: ProposalSummary[]
  total: number
}
