#!/usr/bin/env node
// Surenka Flowly projekto vartotojui matomą tekstą (JSX tekstą, matomus atributus,
// klaidų ir būsenų pranešimus, index.html) su failo keliu ir eilutės numeriu.
// Kalbą vertina AI – skriptas tik randa kandidatus.
// Naudojimas: node skills/patikrink/scripts/patikrink.mjs [failas ar katalogas ...]

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, extname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const DEFAULT_TARGETS = ['index.html', 'src']
const EXTENSIONS = new Set(['.js', '.jsx', '.html'])

// Atributai, kurių reikšmę vartotojas mato arba girdi (ekrano skaitytuvas).
const VISIBLE_ATTRS = new Set([
  'placeholder', 'title', 'alt', 'label', 'aria-label', 'aria-description',
  'aria-placeholder', 'aria-valuetext', 'aria-roledescription',
])

// Techniniai atributai – jų reikšmės nerodomos vartotojui.
const HIDDEN_ATTRS = new Set([
  'className', 'class', 'type', 'name', 'autoComplete', 'key', 'id', 'htmlFor',
  'href', 'src', 'rel', 'role', 'method', 'viewBox', 'xmlns', 'd', 'fill',
  'opacity', 'charset', 'content', 'aria-hidden', 'aria-current', 'aria-labelledby',
  'aria-describedby', 'aria-live', 'value', 'min', 'max', 'step', 'lang', 'target',
])

// Kontekstas prieš eilutę, rodantis, kad ji bus parodyta vartotojui.
const VISIBLE_CONTEXT = /(Error|Message|Text|Label|Title|alert|confirm|prompt|toast|label|title|message|text|error)\s*[(:=]\s*\(?\s*$/

function collectFiles(target) {
  const path = resolve(ROOT, target)
  const stats = statSync(path)

  if (stats.isFile()) return EXTENSIONS.has(extname(path)) ? [path] : []

  return readdirSync(path)
    .filter((entry) => entry !== 'node_modules' && !entry.startsWith('.'))
    .flatMap((entry) => collectFiles(join(path, entry)))
}

// Pakeičia komentarus tarpais ir surenka string literalus (su eilute ir pozicija).
function scanScript(source) {
  const literals = []
  let masked = ''
  let line = 1
  let i = 0

  while (i < source.length) {
    const char = source[i]
    const next = source[i + 1]

    if (char === '/' && next === '/') {
      while (i < source.length && source[i] !== '\n') {
        masked += ' '
        i++
      }
      continue
    }

    if (char === '/' && next === '*') {
      masked += '  '
      i += 2
      while (i < source.length && !(source[i] === '*' && source[i + 1] === '/')) {
        if (source[i] === '\n') line++
        masked += source[i] === '\n' ? '\n' : ' '
        i++
      }
      masked += '  '
      i += 2
      continue
    }

    if (char === '"' || char === "'" || char === '`') {
      const start = i
      const startLine = line
      let text = ''
      i++

      while (i < source.length && source[i] !== char) {
        if (source[i] === '\n' && char !== '`') break
        if (source[i] === '\\') {
          text += source[i + 1] ?? ''
          i += 2
          continue
        }
        if (char === '`' && source[i] === '$' && source[i + 1] === '{') {
          let depth = 0
          while (i < source.length) {
            if (source[i] === '{') depth++
            if (source[i] === '}' && --depth === 0) break
            i++
          }
          text += '{…}'
          i++
          continue
        }
        if (source[i] === '\n') line++
        text += source[i]
        i++
      }

      // Neuždaryta kabutė eilutės gale – tai ne literalas, o JSX tekstas, pvz. Don't.
      if (source[i] !== char) {
        masked += source.slice(start, i)
        continue
      }

      i++
      masked += source.slice(start, i)
      literals.push({ line: startLine, start, text })
      continue
    }

    if (char === '\n') line++
    masked += char
    i++
  }

  return { literals, masked }
}

function attributeBefore(prefix) {
  const match = prefix.match(/([\w-]+)\s*=\s*\{?\s*$/)
  return match?.[1] ?? null
}

function isCodeLike(text) {
  const value = text.trim()

  if (!/\p{L}/u.test(value) || value.length < 2) return true
  if (/^(https?:|\.{0,2}\/|#)/.test(value)) return true
  // HTTP metodai, MIME tipai, datos formatai ir pan.: GET, application/json, {…}T00:00:00.
  if (/^[A-Z]+$/.test(value) || (!/\s/.test(value) && /[/:{}]/.test(value))) return true
  if (/\.(css|js|jsx|svg|png|json)$/.test(value)) return true
  // Vienas žodis mažąja raide, camelCase, kebab-case ar BEM klasė – tikėtina reikšmė kode.
  if (/^[a-z_$][\w$]*$/.test(value) && !/[^\x00-\x7F]/.test(value)) return true
  if (/^[\w$]+([-_]+[\w$]+)+$/.test(value) && !/\s/.test(value)) return true
  if (/^[\w-]+(\s+[\w-]+)*$/.test(value) && /__|--/.test(value)) return true

  return false
}

function findLiteralCandidates(file, source, scan) {
  const candidates = []

  for (const literal of scan.literals) {
    const lineStart = source.lastIndexOf('\n', literal.start - 1) + 1
    const prefix = scan.masked.slice(lineStart, literal.start)
    const attr = attributeBefore(prefix)

    if (/^\s*import\b|\bfrom\s*$|\brequire\(\s*$/.test(prefix)) continue
    if (attr && HIDDEN_ATTRS.has(attr)) continue
    // Palyginimai kode, pvz. event.key === "Escape" ar task.status === "Atlikta".
    if (/[!=]==?\s*$/.test(prefix)) continue

    const visibleAttr = attr && VISIBLE_ATTRS.has(attr)
    const visibleContext = VISIBLE_CONTEXT.test(prefix)

    if (!visibleAttr && !visibleContext && isCodeLike(literal.text)) continue
    if (!/\p{L}/u.test(literal.text)) continue
    // Tarpai tarp JSX elementų, pvz. {" "}.
    if (!literal.text.trim()) continue

    candidates.push({
      file,
      line: literal.line,
      kind: visibleAttr ? `atributas ${attr}` : 'eilutė kode',
      text: literal.text.trim(),
    })
  }

  return candidates
}

function insideLiteral(offset, literals) {
  return literals.some(
    (literal) => offset > literal.start && offset < literal.start + literal.text.length + 2,
  )
}

// JSX / HTML tekstas tarp žymų: >Tekstas< arba atskira teksto eilutė.
function findTextCandidates(file, masked, literals) {
  const candidates = []
  const lines = masked.split('\n')
  let offset = 0

  lines.forEach((content, index) => {
    const lineOffset = offset
    offset += content.length + 1

    for (const match of content.matchAll(/(?<![=-])>([^<>{}]*\p{L}[^<>{}]*)</gu)) {
      if (insideLiteral(lineOffset + match.index, literals)) continue
      candidates.push({ file, line: index + 1, kind: 'tekstas', text: match[1].trim() })
    }

    const trimmed = content.trim()
    if (!/^[^<>{}()=;"'`]*\p{L}[^<>{}()=;"'`]*$/u.test(trimmed)) return
    if (/^(return|else|break|continue|default|export|async|await)\b/.test(trimmed)) return

    const previous = lines.slice(0, index).reverse().find((line) => line.trim())?.trim() ?? ''
    const following = lines.slice(index + 1).find((line) => line.trim())?.trim() ?? ''

    if (previous.endsWith('>') || following.startsWith('<')) {
      candidates.push({ file, line: index + 1, kind: 'tekstas', text: trimmed })
    }
  })

  return candidates
}

function checkHtmlLang(file, source) {
  const match = source.match(/<html[^>]*\blang="([^"]*)"/)

  if (!match) {
    return [{ file, line: 1, kind: 'html lang', text: 'lang atributas nenurodytas' }]
  }
  if (match[1] === 'lt') return []

  const line = source.slice(0, match.index).split('\n').length
  return [{ file, line, kind: 'html lang', text: `lang="${match[1]}"` }]
}

const targets = process.argv.slice(2)
const files = (targets.length ? targets : DEFAULT_TARGETS).flatMap(collectFiles)
const results = []

for (const path of files) {
  const file = relative(ROOT, path)
  const source = readFileSync(path, 'utf8')

  if (extname(path) === '.html') {
    const masked = source.replace(/<!--[\s\S]*?-->/g, (comment) => comment.replace(/[^\n]/g, ' '))
    results.push(...checkHtmlLang(file, source))
    results.push(...findTextCandidates(file, masked, []))

    for (const match of masked.matchAll(/([\w-]+)="([^"]*)"/g)) {
      if (!VISIBLE_ATTRS.has(match[1]) || !/\p{L}/u.test(match[2])) continue
      const line = masked.slice(0, match.index).split('\n').length
      results.push({ file, line, kind: `atributas ${match[1]}`, text: match[2] })
    }
    continue
  }

  const scan = scanScript(source)
  results.push(...findLiteralCandidates(file, source, scan))
  if (extname(path) === '.jsx') results.push(...findTextCandidates(file, scan.masked, scan.literals))
}

results.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line)

let currentFile = ''
for (const result of results) {
  if (result.file !== currentFile) {
    currentFile = result.file
    console.log(`\n## ${currentFile}`)
  }
  console.log(`${String(result.line).padStart(4)} | ${result.kind.padEnd(22)} | ${result.text}`)
}

console.log(`\nIš viso: ${results.length} tekstų, ${files.length} failų.`)
