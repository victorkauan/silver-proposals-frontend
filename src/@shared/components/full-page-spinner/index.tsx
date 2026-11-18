import { Spinner } from '@shared/components/ui/spinner'

export function FullPageSpinner() {
  return (
    <div
      className="flex min-h-svh items-center justify-center"
      role="status"
      aria-label="Carregando"
    >
      <Spinner className="size-6 text-muted-foreground" />
    </div>
  )
}
