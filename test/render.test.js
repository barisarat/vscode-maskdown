// Plain-Node tests for the pure render transform. No framework, no VS Code.
// Run with: npm test
const assert = require("assert")
const { renderMarkdownBody } = require("../out/render.js")

let passed = 0
function check(name, cond) {
  assert.ok(cond, "FAIL: " + name)
  console.log("PASS " + name)
  passed += 1
}

// --- fields card + inline mask + fence safety ------------------------------
const src = [
  "# Acme GmbH",
  "",
  "Contact: ||invoices@acme.example|| and normal text.",
  "",
  "::: fields",
  "Company: Acme GmbH",
  "Address: Hauptstr. 1, 10115 Berlin",
  "*IBAN: DE89 3704 0044 0532 0130 00",
  "*Account: acme-ops-77",
  ":::",
  "",
  "```txt",
  "this ||should not|| be masked (inside a fence)",
  "::: fields",
  "AlsoNot: masked",
  ":::",
  "```",
].join("\n")
const html = renderMarkdownBody(src)

check("inline mask rendered", html.includes('data-value="invoices@acme.example"'))
check("field card present", html.includes('<table class="fields">'))
check("normal row copyable", html.includes('data-value="Acme GmbH"'))
check("masked IBAN row", html.includes('data-value="DE89 3704 0044 0532 0130 00"'))
check("masked account row", html.includes('data-value="acme-ops-77"'))
check("fence: value NOT masked", !html.includes('data-value="should not"'))
check("fence: fields NOT a card", (html.match(/table class="fields"/g) || []).length === 1)
check("no leftover placeholder", !html.includes("xxfieldscardxx") && !html.includes("xxinlinemaskxx"))

// --- inline code span + escaping -------------------------------------------
const edge = renderMarkdownBody([
  "Use `git log ||nope||` here.",
  "",
  'Note: ||a"b<c>&d|| masked.',
].join("\n"))

check("inline-code || left literal", edge.includes("||nope||") && !edge.includes('data-value="nope"'))
check("special chars escaped in attr", edge.includes('data-value="a&quot;b&lt;c&gt;&amp;d"'))

console.log("\n" + passed + " checks passed.")
