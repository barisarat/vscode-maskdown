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

// Inline codicon-style glyphs (16px, currentColor). Kept as SVG so the webview
// needs no icon font, no extra CSP font-src, and no bundled assets.
const ICON = {
  copy:
    '<svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor" aria-hidden="true"><path d="M4 4V2.5A1.5 1.5 0 0 1 5.5 1h8A1.5 1.5 0 0 1 15 2.5v8a1.5 1.5 0 0 1-1.5 1.5H12v1.5A1.5 1.5 0 0 1 10.5 15h-8A1.5 1.5 0 0 1 1 13.5v-8A1.5 1.5 0 0 1 2.5 4H4Zm1 0h5.5A1.5 1.5 0 0 1 12 5.5V11h1.5a.5.5 0 0 0 .5-.5v-8a.5.5 0 0 0-.5-.5h-8a.5.5 0 0 0-.5.5V4Zm-2.5 1a.5.5 0 0 0-.5.5v8a.5.5 0 0 0 .5.5h8a.5.5 0 0 0 .5-.5v-8a.5.5 0 0 0-.5-.5h-8Z"/></svg>',
  check:
    '<svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor" aria-hidden="true"><path d="M13.485 3.515a.75.75 0 0 1 0 1.06l-6.5 6.5a.75.75 0 0 1-1.06 0l-3-3a.75.75 0 1 1 1.06-1.06L6.455 9.44l5.97-5.97a.75.75 0 0 1 1.06 0Z"/></svg>',
  eye:
    '<svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor" aria-hidden="true"><path d="M8 3C4.5 3 1.7 5.1.6 8c1.1 2.9 3.9 5 7.4 5s6.3-2.1 7.4-5C14.3 5.1 11.5 3 8 3Zm0 8.5A3.5 3.5 0 1 1 8 4.5a3.5 3.5 0 0 1 0 7Zm0-1.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/></svg>',
  eyeOff:
    '<svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor" aria-hidden="true"><path d="M2.1 1.4 1 2.5l2.2 2.2C2 5.6 1.1 6.7.6 8c1.1 2.9 3.9 5 7.4 5 1.4 0 2.7-.3 3.8-.9l2.3 2.3 1.1-1.1L2.1 1.4ZM8 11.5a3.5 3.5 0 0 1-3.3-4.7l1.2 1.2a2 2 0 0 0 2.6 2.6l1.2 1.2c-.5.3-1.1.5-1.7.5Zm0-7c3.5 0 6.3 2.1 7.4 5-.4 1-1 1.9-1.8 2.6l-2.3-2.3a3.5 3.5 0 0 0-4.2-4.2L5.6 4.1C6.4 3.7 7.2 3.5 8 3.5Z"/></svg>',
}

function copyButton(attr: string): string {
  return (
    `<button class="icon-btn copy" type="button" data-value="${attr}" title="Copy value" aria-label="Copy value">` +
    `<span class="i-copy">${ICON.copy}</span><span class="i-check">${ICON.check}</span>` +
    `</button>`
  )
}

// A masked value: dots by default, click reveal (eye) to show, copy always works
// without revealing. The raw value rides in data-value (plaintext on purpose;
// this is anti-shoulder-surf, not secrecy).
function renderMask(value: string): string {
  const attr = escapeHtml(value)
  return (
    `<span class="masked" data-value="${attr}">` +
    `<span class="dots">••••••••</span>` +
    `<span class="shown"></span>` +
    `<button class="icon-btn reveal" type="button" title="Reveal / hide" aria-label="Reveal or hide value">` +
    `<span class="i-eye">${ICON.eye}</span><span class="i-eye-off">${ICON.eyeOff}</span>` +
    `</button>` +
    copyButton(attr) +
    `</span>`
  )
}

function renderCopyable(value: string): string {
  const attr = escapeHtml(value)
  return (
    `<span class="copyable">` +
    `<span class="val">${escapeHtml(value)}</span>` +
    copyButton(attr) +
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
