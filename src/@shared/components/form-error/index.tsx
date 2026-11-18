import { CircleAlert } from 'lucide-react'

import { Alert, AlertDescription } from '@shared/components/ui/alert'

export function FormError({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <Alert variant="destructive">
      <CircleAlert />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}
