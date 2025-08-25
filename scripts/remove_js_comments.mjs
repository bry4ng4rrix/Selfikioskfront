#!/usr/bin/env node
/**
 * Remove all comments from JS/TS/JSX/TSX files under src/ without changing code.
 * - Uses @babel/parser and @babel/generator to preserve syntax and JSX accurately.
 * - Skips node_modules, build outputs, and public assets.
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import glob from 'glob'
import { parse } from '@babel/parser'
import generate from '@babel/generator'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const FRONT_ROOT = path.resolve(__dirname, '..')

const exts = ['js', 'jsx', 'ts', 'tsx']

function getParserPlugins(ext) {
  const base = [
    'jsx',
    'classProperties',
    'classPrivateProperties',
    'classPrivateMethods',
    'optionalChaining',
    'nullishCoalescingOperator',
    'topLevelAwait',
    'dynamicImport',
    'importAssertions',
  ]
  if (ext === 'ts' || ext === 'tsx') base.push('typescript')
  if (ext === 'tsx') base.push('jsx')
  return base
}

async function processFile(file) {
  const code = await fs.readFile(file, 'utf8')
  const ext = path.extname(file).slice(1)
  const ast = parse(code, {
    sourceType: 'module',
    attachComment: false,
    allowReturnOutsideFunction: true,
    plugins: getParserPlugins(ext),
  })
  const { code: out } = generate.default(ast, {
    comments: false, // strip comments
    compact: false,
    retainLines: false,
  }, code)
  if (out !== code) {
    await fs.writeFile(file, out, 'utf8')
    console.log(`Updated: ${path.relative(FRONT_ROOT, file)}`)
  }
}

async function main() {
  const patterns = exts.map(e => `src/**/*.${e}`)
  const ignore = ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.next/**']
  const files = patterns.flatMap(p => glob.sync(p, { cwd: FRONT_ROOT, ignore, nodir: true, absolute: true }))
  let changed = 0
  for (const f of files) {
    const before = await fs.readFile(f, 'utf8')
    await processFile(f)
    const after = await fs.readFile(f, 'utf8')
    if (before !== after) changed++
  }
  console.log(`Done. Files updated: ${changed}`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
