import { copyFileSync, existsSync, mkdirSync } from "node:fs"
import { dirname, resolve } from "node:path"

const files = [
  {
    from: "src/assets/brand/icon.png",
    to: "public/brand/icon.png",
  },
  {
    from: "src/assets/brand/icon.ico",
    to: "public/icon.ico",
  },
]

for (const file of files) {
  const from = resolve(file.from)
  const to = resolve(file.to)

  if (!existsSync(from)) {
    console.warn(`[brand] Arquivo não encontrado: ${file.from}`)
    continue
  }

  mkdirSync(dirname(to), { recursive: true })
  copyFileSync(from, to)
  console.log(`[brand] ${file.from} -> ${file.to}`)
}
