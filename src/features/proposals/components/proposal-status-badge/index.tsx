import { Badge } from '@shared/components/ui/badge'
import { PROPOSAL_STATUS_LABEL } from '@features/proposals/proposal-status.constant'
import type { ProposalStatus } from '@features/proposals/proposal.type'

const VARIANT = {
  draft: 'outline',
  generated: 'secondary',
  edited: 'secondary',
  shared: 'default',
  archived: 'outline',
} as const

export function ProposalStatusBadge({ status }: { status: ProposalStatus }) {
  return <Badge variant={VARIANT[status]}>{PROPOSAL_STATUS_LABEL[status]}</Badge>
}
