// Render a sample note to a standalone HTML file you can open in any browser,
// to eyeball layout without VS Code. VS Code theme variables are given light
// fallbacks so it renders; the real extension inherits your editor theme.
// Run with: npm run preview  ->  writes preview.out.html
const fs = require("fs")
const path = require("path")
const { renderMarkdownBody } = require("../out/render.js")

const sample = [
  "# Acme GmbH - account info",
  "",
  "Shared inbox login is ||acme-support-77||.",
  "",
  "::: fields",
  "Company: Acme GmbH",
  "Address: Hauptstr. 1, 10115 Berlin",
  "*IBAN: DE89 3704 0044 0532 0130 00",
  "*Account: acme-ops-77",
  ":::",
  "",
  "## Notes",
  "",
  "- Regular markdown still works.",
  "- Code stays literal: `echo ||not-masked||`.",
].join("\n")

const body = renderMarkdownBody(sample)
const out = `<!doctype html><meta charset="utf-8">
<style>
  :root{
    --vscode-font-family:system-ui,sans-serif; --vscode-font-size:14px;
    --vscode-editor-foreground:#1f2328; --vscode-editor-background:#ffffff;
    --vscode-editor-font-family:ui-monospace,monospace;
    --vscode-editorWidget-border:#d0d7de; --vscode-textLink-foreground:#0969da;
    --vscode-textCodeBlock-background:#f6f8fa; --vscode-descriptionForeground:#656d76;
    --vscode-button-foreground:#fff; --vscode-button-background:#1f6feb; --vscode-button-hoverBackground:#388bfd;
    --vscode-editor-selectionBackground:#b6e3ff;
  }
  body{font-family:var(--vscode-font-family);color:var(--vscode-editor-foreground);padding:24px 32px;line-height:1.55}
  table.fields{width:auto;border-collapse:collapse}
  table.fields td{border-bottom:1px solid var(--vscode-editorWidget-border);padding:6px 12px 6px 0}
  table.fields td.fk{color:var(--vscode-descriptionForeground);padding-right:24px;white-space:nowrap}
  .copyable,.masked{display:inline-flex;align-items:center;gap:6px}
  .masked .dots{letter-spacing:2px;color:var(--vscode-descriptionForeground)}
  .masked .shown{display:none}.masked.revealed .dots{display:none}.masked.revealed .shown{display:inline}
  .copy,.reveal{font-size:.75em;padding:1px 6px;border:1px solid var(--vscode-editorWidget-border);border-radius:3px;background:transparent;color:var(--vscode-descriptionForeground);cursor:pointer}
  code{background:var(--vscode-textCodeBlock-background);padding:2px 4px;border-radius:4px}
</style>
<main>${body}</main>
<script>
document.querySelectorAll(".masked .reveal").forEach(b=>b.addEventListener("click",()=>{
  const s=b.closest(".masked"),v=s.querySelector(".shown");
  if(s.classList.toggle("revealed")){v.textContent=s.getAttribute("data-value");b.textContent="hide"}
  else{v.textContent="";b.textContent="reveal"}
}));
document.querySelectorAll(".copy").forEach(b=>b.addEventListener("click",()=>navigator.clipboard&&navigator.clipboard.writeText(b.getAttribute("data-value"))));
</script>`

const target = path.join(__dirname, "..", "preview.out.html")
fs.writeFileSync(target, out)
console.log("Wrote " + target)
