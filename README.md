# Note Markdown Viewer

A simple VS Code extension that opens `.note.md` files in a clean rendered Markdown view.

It is made for people who want Markdown notes to behave more like readable notes, without the default VS Code Markdown preview behavior where double-clicking the preview jumps back to the source editor.

## Why this exists

VS Code's built-in Markdown preview is useful, but it can be annoying for daily note usage.

For example, when copying text from the preview, double-clicking a word can jump to the Markdown source editor instead of behaving like a normal read view.

This extension provides a separate note viewer for files ending with:

```txt
.note.md
```

So you can keep normal `.md` files unchanged, while opening `.note.md` files in a cleaner copy-friendly viewer.

## Features

- Opens `.note.md` files in a rendered Markdown view
- Keeps normal `.md` files untouched
- Supports headings, links, lists, code blocks, tables, blockquotes, and horizontal rules
- Allows normal text selection and copying from the rendered view
- Includes an **Edit Source** button to open the raw Markdown file
- Includes a **Copy Source** button to copy the full Markdown source

## Usage

Create a Markdown note file ending with `.note.md`.

Examples:

```txt
commands.note.md
links.note.md
company-info.note.md
project-notes.note.md
```

Open the file in VS Code. It should open with **Note Markdown Viewer**.

## Example note

````markdown
# Command Reference

## Audio Conversion

Convert an `.m4b` file to `.mp3`.

```bash
ffmpeg -i input.m4b -map_metadata 0 -vn -c:a libmp3lame -qscale:a 2 output.mp3
```

## Links

- https://code.visualstudio.com/
- https://marketplace.visualstudio.com/
````

## Editing notes

The rendered view is intended for reading and copying.

To edit the file, click:

```txt
Edit Source
```

This opens the same `.note.md` file as normal Markdown text.

## Copying notes

To copy the full Markdown source, click:

```txt
Copy Source
```

To copy a specific value or word, select it directly in the rendered view.

## Recommended setup

Use `.note.md` for notes where you mostly want to read and copy.

Use normal `.md` for Markdown files where you mainly edit source text.

Example folder structure:

```txt
notes/
  commands.note.md
  links.note.md
  references.note.md
  drafts.md
```

## File association

The extension registers a custom editor for:

```txt
*.note.md
```

If a `.note.md` file does not open with the viewer automatically, right-click the editor tab and choose:

```txt
Reopen Editor With...
Note Markdown Viewer
```

You can also configure it manually in `.vscode/settings.json`:

```json
{
  "workbench.editorAssociations": {
    "*.note.md": "noteMdViewer.viewer"
  }
}
```

## Limitations

This is a small viewer extension. It does not try to replace a full note app.

It does not currently include:

- backlinks
- graph view
- note search database
- live WYSIWYG editing
- synchronization

The goal is simple: render `.note.md` files in a clean copy-friendly view inside VS Code.

## License

MIT
