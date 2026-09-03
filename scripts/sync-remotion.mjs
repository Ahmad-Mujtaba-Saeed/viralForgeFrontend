// @ts-check
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * sync-remotion — copy the renderer's composition into the dashboard so the
 * browser can play it.
 *
 *   node scripts/sync-remotion.mjs [--check]
 *
 * WHY A COPY AND NOT AN IMPORT. The in-browser preview runs the REAL
 * `ExplainerVideo` component through @remotion/player — the same React tree the
 * MP4 is rendered from, which is the entire point: a preview that is a separate
 * implementation is a lie waiting to happen. But the two packages cannot simply
 * be linked:
 *
 *   - this app is React 19 and installs with pnpm; remotion-render is React 18
 *     and installs with npm (pnpm wrecks its node_modules). Importing across
 *     that boundary resolves `react` from remotion-render/node_modules and you
 *     get two Reacts in one page — hooks throw, and the failure is baffling.
 *   - Next would also have to be told to transpile files outside its root.
 *
 * Copying the source in means every import (`react`, `remotion`,
 * `@remotion/transitions`) resolves against THIS app's node_modules, so there
 * is exactly one React and one Remotion. The copy is generated, never edited:
 * change remotion-render/src and re-run this.
 *
 * `--check` reports drift without writing (for CI or a pre-render sanity pass).
 *
 * server.ts and render.ts are excluded — they are the Node render service
 * (express, @remotion/renderer, fs) and nothing in the composition tree imports
 * them. The script FAILS if any copied file reaches for a Node builtin, so the
 * day someone adds `import fs from 'fs'` to a layout, this breaks loudly here
 * instead of mysteriously in a browser bundle.
 */

const here = path.dirname(fileURLToPath(import.meta.url))
const appRoot = path.join(here, '..')
const renderRoot = path.join(appRoot, '..', 'remotion-render')

/** The Node-only entrypoints of the render service. Never copied. */
const EXCLUDE_FILES = new Set(['server.ts', 'render.ts'])

/** Imports that mean "this file cannot run in a browser". */
const NODE_ONLY = /from\s+['"](node:)?(fs|path|os|child_process|express|cors|@remotion\/renderer|@remotion\/bundler)['"]/

const SRC_FROM = path.join(renderRoot, 'src')
const SRC_TO = path.join(appRoot, 'lib', 'remotion')

/**
 * staticFile('fonts/…') resolves to a plain absolute URL when there is no
 * Remotion bundle around it, so the renderer's own public folder has to sit at
 * this app's public root for the webfonts and sfx to load in the Player.
 */
const PUBLIC_DIRS = ['fonts', 'sfx']

const check = process.argv.includes('--check')
let copied = 0
let drifted = 0

/** @param {string} file @param {string} body */
const assertBrowserSafe = (file, body) => {
  const hit = body.match(NODE_ONLY)
  if (hit) {
    console.error(
      `\n  ${file} imports "${hit[2]}", which cannot run in the browser.\n` +
        `  The dashboard's preview player bundles this file. Either keep that\n` +
        `  import out of the composition tree, or add the file to EXCLUDE_FILES\n` +
        `  in scripts/sync-remotion.mjs if it is render-service-only.\n`
    )
    process.exit(1)
  }
}

/** @param {string} from @param {string} to @param {boolean} guard */
const copyTree = (from, to, guard) => {
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name)
    const dest = path.join(to, entry.name)
    if (entry.isDirectory()) {
      copyTree(src, dest, guard)
      continue
    }
    if (guard && EXCLUDE_FILES.has(path.relative(SRC_FROM, src))) continue

    const body = fs.readFileSync(src)
    if (guard && /\.tsx?$/.test(entry.name)) {
      assertBrowserSafe(path.relative(renderRoot, src), body.toString('utf8'))
    }

    const same = fs.existsSync(dest) && Buffer.compare(fs.readFileSync(dest), body) === 0
    if (same) continue
    drifted += 1
    if (check) {
      console.log(`  drift: ${path.relative(appRoot, dest)}`)
      continue
    }
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    fs.writeFileSync(dest, body)
    copied += 1
  }
}

// `pnpm build` runs this first, and a deploy may check out this app WITHOUT
// its sibling render service. The mirror is committed, so that build has
// everything it needs — say so and carry on rather than failing the deploy.
// Only a checkout with neither the source nor the mirror is actually broken.
if (!fs.existsSync(SRC_FROM)) {
  if (fs.existsSync(SRC_TO)) {
    console.log(`remotion-render not present — keeping the committed mirror in ${path.relative(appRoot, SRC_TO)}`)
    process.exit(0)
  }
  console.error(
    `remotion-render/src not found at ${SRC_FROM}, and no mirror at ` +
      `${path.relative(appRoot, SRC_TO)} to fall back on — the preview player cannot build.`
  )
  process.exit(1)
}

// A stale file left behind after a rename in remotion-render would still
// compile and still be wrong, so the mirror is rebuilt rather than merged.
if (!check && fs.existsSync(SRC_TO)) fs.rmSync(SRC_TO, { recursive: true })

copyTree(SRC_FROM, SRC_TO, true)
for (const dir of PUBLIC_DIRS) {
  const from = path.join(renderRoot, 'public', dir)
  if (fs.existsSync(from)) copyTree(from, path.join(appRoot, 'public', dir), false)
}

if (!check) {
  fs.writeFileSync(
    path.join(SRC_TO, 'GENERATED.md'),
    '# Generated — do not edit\n\n' +
      'Mirror of `remotion-render/src`, copied by `scripts/sync-remotion.mjs` so\n' +
      'the dashboard can play the real composition with @remotion/player.\n\n' +
      'Edit the originals in `remotion-render/src` and re-run `pnpm sync:remotion`.\n'
  )
}

if (check) {
  console.log(drifted ? `\n${drifted} file(s) out of sync — run: pnpm sync:remotion` : 'in sync')
  process.exit(drifted ? 1 : 0)
}
console.log(`synced ${copied} file(s) into lib/remotion + public/{${PUBLIC_DIRS.join(',')}}`)
