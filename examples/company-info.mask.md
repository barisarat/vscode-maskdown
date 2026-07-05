# Acme GmbH - reference sheet

A sample `.note.md` to see the viewer in action. Open it with **Maskdown**
(it should open that way automatically). Hover a value to copy it; click
**reveal** on a masked value to show it, or **copy** to copy without revealing.

## Company details

::: fields
Company: Acme GmbH
Contact: invoices@acme.example
Address: Hauptstr. 1, 10115 Berlin
Customer no: ACME-2024-0077
*IBAN: DE89 3704 0044 0532 0130 00
*BIC: COBADEFFXXX
*Portal account: acme-ops-77
:::

Rows marked with `*` in the source are masked. Everything renders as plain
Markdown in the file - open **Edit Source** to see it.

## Inline masking

Anywhere in prose you can mask a value inline: the shared inbox login is
||acme-support-77|| and the door code is ||4417||. The dots hide it on screen
while you read or screen-share; copy still works.

## Regular Markdown still works

- Lists, **bold**, *italic*, and [links](https://code.visualstudio.com/)
- Tables, blockquotes, and horizontal rules render normally

Code stays literal - masking does **not** touch it:

```bash
# the || below is shown as-is, not masked
grep -E "a||b" file.txt
```

> Masking is display-only, for reading and screen-sharing in front of others.
> It is not encryption - values are stored as plain text in the file. Keep real
> passwords out of notes.
