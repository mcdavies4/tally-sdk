// Simple build script — creates CJS and ESM outputs
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'fs'

mkdirSync('./dist', { recursive: true })

const src = readFileSync('./src/index.js', 'utf8')

// ESM version (just copy as-is)
writeFileSync('./dist/index.js', src)

// CJS version (convert export syntax)
const cjs = src
  .replace("export { TallyClient as Tally, TallyError }", "")
  .replace("export default TallyClient", "")
  .replace(/^export /gm, "")
  + `
// CJS exports
module.exports = TallyClient
module.exports.Tally = TallyClient
module.exports.TallyError = TallyError
module.exports.default = TallyClient
`

writeFileSync('./dist/index.cjs', cjs)

// Copy types
copyFileSync('./src/index.d.ts', './dist/index.d.ts')

console.log('Build complete:')
console.log('  dist/index.js   (ESM)')
console.log('  dist/index.cjs  (CJS)')
console.log('  dist/index.d.ts (TypeScript)')
