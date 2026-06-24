import type { Card, ColumnDef, Retro, Vote } from '../types'

const countVotes = (votes: Vote[], cardId: string) =>
  votes.filter(v => v.card_id === cardId).length

const sortedColumnCards = (cards: Card[], votes: Vote[], columnKey: string) =>
  cards
    .filter(c => c.column_key === columnKey)
    .sort((a, b) => countVotes(votes, b.id) - countVotes(votes, a.id))

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleString('fr-FR')
  } catch {
    return iso
  }
}

/** Build the Markdown export string for a retro. */
export function buildMarkdown(
  retro: Retro,
  columns: ColumnDef[],
  cards: Card[],
  votes: Vote[],
  nameByToken: Record<string, string>
): string {
  const lines: string[] = []
  lines.push(`# ${retro.title}`)
  lines.push('')
  lines.push(`- Date : ${formatDate(retro.created_at)}`)
  lines.push(`- Type : ${retro.type}`)
  lines.push('')

  for (const col of columns) {
    lines.push(`## ${col.label}`)
    const colCards = sortedColumnCards(cards, votes, col.key)
    if (colCards.length === 0) {
      lines.push('_(aucune carte)_')
    } else {
      for (const c of colCards) {
        const n = countVotes(votes, c.id)
        const who =
          retro.show_names && nameByToken[c.author_token]
            ? ` — _${nameByToken[c.author_token]}_`
            : ''
        lines.push(`- ${c.content} (${n} vote${n > 1 ? 's' : ''})${who}`)
      }
    }
    lines.push('')
  }
  return lines.join('\n')
}

const slugify = (s: string) =>
  (s || 'retro').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

/** Trigger a download of the retro as a .md file. */
export function downloadMarkdown(
  retro: Retro,
  columns: ColumnDef[],
  cards: Card[],
  votes: Vote[],
  nameByToken: Record<string, string>
) {
  const md = buildMarkdown(retro, columns, cards, votes, nameByToken)
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${slugify(retro.title)}.md`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

/**
 * Export the retro as PDF by opening a print-friendly window.
 * The user picks "Enregistrer en PDF" in the browser print dialog.
 */
export function exportPdf(
  retro: Retro,
  columns: ColumnDef[],
  cards: Card[],
  votes: Vote[],
  nameByToken: Record<string, string>
) {
  const sections = columns
    .map(col => {
      const colCards = sortedColumnCards(cards, votes, col.key)
      const items =
        colCards.length === 0
          ? '<li><em>(aucune carte)</em></li>'
          : colCards
              .map(c => {
                const n = countVotes(votes, c.id)
                const who =
                  retro.show_names && nameByToken[c.author_token]
                    ? ` <em>— ${escapeHtml(nameByToken[c.author_token])}</em>`
                    : ''
                return `<li>${escapeHtml(c.content)} <strong>(${n} vote${
                  n > 1 ? 's' : ''
                })</strong>${who}</li>`
              })
              .join('')
      return `<section><h2>${escapeHtml(col.label)}</h2><ul>${items}</ul></section>`
    })
    .join('')

  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<title>${escapeHtml(retro.title)}</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 2rem; color: #111; }
  h1 { margin-bottom: .25rem; }
  .meta { color: #666; margin-bottom: 1.5rem; }
  h2 { border-bottom: 1px solid #ddd; padding-bottom: .25rem; margin-top: 1.5rem; }
  ul { margin: .5rem 0 1rem; }
  li { margin: .25rem 0; }
</style></head><body>
<h1>${escapeHtml(retro.title)}</h1>
<div class="meta">Date : ${escapeHtml(formatDate(retro.created_at))} · Type : ${escapeHtml(
    retro.type
  )}</div>
${sections}
<script>window.onload = function () { window.print(); }</script>
</body></html>`

  const w = window.open('', '_blank')
  if (!w) {
    alert('Impossible d’ouvrir la fenêtre d’impression (popup bloqué ?).')
    return
  }
  w.document.write(html)
  w.document.close()
}
