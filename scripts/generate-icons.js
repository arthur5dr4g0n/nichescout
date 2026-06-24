// Generates favicons + PWA icons from public/marketmax-logo.png
// Run once after changing the logo:  node scripts/generate-icons.js
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const pub = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')
const src = join(pub, 'marketmax-logo.png')

const targets = [
  ['logo512.png', 512],
  ['logo192.png', 192],
  ['apple-touch-icon.png', 180],
  ['favicon-32.png', 32],
  ['favicon-16.png', 16],
]

for (const [name, size] of targets) {
  await sharp(src).resize(size, size, { fit: 'cover' }).png().toFile(join(pub, name))
  console.log(`✓ ${name} (${size}×${size})`)
}
