import * as vscode from "vscode"
import MarkdownIt from "markdown-it"

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
  private readonly markdown: MarkdownIt

  constructor() {
    this.markdown = new MarkdownIt({
      html: false,
      linkify: true,
      breaks: true
    })
  }

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
    })

    updateWebview()
  }

  private getHtml(document: vscode.TextDocument): string {
    const nonce = getNonce()
    const rendered = this.markdown.render(document.getText())

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
