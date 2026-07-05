# Maskdown

A simple VS Code extension that opens `.mask.md` files in a clean rendered Markdown view.

It is made for people who want Markdown notes to behave more like readable notes, without the default VS Code Markdown preview behavior where double-clicking the preview jumps back to the source editor.

## Why this exists

VS Code's built-in Markdown preview is useful, but it can be annoying for daily note usage.

For example, when copying text from the preview, double-clicking a word can jump to the Markdown source editor instead of behaving like a normal read view.

This extension provides a separate note viewer for files ending with:

```txt
.mask.md
```

So you can keep normal `.md` files unchanged, while opening `.mask.md` files in a cleaner copy-friendly viewer.

> **Backward compatibility.** Files ending in `.note.md` still open in the viewer as well, so
> notes created before the rename keep working. `.mask.md` is the preferred extension going forward.

## Features

- Opens `.mask.md` files in a rendered Markdown view
- Keeps normal `.md` files untouched
- Supports headings, links, lists, code blocks, tables, blockquotes, and horizontal rules
- Allows normal text selection and copying from the rendered view
- Includes an **Edit Source** button to open the raw Markdown file
- Includes a **Copy Source** button to copy the full Markdown source
- Renders `::: fields` blocks as clean **reference cards** with a copy button on every row
- Supports **maskable values** with `||value||`, shown as dots with reveal and copy buttons

## Reference cards and masked values

This viewer is built for keeping copy-paste reference notes: account names, addresses,
customer numbers, IBANs. Two small additions on top of plain Markdown make that pleasant.

### Reference cards

Wrap `key: value` lines in a `::: fields` block to render a compact card where every
value has a one-click copy button. Prefix a row with `*` to mask it.

```txt
::: fields
Company: Acme GmbH
Address: Hauptstr. 1, 10115 Berlin
*IBAN: DE89 3704 0044 0532 0130 00
*Account: acme-ops-77
:::
```

Masked rows render as dots. Click **reveal** to show the value, or **copy** to copy it
without ever showing it on screen.

### Inline masked values

Anywhere in a note, wrap a value in `||double bars||` to mask it inline:

```txt
Support login is ||acme-support-77|| for the shared inbox.
```

> **Note on masking.** Masking is a display convenience for reading and screen-sharing
> notes in front of others. It is **not encryption** - the value is still stored as
> plain text in the `.mask.md` file and can be read in any editor. Use it for things you
> just don't want on screen (account numbers, addresses), not for real secrets or
> passwords.

## Usage

Create a Markdown note file ending with `.mask.md`.

Examples:

```txt
commands.mask.md
links.mask.md
company-info.mask.md
project-notes.mask.md
```

Open the file in VS Code. It should open with **Maskdown**.

A ready-made example lives at [`examples/company-info.mask.md`](examples/company-info.mask.md) -
open it to see reference cards and masked values in action.

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

This opens the same `.mask.md` file as normal Markdown text.

## Copying notes

To copy the full Markdown source, click:

```txt
Copy Source
```

To copy a specific value or word, select it directly in the rendered view.

## Recommended setup

Use `.mask.md` for notes where you mostly want to read and copy.

Use normal `.md` for Markdown files where you mainly edit source text.

Example folder structure:

```txt
notes/
  commands.mask.md
  links.mask.md
  references.mask.md
  drafts.md
```

## File association

The extension registers a custom editor for:

```txt
*.mask.md
```

If a `.mask.md` file does not open with the viewer automatically, right-click the editor tab and choose:

```txt
Reopen Editor With...
Maskdown
```

You can also configure it manually in `.vscode/settings.json`:

```json
{
  "workbench.editorAssociations": {
    "*.mask.md": "noteMdViewer.viewer"
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

The goal is simple: render `.mask.md` files in a clean copy-friendly view inside VS Code.

## License

MIT
