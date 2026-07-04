import MarkdownIt from "markdown-it"

// ---------------------------------------------------------------------------
// Pure rendering layer. Kept free of the `vscode` module so it can be unit
// tested from plain Node. The webview chrome lives in extension.ts.
// ---------------------------------------------------------------------------

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

// A masked value: dots by default, click "reveal" to show, "copy" always works
// without revealing. The raw value rides in data-value (plaintext on purpose;
// this is anti-shoulder-surf, not secrecy).
function renderMask(value: string): string {
  const attr = escapeHtml(value)
  return (
    `<span class="masked" data-value="${attr}">` +
    `<span class="dots">••••••••</span>` +
    `<span class="shown"></span>` +
    `<button class="reveal" type="button" title="Reveal / hide">reveal</button>` +
    `<button class="copy" type="button" data-value="${attr}" title="Copy value">copy</button>` +
    `</span>`
  )
}

function renderCopyable(value: string): string {
  const attr = escapeHtml(value)
  return (
    `<span class="copyable">` +
    `<span class="val">${escapeHtml(value)}</span>` +
    `<button class="copy" type="button" data-value="${attr}" title="Copy value">copy</button>` +
    `</span>`
  )
}

// A `::: fields` block -> reference card. Each line is `key: value`; a leading
// `*` masks that row. Every row is copyable.
function renderFieldsCard(lines: string[]): string {
  const rows = lines
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      let masked = false
      if (line.startsWith("*")) {
        masked = true
        line = line.slice(1).trim()
      }
      const idx = line.indexOf(":")
      const key = idx >= 0 ? line.slice(0, idx).trim() : ""
      const value = idx >= 0 ? line.slice(idx + 1).trim() : line
      return { key, value, masked }
    })

  const body = rows
    .map(row => {
      const valueCell = row.masked ? renderMask(row.value) : renderCopyable(row.value)
      return (
        `<tr>` +
        `<td class="fk">${escapeHtml(row.key)}</td>` +
        `<td class="fv">${valueCell}</td>` +
        `</tr>`
      )
    })
    .join("")

  return `<table class="fields">${body}</table>`
}

const CARD_TOKEN = "xxfieldscardxx"
const MASK_TOKEN = "xxinlinemaskxx"

// Replace inline `||value||` in a stretch of prose, leaving inline code spans
// (`` `...` ``) untouched. Rendered mask HTML is stashed in `masks`; a plain
// alphanumeric placeholder goes into the text so it survives markdown-it and is
// swapped back after rendering.
function maskProse(text: string, masks: string[]): string {
  return text.replace(/\|\|([^|\n]+?)\|\|/g, (_match, value: string) => {
    const idx = masks.length
    masks.push(renderMask(value))
    return `${MASK_TOKEN}${idx}xx`
  })
}

function maskLine(line: string, masks: string[]): string {
  const codeSpan = /`+[^`]*`+/g
  let result = ""
  let last = 0
  let match: RegExpExecArray | null

  while ((match = codeSpan.exec(line)) !== null) {
    result += maskProse(line.slice(last, match.index), masks)
    result += match[0]
    last = match.index + match[0].length
  }
  result += maskProse(line.slice(last), masks)
  return result
}

// Single fence-aware pass: pull out `::: fields` blocks, apply inline masks to
// ordinary prose, and leave fenced code samples completely untouched.
function preprocess(src: string): { text: string; cards: string[]; masks: string[] } {
  const lines = src.split("\n")
  const out: string[] = []
  const cards: string[] = []
  const masks: string[] = []

  let inFence = false
  let fenceMarker = ""
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const fence = line.match(/^(\s*)(```|~~~)/)

    if (fence) {
      const marker = fence[2]
      if (!inFence) {
        inFence = true
        fenceMarker = marker
      } else if (line.trim().startsWith(fenceMarker)) {
        inFence = false
      }
      out.push(line)
      i += 1
      continue
    }

    if (inFence) {
      out.push(line)
      i += 1
      continue
    }

    if (line.trim() === "::: fields") {
      const body: string[] = []
      i += 1
      while (i < lines.length && lines[i].trim() !== ":::") {
        body.push(lines[i])
        i += 1
      }
      i += 1 // skip closing :::
      const idx = cards.length
      cards.push(renderFieldsCard(body))
      out.push("")
      out.push(`${CARD_TOKEN}${idx}xx`)
      out.push("")
      continue
    }

    out.push(maskLine(line, masks))
    i += 1
  }

  return { text: out.join("\n"), cards, masks }
}

const markdown = new MarkdownIt({ html: false, linkify: true, breaks: true })

// Rendered inner HTML for a note body. Exported so the transform can be tested
// without a running VS Code host.
export function renderMarkdownBody(src: string): string {
  const { text, cards, masks } = preprocess(src)
  let html = markdown.render(text)

  cards.forEach((card, idx) => {
    const token = `${CARD_TOKEN}${idx}xx`
    html = html.split(`<p>${token}</p>`).join(card).split(token).join(card)
  })

  masks.forEach((mask, idx) => {
    html = html.split(`${MASK_TOKEN}${idx}xx`).join(mask)
  })

  return html
}
