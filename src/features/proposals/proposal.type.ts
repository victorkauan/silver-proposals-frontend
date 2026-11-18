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

export type VersionSource = 'generated' | 'edited' | 'restored'

export type VersionSummary = {
  number: number
  source: VersionSource
  author_name: string | null
  content_chars: number
  created_at: string
}

export type VersionDetail = VersionSummary & { content: string }

export type VersionPage = {
  items: VersionSummary[]
  total: number
}

export type ShareLink = {
  id: string
  expires_at: string
  revoked_at: string | null
  created_at: string
  active: boolean
}

export type ShareLinkCreated = ShareLink & { token: string }
