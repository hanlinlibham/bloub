export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
export const rand = (a: number, b: number) => a + Math.random() * (b - a)
export const f = (n: number) => Number(n.toFixed(2))

/** Rounded rectangle with four independent corner radii. */
export function roundedRect(
  x: number,
  y: number,
  w: number,
  h: number,
  tl: number,
  tr: number,
  br: number,
  bl: number
) {
  w = Math.max(w, 0.01)
  h = Math.max(h, 0.01)
  const m = Math.min(w / 2, h / 2)
  tl = clamp(tl, 0, m)
  tr = clamp(tr, 0, m)
  br = clamp(br, 0, m)
  bl = clamp(bl, 0, m)
  return (
    `M${f(x + tl)},${f(y)}H${f(x + w - tr)}A${f(tr)},${f(tr)} 0 0 1 ${f(x + w)},${f(y + tr)}` +
    `V${f(y + h - br)}A${f(br)},${f(br)} 0 0 1 ${f(x + w - br)},${f(y + h)}` +
    `H${f(x + bl)}A${f(bl)},${f(bl)} 0 0 1 ${f(x)},${f(y + h - bl)}` +
    `V${f(y + tl)}A${f(tl)},${f(tl)} 0 0 1 ${f(x + tl)},${f(y)}Z`
  )
}

export interface Spring {
  x: number
  v: number
  t: number
}
export const spring = (v: number): Spring => ({ x: v, v: 0, t: v })

/** One integration step. `s` is the time scale (1 = normal speed). */
export function stepSpring(sp: Spring, k: number, d: number, s: number) {
  sp.v += (sp.t - sp.x) * k * s
  sp.v *= Math.pow(d, s)
  sp.x += sp.v * s
}
