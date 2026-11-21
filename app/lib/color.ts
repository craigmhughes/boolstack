function channel(v: number): number {
  const c = v / 255
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

/** Picks white or near-black ink for readable contrast on the given hex colour. */
export function inkForColor(hex: string): '#ffffff' | '#1c1c1c' {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return '#1c1c1c'
  let h = m[1]
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  const lum = 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
  // white contrast (1.05 / (L + 0.05)) vs dark #1c1c1c (L ~ 0.011)
  const white = 1.05 / (lum + 0.05)
  const dark = (lum + 0.05) / 0.061
  return white >= dark ? '#ffffff' : '#1c1c1c'
}
