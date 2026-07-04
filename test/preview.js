// Render a sample note to a standalone HTML file you can open in any browser,
// to eyeball layout without VS Code. VS Code theme variables are given light
// fallbacks so it renders; the real extension inherits your editor theme.
// The two global actions (Edit/Copy Source) live in VS Code's editor title bar,
// so they do not appear in this body-only preview.
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
  "- Hover a value to reveal its copy button.",
].join("\n")

const body = renderMarkdownBody(sample)
const out = `<!doctype html><meta charset="utf-8">
<style>
  :root{
    --vscode-font-family:system-ui,sans-serif; --vscode-font-size:14px;
    --vscode-editor-foreground:#1f2328; --vscode-foreground:#1f2328; --vscode-editor-background:#ffffff;
    --vscode-editor-font-family:ui-monospace,monospace;
    --vscode-editorWidget-border:#d0d7de; --vscode-textLink-foreground:#0969da;
    --vscode-textCodeBlock-background:#f6f8fa; --vscode-descriptionForeground:#656d76;
    --vscode-toolbar-hoverBackground:#e8ebef; --vscode-focusBorder:#0969da;
    --vscode-charts-green:#1a7f37; --vscode-editor-selectionBackground:#b6e3ff;
  }
  body{font-family:var(--vscode-font-family);color:var(--vscode-editor-foreground);padding:24px 32px;line-height:1.55}
  table.fields{width:auto;border-collapse:collapse}
  table.fields td{border-bottom:1px solid var(--vscode-editorWidget-border);padding:6px 12px 6px 0}
  table.fields td.fk{color:var(--vscode-descriptionForeground);padding-right:24px;white-space:nowrap}
  .copyable,.masked{display:inline-flex;align-items:center;gap:4px}
  .masked .dots{letter-spacing:2px;color:var(--vscode-descriptionForeground);user-select:none}
  .masked .shown{display:none}.masked.revealed .dots{display:none}.masked.revealed .shown{display:inline}
  .icon-btn{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;padding:0;border:none;border-radius:4px;background:transparent;color:var(--vscode-descriptionForeground);cursor:pointer;opacity:0;transition:opacity 90ms ease,background-color 90ms ease,color 90ms ease}
  .copyable:hover .icon-btn,.masked:hover .icon-btn,.copyable:focus-within .icon-btn,.masked:focus-within .icon-btn,.icon-btn:focus-visible{opacity:1}
  .icon-btn:hover{color:var(--vscode-foreground);background:var(--vscode-toolbar-hoverBackground)}
  .icon-btn svg{display:block}
  .icon-btn .i-check{display:none;color:var(--vscode-charts-green)}
  .icon-btn.copied{opacity:1}.icon-btn.copied .i-copy{display:none}.icon-btn.copied .i-check{display:inline-flex}
  .icon-btn.reveal .i-eye-off{display:none}
  .masked.revealed .icon-btn.reveal .i-eye{display:none}
  .masked.revealed .icon-btn.reveal .i-eye-off{display:inline-flex}
  code{background:var(--vscode-textCodeBlock-background);padding:2px 4px;border-radius:4px}
</style>
<main>${body}</main>
<script>
document.querySelectorAll(".masked .reveal").forEach(b=>b.addEventListener("click",()=>{
  const s=b.closest(".masked"),v=s.querySelector(".shown");
  const r=s.classList.toggle("revealed"); v.textContent=r?s.getAttribute("data-value"):"";
}));
document.querySelectorAll(".copy").forEach(b=>b.addEventListener("click",()=>{
  if(navigator.clipboard) navigator.clipboard.writeText(b.getAttribute("data-value"));
  b.classList.add("copied"); setTimeout(()=>b.classList.remove("copied"),1200);
}));
</script>`

const target = path.join(__dirname, "..", "preview.out.html")
fs.writeFileSync(target, out)
console.log("Wrote " + target)
