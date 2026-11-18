import type { ComponentProps, ElementType } from 'react'
import ReactMarkdown, { type Components, type ExtraProps } from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { cn } from '@shared/helpers/cn.helper'
import { PLACEHOLDER, sectionId } from '@features/proposals/markdown.helper'

type HastNode = {
  type: string
  tagName?: string
  value?: string
  properties?: Record<string, unknown>
  children?: HastNode[]
}

function splitPlaceholders(node: HastNode): HastNode[] {
  if (node.type !== 'text' || !node.value?.includes(PLACEHOLDER)) return [node]
  return node.value.split(PLACEHOLDER).flatMap((part, index) => [
    ...(index > 0
      ? [
          {
            type: 'element',
            tagName: 'mark',
            properties: { dataPlaceholder: '' },
            children: [{ type: 'text', value: PLACEHOLDER }],
          },
        ]
      : []),
    ...(part ? [{ type: 'text', value: part }] : []),
  ])
}

// Gives each level-2 heading the same id the table of contents uses, and marks the AI's [A DEFINIR] gaps.
function rehypeProposal() {
  return (tree: HastNode) => {
    let sections = 0
    const walk = (node: HastNode) => {
      if (node.tagName === 'h2') {
        node.properties = { ...node.properties, id: sectionId(sections++) }
      }
      if (!node.children || ['code', 'pre', 'mark'].includes(node.tagName ?? '')) return
      node.children = node.children.flatMap(splitPlaceholders)
      node.children.forEach(walk)
    }
    walk(tree)
  }
}

function styled<T extends ElementType>(Tag: T, className: string) {
  return function Styled({
    node: _node,
    className: own,
    ...props
  }: ComponentProps<T> & ExtraProps) {
    const Component = Tag as ElementType
    return <Component className={cn(className, own)} {...props} />
  }
}

// react-markdown never renders raw HTML from the source, so AI output cannot inject markup.
const components: Components = {
  h1: styled('h1', 'mb-6 text-3xl font-semibold tracking-tight text-balance'),
  h2: styled(
    'h2',
    'mt-10 mb-4 scroll-mt-20 border-b pb-2 text-xl font-semibold tracking-tight first:mt-0',
  ),
  h3: styled('h3', 'mt-7 mb-2 text-base font-semibold'),
  p: styled('p', 'my-4 leading-7 text-pretty'),
  ul: styled('ul', 'my-4 ml-6 list-disc space-y-1.5 marker:text-muted-foreground'),
  ol: styled('ol', 'my-4 ml-6 list-decimal space-y-1.5 marker:text-muted-foreground'),
  li: styled('li', 'pl-1 leading-7'),
  strong: styled('strong', 'font-semibold'),
  a: ({ node: _node, ...props }) => (
    <a
      className="font-medium text-primary underline underline-offset-4"
      target="_blank"
      rel="noreferrer"
      {...props}
    />
  ),
  blockquote: styled(
    'blockquote',
    'my-6 border-l-2 border-primary/40 pl-4 text-muted-foreground italic',
  ),
  code: styled('code', 'rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]'),
  pre: styled(
    'pre',
    'my-4 overflow-x-auto rounded-lg bg-muted p-4 [&_code]:bg-transparent [&_code]:p-0',
  ),
  table: ({ node: _node, ...props }) => (
    <div className="my-6 overflow-x-auto rounded-lg border">
      <table className="w-full border-collapse text-sm" {...props} />
    </div>
  ),
  thead: styled('thead', 'bg-muted/50'),
  th: styled('th', 'border-b px-4 py-2.5 text-left font-medium'),
  td: styled('td', 'border-b px-4 py-2.5 align-top [tr:last-child_&]:border-b-0'),
  hr: () => <hr className="my-8" />,
  mark: styled(
    'mark',
    'rounded bg-amber-500/15 px-1 py-0.5 font-mono text-[0.8em] font-medium text-amber-700 ring-1 ring-amber-500/25 dark:text-amber-400',
  ),
}

export function MarkdownView({ content, className }: { content: string; className?: string }) {
  return (
    <div className={cn('text-[15px] text-foreground', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeProposal]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
