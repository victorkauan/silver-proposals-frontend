import { useMutation } from '@tanstack/react-query'
import { ShieldCheck } from 'lucide-react'
import { Link } from 'react-router'
import { toast } from 'sonner'

import { errorMessage } from '@shared/api/error-message.helper'
import { Button } from '@shared/components/ui/button'
import { Spinner } from '@shared/components/ui/spinner'
import { accountApi } from '@features/account/account.api'
import { useSession } from '@features/auth/session.context'

export function PrivacyBanner() {
  const { user, setUser } = useSession()
  const accept = useMutation({
    mutationFn: accountApi.acceptPrivacy,
    onSuccess: setUser,
    onError: (error) => toast.error(errorMessage(error)),
  })
  if (!user || user.privacy_up_to_date) return null

  return (
    <div
      role="region"
      aria-label="Aviso de privacidade"
      className="flex flex-wrap items-center gap-3 border-b bg-blue-500/5 px-6 py-3 text-sm"
    >
      <ShieldCheck className="size-4 shrink-0 text-primary" />
      <p className="flex-1">
        Atualizamos nosso{' '}
        <Link to="/privacidade" className="font-medium underline underline-offset-4">
          aviso de privacidade
        </Link>
        . Leia e confirme para continuar usando a plataforma normalmente.
      </p>
      <Button size="sm" onClick={() => accept.mutate()} disabled={accept.isPending}>
        {accept.isPending && <Spinner />}
        Li e aceito
      </Button>
    </div>
  )
}
