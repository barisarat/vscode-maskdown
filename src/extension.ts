import * as vscode from "vscode"
import { renderMarkdownBody } from "./render"

export function activate(context: vscode.ExtensionContext) {
  const provider = new NoteMarkdownViewerProvider()

  context.subscriptions.push(
    vscode.window.registerCustomEditorProvider(
      "noteMdViewer.viewer",
      provider,
      {
        webviewOptions: {
          retainContextWhenHidden: true
        },
        supportsMultipleEditorsPerDocument: true
      }
    )
  )

  context.subscriptions.push(
    vscode.commands.registerCommand("noteMdViewer.openAsNote", async (uri?: vscode.Uri) => {
      const targetUri = uri ?? vscode.window.activeTextEditor?.document.uri

      if (!targetUri) {
        vscode.window.showInformationMessage("Open a .note.md file first.")
        return
      }

      await vscode.commands.executeCommand("vscode.openWith", targetUri, "noteMdViewer.viewer")
    })
  )

  // Editor title-bar actions. They operate on the note whose viewer is active,
  // tracked by the provider (a custom editor is not an activeTextEditor).
  context.subscriptions.push(
    vscode.commands.registerCommand("noteMdViewer.editSource", async () => {
      const uri = provider.activeDocument?.uri
      if (!uri) return
      await vscode.commands.executeCommand("vscode.openWith", uri, "default", { preview: false })
    })
  )

  context.subscriptions.push(
    vscode.commands.registerCommand("noteMdViewer.copySource", async () => {
      const document = provider.activeDocument
      if (!document) return
      await vscode.env.clipboard.writeText(document.getText())
      vscode.window.showInformationMessage("Note source copied.")
    })
  )
}

export function deactivate() {}

class NoteMarkdownViewerProvider implements vscode.CustomTextEditorProvider {
  // The note whose viewer currently has focus; used by the title-bar commands.
  public activeDocument: vscode.TextDocument | undefined

  async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel
  ): Promise<void> {
    webviewPanel.webview.options = {
      enableScripts: true
    }

    this.activeDocument = document

    const updateWebview = () => {
      webviewPanel.webview.html = this.getHtml(document)
    }

    const changeSubscription = vscode.workspace.onDidChangeTextDocument(event => {
      if (event.document.uri.toString() === document.uri.toString()) {
        updateWebview()
      }
    })

    const viewStateSubscription = webviewPanel.onDidChangeViewState(() => {
      if (webviewPanel.active) {
        this.activeDocument = document
      }
    })

    webviewPanel.onDidDispose(() => {
      changeSubscription.dispose()
      viewStateSubscription.dispose()
      if (this.activeDocument === document) {
        this.activeDocument = undefined
      }
    })

    webviewPanel.webview.onDidReceiveMessage(async message => {
      if (message.command === "copyValue") {
        await vscode.env.clipboard.writeText(String(message.value ?? ""))
      }
    })

    updateWebview()
  }

  private getHtml(document: vscode.TextDocument): string {
    const nonce = getNonce()
    const rendered = renderMarkdownBody(document.getText())

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Note Markdown Viewer</title>
<style>
  body {
    font-family: var(--vscode-font-family);
    font-size: var(--vscode-font-size);
    color: var(--vscode-editor-foreground);
    background: var(--vscode-editor-background);
    padding: 24px 32px;
    line-height: 1.55;
  }

  h1 {
    font-size: 1.8em;
    margin-top: 0;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--vscode-editorWidget-border);
  }

  h2 {
    font-size: 1.35em;
    margin-top: 32px;
    padding-bottom: 6px;
    border-bottom: 1px solid var(--vscode-editorWidget-border);
  }

  h3 {
    font-size: 1.1em;
    margin-top: 24px;
  }

  p {
    margin: 10px 0;
  }

  a {
    color: var(--vscode-textLink-foreground);
  }

  code {
    font-family: var(--vscode-editor-font-family);
    background: var(--vscode-textCodeBlock-background);
    padding: 2px 4px;
    border-radius: 4px;
  }

  pre {
    background: var(--vscode-textCodeBlock-background);
    padding: 14px;
    border-radius: 6px;
    overflow-x: auto;
  }

  pre code {
    padding: 0;
    background: transparent;
  }

  table {
    border-collapse: collapse;
    margin: 16px 0;
    width: 100%;
  }

  th,
  td {
    border: 1px solid var(--vscode-editorWidget-border);
    padding: 8px 10px;
    text-align: left;
    vertical-align: top;
  }

  blockquote {
    border-left: 4px solid var(--vscode-textLink-foreground);
    margin-left: 0;
    padding-left: 16px;
    opacity: 0.9;
  }

  hr {
    border: none;
    border-top: 1px solid var(--vscode-editorWidget-border);
    margin: 24px 0;
  }

  ::selection {
    background: var(--vscode-editor-selectionBackground);
  }

  /* Reference card */
  table.fields {
    width: auto;
    min-width: 320px;
    max-width: 100%;
  }

  table.fields td {
    border: none;
    border-bottom: 1px solid var(--vscode-editorWidget-border);
    padding: 6px 12px 6px 0;
  }

  table.fields tr:last-child td {
    border-bottom: none;
  }

  table.fields td.fk {
    color: var(--vscode-descriptionForeground);
    white-space: nowrap;
    padding-right: 24px;
  }

  table.fields td.fv {
    font-family: var(--vscode-editor-font-family);
  }

  /* Copyable + masked values */
  .copyable,
  .masked {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .masked .dots {
    letter-spacing: 2px;
    color: var(--vscode-descriptionForeground);
    user-select: none;
  }

  .masked .shown {
    display: none;
    font-family: var(--vscode-editor-font-family);
  }

  .masked.revealed .dots {
    display: none;
  }

  .masked.revealed .shown {
    display: inline;
  }

  /* Quiet icon buttons: hidden until the value is hovered or focused */
  .icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    padding: 0;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: var(--vscode-descriptionForeground);
    cursor: pointer;
    opacity: 0;
    transition: opacity 90ms ease, background-color 90ms ease, color 90ms ease;
  }

  .copyable:hover .icon-btn,
  .masked:hover .icon-btn,
  .copyable:focus-within .icon-btn,
  .masked:focus-within .icon-btn,
  .icon-btn:focus-visible {
    opacity: 1;
  }

  .icon-btn:hover {
    color: var(--vscode-foreground);
    background: var(--vscode-toolbar-hoverBackground);
  }

  .icon-btn:focus-visible {
    outline: 1px solid var(--vscode-focusBorder);
    outline-offset: -1px;
  }

  .icon-btn svg {
    display: block;
  }

  /* Copy button: swap copy glyph for a check briefly after a copy */
  .icon-btn .i-check {
    display: none;
    color: var(--vscode-charts-green, var(--vscode-testing-iconPassed, #3fb950));
  }

  .icon-btn.copied {
    opacity: 1;
  }

  .icon-btn.copied .i-copy {
    display: none;
  }

  .icon-btn.copied .i-check {
    display: inline-flex;
  }

  /* Reveal button: eye vs eye-off follows the revealed state */
  .icon-btn.reveal .i-eye-off {
    display: none;
  }

  .masked.revealed .icon-btn.reveal .i-eye {
    display: none;
  }

  .masked.revealed .icon-btn.reveal .i-eye-off {
    display: inline-flex;
  }
</style>
</head>
<body>
  <main>
    ${rendered}
  </main>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi()

    document.querySelectorAll(".copy").forEach(button => {
      button.addEventListener("click", () => {
        vscode.postMessage({ command: "copyValue", value: button.getAttribute("data-value") })
        button.classList.add("copied")
        button.setAttribute("title", "Copied")
        window.setTimeout(() => {
          button.classList.remove("copied")
          button.setAttribute("title", "Copy value")
        }, 1200)
      })
    })

    document.querySelectorAll(".masked .reveal").forEach(button => {
      button.addEventListener("click", () => {
        const span = button.closest(".masked")
        const shown = span.querySelector(".shown")
        const revealed = span.classList.toggle("revealed")
        shown.textContent = revealed ? span.getAttribute("data-value") : ""
      })
    })
  </script>
</body>
</html>`
  }
}

function getNonce() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let text = ""

  for (let i = 0; i < 32; i += 1) {
    text += chars.charAt(Math.floor(Math.random() * chars.length))
  }

  return text
}
