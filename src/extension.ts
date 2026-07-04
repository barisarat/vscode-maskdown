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
}

export function deactivate() {}

class NoteMarkdownViewerProvider implements vscode.CustomTextEditorProvider {
  async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel
  ): Promise<void> {
    webviewPanel.webview.options = {
      enableScripts: true
    }

    const updateWebview = () => {
      webviewPanel.webview.html = this.getHtml(document)
    }

    const changeSubscription = vscode.workspace.onDidChangeTextDocument(event => {
      if (event.document.uri.toString() === document.uri.toString()) {
        updateWebview()
      }
    })

    webviewPanel.onDidDispose(() => {
      changeSubscription.dispose()
    })

    webviewPanel.webview.onDidReceiveMessage(async message => {
      if (message.command === "editSource") {
        await vscode.commands.executeCommand("vscode.openWith", document.uri, "default", {
          preview: false
        })
      }

      if (message.command === "copySource") {
        await vscode.env.clipboard.writeText(document.getText())
        vscode.window.showInformationMessage("Note source copied.")
      }

      if (message.command === "copyValue") {
        await vscode.env.clipboard.writeText(String(message.value ?? ""))
        vscode.window.showInformationMessage("Copied.")
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

  .toolbar {
    position: sticky;
    top: 0;
    z-index: 10;
    display: flex;
    gap: 8px;
    padding: 8px 0 16px 0;
    background: var(--vscode-editor-background);
    border-bottom: 1px solid var(--vscode-editorWidget-border);
    margin-bottom: 24px;
  }

  button {
    color: var(--vscode-button-foreground);
    background: var(--vscode-button-background);
    border: none;
    border-radius: 4px;
    padding: 6px 10px;
    cursor: pointer;
  }

  button:hover {
    background: var(--vscode-button-hoverBackground);
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
    gap: 6px;
  }

  .masked .dots {
    letter-spacing: 2px;
    color: var(--vscode-descriptionForeground);
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

  .copy,
  .reveal {
    font-size: 0.75em;
    padding: 1px 6px;
    background: transparent;
    color: var(--vscode-descriptionForeground);
    border: 1px solid var(--vscode-editorWidget-border);
    border-radius: 3px;
    opacity: 0.55;
  }

  .copyable:hover .copy,
  .masked:hover .copy,
  .masked:hover .reveal,
  .copy:focus,
  .reveal:focus {
    opacity: 1;
  }

  .copy:hover,
  .reveal:hover {
    color: var(--vscode-button-foreground);
    background: var(--vscode-button-background);
    border-color: var(--vscode-button-background);
  }
</style>
</head>
<body>
  <div class="toolbar">
    <button id="editSource">Edit Source</button>
    <button id="copySource">Copy Source</button>
  </div>

  <main>
    ${rendered}
  </main>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi()

    document.getElementById("editSource").addEventListener("click", () => {
      vscode.postMessage({ command: "editSource" })
    })

    document.getElementById("copySource").addEventListener("click", () => {
      vscode.postMessage({ command: "copySource" })
    })

    document.querySelectorAll(".copy").forEach(button => {
      button.addEventListener("click", () => {
        vscode.postMessage({ command: "copyValue", value: button.getAttribute("data-value") })
      })
    })

    document.querySelectorAll(".masked .reveal").forEach(button => {
      button.addEventListener("click", () => {
        const span = button.closest(".masked")
        const shown = span.querySelector(".shown")
        const revealed = span.classList.toggle("revealed")
        if (revealed) {
          shown.textContent = span.getAttribute("data-value")
          button.textContent = "hide"
        } else {
          shown.textContent = ""
          button.textContent = "reveal"
        }
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
