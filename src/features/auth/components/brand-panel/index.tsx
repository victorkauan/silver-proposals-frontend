import { Check, Sparkles } from 'lucide-react'

const scope = [
  'Site institucional com cardápio',
  'Loja virtual com retirada',
  'Painel para a equipe',
]

function Line({ width }: { width: string }) {
  return <div className="h-2 rounded-full bg-white/10" style={{ width }} />
}

export function BrandPanel() {
  return (
    <div className="relative hidden overflow-hidden bg-zinc-950 text-zinc-50 [--grid-line:rgb(255_255_255/0.06)] lg:flex lg:flex-col dark:border-l dark:border-white/10 dark:bg-zinc-900 dark:[--grid-line:rgb(255_255_255/0.09)]">
      <div
        aria-hidden
        className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
        style={{
          backgroundImage:
            'linear-gradient(to right, var(--grid-line) 1px, transparent 1px), linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(60%_45%_at_50%_0%,rgb(59_130_246/0.22),transparent)]"
      />
      <div className="relative flex flex-1 items-center justify-center p-12">
        <div className="w-full max-w-md rounded-xl border border-white/10 bg-zinc-900/80 p-6 shadow-2xl backdrop-blur dark:border-white/15 dark:bg-zinc-800/70">
          <div className="mb-5 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-400/30 bg-blue-500/10 px-2.5 py-1 text-xs text-blue-300">
              <Sparkles className="size-3" />
              Gerando com IA
            </span>
            <span className="font-mono text-xs text-zinc-500">v1</span>
          </div>
          <p className="text-lg font-semibold tracking-tight">Proposta comercial</p>
          <p className="mb-5 text-sm text-zinc-400">Padaria Pão Dourado</p>
          <p className="mb-2 text-xs font-medium tracking-wide text-zinc-500 uppercase">Resumo</p>
          <div className="mb-5 space-y-2">
            <Line width="100%" />
            <Line width="92%" />
            <Line width="64%" />
          </div>
          <p className="mb-2 text-xs font-medium tracking-wide text-zinc-500 uppercase">Escopo</p>
          <ul className="mb-5 space-y-2 text-sm text-zinc-300">
            {scope.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <Check className="size-3.5 text-zinc-500" />
                {item}
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between border-t border-white/10 pt-4 text-sm">
            <span className="text-zinc-400">Investimento</span>
            <span className="rounded-md bg-white/5 px-2 py-0.5 font-mono text-xs text-zinc-300">
              [A DEFINIR]
            </span>
          </div>
        </div>
      </div>
      <div className="relative p-12 pt-0">
        <p className="text-xl font-semibold tracking-tight text-balance">
          Do briefing à proposta pronta em segundos.
        </p>
        <p className="mt-2 max-w-md text-sm text-zinc-400">
          Geração com IA, edição com histórico de versões e um link seguro para o seu cliente.
        </p>
      </div>
    </div>
  )
}
