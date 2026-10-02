// MEMORY.md keeps a "## Server State Snapshot" section that the
// server-state-snapshot oneshot rewrites at every startup. Only that section
// is replaced: everything before it and any later "## " section (notes the
// agent added after the snapshot) is kept.

export const SNAPSHOT_HEADING = '## Server State Snapshot'

/** Index of the next level-2 heading ("## x", not "### x") at or after `from`. */
function nextH2(text: string, from: number): number {
  const re = /^## /gm
  re.lastIndex = from
  const m = re.exec(text)
  return m ? m.index : -1
}

/**
 * Return `existing` with its snapshot section replaced by `block` (which must
 * start with SNAPSHOT_HEADING). Without a snapshot section, `block` is
 * appended. Fenced code inside the snapshot is skipped when looking for the
 * section's end, so command output that happens to start with "## " cannot
 * cut it short.
 */
export function replaceSnapshot(existing: string, block: string): string {
  const start = existing.search(/^## Server State Snapshot[ \t]*$/m)
  const newBlock = block.trimEnd() + '\n'
  if (start < 0) {
    const before = existing.trimEnd()
    return before ? before + '\n\n' + newBlock : newBlock
  }

  // Find the end of the snapshot section, ignoring "## " inside ``` fences.
  let pos = start + SNAPSHOT_HEADING.length
  let end = -1
  while (pos <= existing.length) {
    const fence = existing.indexOf('\n```', pos)
    const h2 = nextH2(existing, pos)
    if (h2 < 0) break
    if (fence >= 0 && fence < h2) {
      const close = existing.indexOf('\n```', fence + 4)
      if (close < 0) break
      pos = close + 4
      continue
    }
    end = h2
    break
  }

  const before = existing.slice(0, start).trimEnd()
  const after = end >= 0 ? existing.slice(end).trimStart() : ''
  return (
    (before ? before + '\n\n' : '') + newBlock + (after ? '\n' + after : '')
  )
}
