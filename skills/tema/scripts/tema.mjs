#!/usr/bin/env node
// Keičia Flowly akcento spalvą ir fonų atspalvį src/index.css faile.
// Naudojimas: node skills/tema/scripts/tema.mjs <spalva | #hex | numatyta>

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const CSS_PATH = resolve(dirname(fileURLToPath(import.meta.url)), '../../../src/index.css')
const DARK_MARKER = '@media (prefers-color-scheme: dark)'
const WHITE = [255, 255, 255]
const MIN_TEXT = 4.5
const MIN_BUTTON = 3

const COLORS = [
  { name: 'violetinė', stems: ['violet', 'purpur', 'purple'], h: 272, s: 95 },
  { name: 'oranžinė', stems: ['oranz', 'orang'], h: 25, s: 95 },
  { name: 'žalia', stems: ['zal', 'green'], h: 142, s: 70 },
  { name: 'mėlyna', stems: ['melyn', 'blue'], h: 217, s: 91 },
  { name: 'raudona', stems: ['raudon', 'red'], h: 0, s: 84 },
  { name: 'rožinė', stems: ['roz', 'pink'], h: 330, s: 81 },
  { name: 'geltona', stems: ['gelton', 'yellow'], h: 45, s: 93 },
  { name: 'žydra', stems: ['zydr', 'turk', 'cyan'], h: 189, s: 85 },
  { name: 'indigo', stems: ['indig'], h: 239, s: 84 },
]

// Originalios Flowly reikšmės. Fonai atspalvinami nuo jų, o „numatyta“ jas grąžina.
const ORIGINAL = {
  light: {
    accent: '#aa3bff',
    'accent-bg': 'rgba(170, 59, 255, 0.1)',
    'accent-border': 'rgba(170, 59, 255, 0.5)',
    border: '#e5e4e7',
    'code-bg': '#f4f3ec',
    'card-bg': '#14141c',
    'card-border': '#292936',
    'field-bg': '#1b1b24',
    'field-bg-hover': '#24242f',
    'field-border': '#30303d',
    'field-border-hover': '#3a3a48',
  },
  dark: {
    accent: '#c084fc',
    'accent-bg': 'rgba(192, 132, 252, 0.15)',
    'accent-border': 'rgba(192, 132, 252, 0.5)',
    bg: '#16171d',
    border: '#2e303a',
    'code-bg': '#1f2028',
  },
}

const ACCENT_VARS = ['accent', 'accent-bg', 'accent-border']
const SURFACE_VARS = {
  light: ['border', 'code-bg', 'card-bg', 'card-border', 'field-bg', 'field-bg-hover', 'field-border', 'field-border-hover'],
  dark: ['bg', 'border', 'code-bg'],
}
// Šie kintamieji apibrėžti tik :root bloke, todėl galioja abiem temoms.
const BOTH_MODES = new Set(['card-bg', 'card-border', 'field-bg', 'field-bg-hover', 'field-border', 'field-border-hover'])
const MODES = { light: 'šviesi', dark: 'tamsi' }

function fail(message) {
  console.error(message)
  console.error(`\nGalimos spalvos: ${COLORS.map((c) => c.name).join(', ')}, #hex arba numatyta.`)
  process.exit(1)
}

const normalize = (text) =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

function parseHex(hex) {
  let value = hex.replace('#', '')
  if (value.length === 3) value = [...value].map((ch) => ch + ch).join('')
  return [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16))
}

const toHex = (rgb) => '#' + rgb.map((v) => v.toString(16).padStart(2, '0')).join('')

function hslToRgb(h, s, l) {
  s /= 100
  l /= 100
  const k = (n) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))
  return [f(0), f(8), f(4)].map((v) => Math.round(v * 255))
}

function rgbToHsl([r, g, b]) {
  ;[r, g, b] = [r / 255, g / 255, b / 255]
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  const l = (max + min) / 2
  if (d === 0) return { h: 0, s: 0, l: l * 100 }
  const s = d / (1 - Math.abs(2 * l - 1))
  let h
  if (max === r) h = ((g - b) / d) % 6
  else if (max === g) h = (b - r) / d + 2
  else h = (r - g) / d + 4
  return { h: (h * 60 + 360) % 360, s: s * 100, l: l * 100 }
}

// Pakeičia tik atspalvį (hue) – sotis ir šviesumas lieka originalūs.
function tint(hex, h) {
  const { s, l } = rgbToHsl(parseHex(hex))
  return toHex(hslToRgb(h, s, l))
}

function luminance(rgb) {
  const [r, g, b] = rgb.map((v) => {
    v /= 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const mix = (fg, alpha, bg) => fg.map((v, i) => Math.round(v * alpha + bg[i] * (1 - alpha)))

const alphaOf = (value, fallback) => Number(value?.match(/,\s*([\d.]+)\s*\)/)?.[1] ?? fallback)

const rgba = ([r, g, b], alpha) => `rgba(${r}, ${g}, ${b}, ${alpha})`

// Ieško ryškiausio atspalvio, kuris tekstui užtikrina ≥ 4.5:1 kontrastą
// ant fono ir ant akcento fono, o baltam mygtuko tekstui – bent 3:1.
function pickAccent(h, s, bg, tintAlpha) {
  const readable = []
  for (let l = 0; l <= 100; l += 0.5) {
    const rgb = hslToRgb(h, s, l)
    if (contrast(rgb, bg) >= MIN_TEXT && contrast(rgb, mix(rgb, tintAlpha, bg)) >= MIN_TEXT) {
      readable.push(rgb)
    }
  }
  const withButton = readable.filter((rgb) => contrast(WHITE, rgb) >= MIN_BUTTON)
  return withButton.at(-1) ?? readable[0]
}

const readVar = (block, name) => block.match(new RegExp(`--${name}:\\s*([^;]+);`))?.[1].trim()

const writeVar = (block, name, value) =>
  block.replace(new RegExp(`(--${name}:\\s*)[^;]+;`), `$1${value};`)

// --- Pagrindinė eiga ---

const input = process.argv.slice(2).join(' ')
if (!input) fail('Nenurodyta spalva. Pvz.: /tema oranžinė')

const css = readFileSync(CSS_PATH, 'utf8')
const split = css.indexOf(DARK_MARKER)
if (split === -1) fail(`Nerastas „${DARK_MARKER}“ blokas faile src/index.css.`)

const blocks = { light: css.slice(0, split), dark: css.slice(split) }
const varsOf = (mode) => [...ACCENT_VARS, ...SURFACE_VARS[mode]]
const oldValues = {}
for (const mode of Object.keys(MODES)) {
  oldValues[mode] = Object.fromEntries(varsOf(mode).map((name) => [name, readVar(blocks[mode], name)]))
  const missing = [...varsOf(mode), 'bg', 'text'].filter((name) => !readVar(blocks[mode], name))
  if (missing.length) {
    fail(`Faile src/index.css (${MODES[mode]} tema) trūksta: ${missing.map((n) => `--${n}`).join(', ')}.`)
  }
}

const key = normalize(input)
let label
let newValues

if (['numatyta', 'numatyt', 'originali', 'default'].includes(key)) {
  label = 'numatyta (originali Flowly)'
  newValues = ORIGINAL
} else {
  let hue
  if (/^#?([0-9a-f]{3}|[0-9a-f]{6})$/.test(key)) {
    hue = rgbToHsl(parseHex(key))
    label = `#${key.replace('#', '')}`
  } else {
    const color = COLORS.find((c) => c.stems.some((stem) => key.startsWith(stem)))
    if (!color) fail(`Nežinoma spalva: „${input}“.`)
    hue = color
    label = color.name
  }
  // Pilkai spalvai atspalvio nėra – fonai lieka originalūs.
  const tintFonts = hue.s >= 5

  newValues = {}
  for (const mode of Object.keys(MODES)) {
    const surfaces = Object.fromEntries(
      SURFACE_VARS[mode].map((name) => [
        name,
        tintFonts ? tint(ORIGINAL[mode][name], hue.h) : ORIGINAL[mode][name],
      ]),
    )
    const bg = parseHex(surfaces.bg ?? readVar(blocks[mode], 'bg'))
    const bgAlpha = alphaOf(oldValues[mode]['accent-bg'], mode === 'dark' ? 0.15 : 0.1)
    const borderAlpha = alphaOf(oldValues[mode]['accent-border'], 0.5)
    const accent = pickAccent(hue.h, hue.s, bg, bgAlpha)
    newValues[mode] = {
      accent: toHex(accent),
      'accent-bg': rgba(accent, bgAlpha),
      'accent-border': rgba(accent, borderAlpha),
      ...surfaces,
    }
  }
}

let updated = ''
for (const mode of Object.keys(MODES)) {
  let block = blocks[mode]
  for (const name of varsOf(mode)) block = writeVar(block, name, newValues[mode][name])
  updated += block
}

const changed = updated !== css
if (changed) writeFileSync(CSS_PATH, updated)

// --- Ataskaita ---

const mark = (ratio, min) => `${ratio.toFixed(2)}:1 ${ratio >= min ? '✓' : '⚠'}`
const lines = [
  `Tema: ${label}${changed ? '' : ' (reikšmės nepasikeitė)'}`,
  'Pakeistas failas: src/index.css',
  '',
  '| Kintamasis | Tema | Sena reikšmė | Nauja reikšmė |',
  '| --- | --- | --- | --- |',
]
for (const mode of Object.keys(MODES)) {
  for (const name of varsOf(mode)) {
    const modeLabel = BOTH_MODES.has(name) ? 'abi' : MODES[mode]
    lines.push(`| --${name} | ${modeLabel} | ${oldValues[mode][name]} | ${newValues[mode][name]} |`)
  }
}

lines.push(
  '',
  '| Kontrastas | Tema | Senas | Naujas |',
  '| --- | --- | --- | --- |',
)
for (const mode of Object.keys(MODES)) {
  const text = parseHex(readVar(blocks[mode], 'text'))
  const checks = [
    ['Akcentas ant fono', (s) => contrast(s.accent, s.bg), MIN_TEXT],
    ['Akcentas ant akcento fono', (s) => contrast(s.accent, mix(s.accent, s.alpha, s.bg)), MIN_TEXT],
    ['Baltas tekstas ant akcento', (s) => contrast(WHITE, s.accent), MIN_BUTTON],
    ['Pilkas tekstas ant fono', (s) => contrast(text, s.bg), MIN_TEXT],
  ]
  const states = [oldValues[mode], newValues[mode]].map((values) => ({
    accent: parseHex(values.accent),
    alpha: alphaOf(values['accent-bg'], 0.1),
    bg: parseHex(values.bg ?? readVar(blocks[mode], 'bg')),
  }))
  for (const [title, fn, min] of checks) {
    const [before, after] = states.map((s) => mark(fn(s), min))
    lines.push(`| ${title} | ${MODES[mode]} | ${before} | ${after} |`)
  }
}

console.log(lines.join('\n'))
