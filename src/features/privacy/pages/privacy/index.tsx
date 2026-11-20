import { ArrowLeft, Mail, ShieldCheck, X } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'

import { BrandMark } from '@shared/components/brand'
import { useSession } from '@features/auth/session.context'
import {
  PRIVACY_CONTACT,
  PRIVACY_SECTIONS,
  PRIVACY_UPDATED_AT,
  type PrivacySection,
} from '@features/privacy/privacy.content'

function Section({ section }: { section: PrivacySection }) {
  return (
    <section id={section.id} aria-labelledby={`${section.id}-title`} className="scroll-mt-20">
      <h2 id={`${section.id}-title`} className="text-lg font-semibold tracking-tight">
        {section.title}
      </h2>
      {section.table && (
        <div className="mt-4 overflow-x-auto rounded-lg border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs text-muted-foreground">
              <tr>
                {section.table.head.map((cell) => (
                  <th key={cell} scope="col" className="px-4 py-2.5 font-medium">
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {section.table.rows.map(([data, purpose]) => (
                <tr key={data}>
                  <td className="w-2/5 px-4 py-3 align-top font-medium">{data}</td>
                  <td className="px-4 py-3 align-top text-muted-foreground">{purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {section.paragraphs?.map((paragraph) => (
        <p key={paragraph} className="mt-3 leading-relaxed text-muted-foreground">
          {paragraph}
        </p>
      ))}
      {section.items && (
        <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed text-muted-foreground marker:text-foreground/40">
          {section.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </section>
  )
}

// Sign-up opens the notice in a new tab so the form keeps its data: there, closing the tab is the way back.
function useBackAction() {
  const { status } = useSession()
  const navigate = useNavigate()
  const [openedInNewTab] = useState(() => window.history.length <= 1)
  const fallback = status === 'authenticated' ? '/conta/dados' : '/cadastro'

  if (openedInNewTab) {
    return {
      label: 'Fechar',
      icon: X,
      onClick: () => {
        window.close()
        // Browsers keep the tab open when the user reached the page some other way.
        navigate(fallback)
      },
    }
  }
  return { label: 'Voltar', icon: ArrowLeft, onClick: () => navigate(-1) }
}

export function PrivacyPage() {
  const back = useBackAction()

  return (
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-6">
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight">
            <BrandMark className="size-7" />
            Silver Proposals
          </Link>
          <button
            type="button"
            onClick={back.onClick}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <back.icon className="size-4" />
            {back.label}
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-12 px-6 py-12 lg:grid-cols-[13rem_1fr]">
        <nav aria-label="Seções do aviso" className="hidden lg:block">
          <ol className="sticky top-24 space-y-1 text-sm">
            {PRIVACY_SECTIONS.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="block rounded-md px-2 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <article className="max-w-2xl">
          <div className="mb-10">
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <ShieldCheck className="size-3.5" />
              LGPD
            </span>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight">Aviso de privacidade</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Atualizado em {PRIVACY_UPDATED_AT}. Explica quais dados o Silver Proposals trata, por
              quê, por quanto tempo e como você exerce seus direitos.
            </p>
          </div>
          <div className="space-y-10">
            {PRIVACY_SECTIONS.map((section) => (
              <Section key={section.id} section={section} />
            ))}
          </div>
          <aside className="mt-12 flex items-start gap-3 rounded-lg border bg-muted/30 p-5 text-sm">
            <Mail className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <p className="text-muted-foreground">
              Dúvidas ou pedidos sobre seus dados:{' '}
              <a
                href={`mailto:${PRIVACY_CONTACT}`}
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                {PRIVACY_CONTACT}
              </a>
            </p>
          </aside>
        </article>
      </main>
    </div>
  )
}
