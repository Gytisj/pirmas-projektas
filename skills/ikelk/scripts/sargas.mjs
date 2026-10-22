#!/usr/bin/env node
// Sargas: neleidžia `git commit` ir `git push`, kol UI tekstai nepatikrinti per /patikrink.
// Tikrinami tie patys failai kaip /patikrink: index.html ir src/ (.js, .jsx, .html).
//
// Naudojimas:
//   node skills/ikelk/scripts/sargas.mjs --patvirtinti   – įrašo, kad dabartiniai failai patikrinti
//   node skills/ikelk/scripts/sargas.mjs                 – Claude Code PreToolUse hookas (JSON per stdin)

import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, extname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const TARGETS = ['index.html', 'src']
const EXTENSIONS = new Set(['.js', '.jsx', '.html'])
const GIT_COMMAND = /\bgit\b[^;&|\n]*\s(commit|push)\b/

const git = (...args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' })
const sha = (content) => createHash('sha256').update(content).digest('hex')
const isChecked = (path) =>
  EXTENSIONS.has(extname(path)) &&
  !path.split('/').some((part) => part === 'node_modules' || part.startsWith('.'))

const MARKER = resolve(ROOT, git('rev-parse', '--git-dir').trim(), 'flowly-patikrink.json')

function collectFiles(target) {
  const path = resolve(ROOT, target)
  if (!existsSync(path)) return []
  if (statSync(path).isFile()) return [relative(ROOT, path)]

  return readdirSync(path).flatMap((entry) => collectFiles(join(path, entry)))
}

// Failai darbiniame kataloge (commit) arba paskutiniame commite (push).
function snapshot(source) {
  if (source === 'HEAD') {
    return git('ls-tree', '-r', '--name-only', 'HEAD', '--', ...TARGETS)
      .split('\n')
      .filter((path) => path && isChecked(path))
      .map((path) => [path, sha(git('show', `HEAD:${path}`))])
  }

  return TARGETS.flatMap(collectFiles)
    .filter(isChecked)
    .map((path) => [path, sha(readFileSync(resolve(ROOT, path)))])
}

if (process.argv.includes('--patvirtinti')) {
  const files = Object.fromEntries(snapshot('worktree'))
  writeFileSync(MARKER, JSON.stringify(files, null, 2))
  console.log(`Patvirtinta: ${Object.keys(files).length} failų patikrinti per /patikrink.`)
  process.exit(0)
}

let input = ''
for await (const chunk of process.stdin) input += chunk

const command = JSON.parse(input || '{}').tool_input?.command ?? ''
const action = command.match(GIT_COMMAND)?.[1]
if (!action) process.exit(0)

const approved = existsSync(MARKER) ? JSON.parse(readFileSync(MARKER, 'utf8')) : {}
const unchecked = snapshot(action === 'push' ? 'HEAD' : 'worktree')
  .filter(([path, hash]) => approved[path] !== hash)
  .map(([path]) => path)

if (!unchecked.length) process.exit(0)

console.error(
  [
    `Užblokuota: git ${action} negalimas, kol UI tekstai nepatikrinti per /patikrink.`,
    `Nepatikrinti ar pakeisti po patikros failai: ${unchecked.join(', ')}.`,
    'Naudok /ikelk: paleisk /patikrink, sutvarkyk visus ne lietuviškus tekstus,',
    'tada `node skills/ikelk/scripts/sargas.mjs --patvirtinti` ir kartok komandą.',
  ].join('\n'),
)
process.exit(2)
