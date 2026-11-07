import { f, lerp } from './math'

export interface ShapeDef {
  id: string
  name: string
  /** Point on the unit outline. `t` in [0, 1), starting at the top, clockwise. Radius ~1. */
  point: (t: number) => [number, number]
}

const TAU = Math.PI * 2

const circle = (t: number): [number, number] => [Math.sin(t * TAU), -Math.cos(t * TAU)]

function superellipse(a: number, b: number, n: number) {
  return (t: number): [number, number] => {
    const s = Math.sin(t * TAU)
    const c = Math.cos(t * TAU)
    return [a * Math.sign(s) * Math.abs(s) ** (2 / n), -b * Math.sign(c) * Math.abs(c) ** (2 / n)]
  }
}

function polar(r: (a: number) => number, scale = 1) {
  return (t: number): [number, number] => {
    const a = t * TAU
    const k = r(a) * scale
    return [Math.sin(a) * k, -Math.cos(a) * k]
  }
}

function heart(t: number): [number, number] {
  const a = t * TAU
  const hx = (16 * Math.sin(a) ** 3) / 17
  const hy = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) / 17 - 0.15
  const [cx, cy] = circle(t)
  return [lerp(cx, hx * 1.08, 0.62), lerp(cy, hy * 1.02, 0.62)]
}

const hexR = (a: number) => {
  const seg = Math.PI / 3
  const local = ((a % seg) + seg) % seg - seg / 2
  return lerp(Math.cos(seg / 2) / Math.cos(local), 1, 0.28)
}

export const SHAPES: ShapeDef[] = [
  { id: 'round', name: '圆扣', point: circle },
  { id: 'square', name: '方糖', point: superellipse(0.93, 0.93, 4.6) },
  { id: 'flower', name: '花瓣', point: polar((a) => 1 + 0.075 * Math.cos(8 * a), 0.94) },
  { id: 'cookie', name: '饼干', point: polar((a) => 1 + 0.03 * Math.cos(18 * a), 0.97) },
  { id: 'heart', name: '爱心', point: heart },
  { id: 'hexagon', name: '六角', point: polar(hexR, 1.02) },
  { id: 'capsule', name: '胶囊', point: superellipse(1.16, 0.84, 2.9) },
  { id: 'star', name: '软星', point: polar((a) => 1 + 0.1 * Math.cos(5 * a), 0.92) }
]

export const SHAPE_BY_ID = new Map(SHAPES.map((s) => [s.id, s]))
export const DEFAULT_SHAPE = 'round'

const SAMPLES = 96
const cache = new Map<string, [number, number][]>()

function samples(id: string) {
  let pts = cache.get(id)
  if (!pts) {
    const def = SHAPE_BY_ID.get(id) ?? SHAPES[0]!
    pts = Array.from({ length: SAMPLES }, (_, i) => def.point(i / SAMPLES))
    cache.set(id, pts)
  }
  return pts
}

/** Smooth closed path (Catmull-Rom through the sampled outline). */
export function shapePath(id: string, cx: number, cy: number, r: number) {
  const pts = samples(id).map(([x, y]) => [cx + x * r, cy + y * r] as const)
  const n = pts.length
  let d = `M${f(pts[0]![0])},${f(pts[0]![1])}`
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n]!
    const p1 = pts[i]!
    const p2 = pts[(i + 1) % n]!
    const p3 = pts[(i + 2) % n]!
    const c1x = p1[0] + (p2[0] - p0[0]) / 6
    const c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6
    const c2y = p2[1] - (p3[1] - p1[1]) / 6
    d += `C${f(c1x)},${f(c1y)} ${f(c2x)},${f(c2y)} ${f(p2[0])},${f(p2[1])}`
  }
  return d + 'Z'
}

/** Half-extents of the unit outline, used for the ground shadow. */
export function shapeExtent(id: string) {
  const pts = samples(id)
  let w = 0
  let bottom = 0
  for (const [x, y] of pts) {
    w = Math.max(w, Math.abs(x))
    bottom = Math.max(bottom, y)
  }
  return { w, bottom }
}
