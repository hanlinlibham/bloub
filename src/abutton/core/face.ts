import type { AltKind, FaceParams } from './expressions'
import { expressionOf } from './expressions'
import { clamp, f, lerp, roundedRect } from './math'

export type Mode = 'idle' | 'gaze' | 'thinking' | 'speaking' | 'sleep' | 'press' | 'drag' | 'flip'

/** Everything the renderer needs for one frame. */
export interface Pose {
  x: number
  y: number
  rot: number
  sx: number
  sy: number
  face: FaceParams
  kindL: AltKind
  kindR: AltKind
  /** 1 = eyes open, ~0 = blink. */
  open: number
  lookX: number
  lookY: number
  thinking: boolean
  phase: number
  arc: number
  /** Rotation of the thinking arc, degrees. */
  spin: number
  /** -1..1, the coin flip; < 0 shows the back. */
  flip: number
  lift: number
  mode: Mode
  expression: string
  dormant: boolean
}

export function stillPose(expressionId: string): Pose {
  const e = expressionOf(expressionId)
  return {
    x: 0, y: 0, rot: 0, sx: 1, sy: 1,
    face: { ...e.face },
    kindL: e.kindL,
    kindR: e.kindR,
    open: 1, lookX: 0, lookY: 0,
    thinking: false, phase: 0, arc: 0, spin: 0, flip: 1, lift: 0,
    mode: 'idle',
    expression: e.id,
    dormant: e.id === 'dormant'
  }
}

const ALT: Record<AltKind, { d: [string, string]; fill: boolean }> = {
  arc: { d: ['M-13 6 Q0 -12 13 6', 'M-13 6 Q0 -12 13 6'], fill: false },
  squeeze: { d: ['M-12 -11 L10 0 L-12 11', 'M12 -11 L-10 0 L12 11'], fill: false },
  cross: { d: ['M-10 -10 L10 10 M10 -10 L-10 10', 'M-10 -10 L10 10 M10 -10 L-10 10'], fill: false },
  heart: {
    d: [
      'M0 13 C-18 2 -17 -13 -7.5 -13 C-3 -13 0 -9.5 0 -6 C0 -9.5 3 -13 7.5 -13 C17 -13 18 2 0 13Z',
      'M0 13 C-18 2 -17 -13 -7.5 -13 C-3 -13 0 -9.5 0 -6 C0 -9.5 3 -13 7.5 -13 C17 -13 18 2 0 13Z'
    ],
    fill: true
  },
  star: {
    d: [
      'M0 -15 L4.4 -5 L15 -4.6 L6.8 2.6 L9.4 13 L0 7.2 L-9.4 13 L-6.8 2.6 L-15 -4.6 L-4.4 -5Z',
      'M0 -15 L4.4 -5 L15 -4.6 L6.8 2.6 L9.4 13 L0 7.2 L-9.4 13 L-6.8 2.6 L-15 -4.6 L-4.4 -5Z'
    ],
    fill: true
  }
}

export interface EyeGeo {
  d: string
  opacity: number
  catch: { cx: number; cy: number; r: number; opacity: number }
  lid: { d: string; transform: string; opacity: number }
  alt: { d: string; transform: string; opacity: number; fill: boolean }
}

export interface FaceGeo {
  eyes: [EyeGeo, EyeGeo]
  mouth: [string, string]
  blush: number
  offset: { x: number; y: number }
  disc: { x: number; y: number }
}

export function buildFace(p: Pose): FaceGeo {
  const E = p.face
  const lx = p.lookX * 3
  const ly = p.lookY * 2
  const eh = Math.max(3, E.eh * p.open)
  const ew = E.ew
  const er = Math.min(ew, eh) / 2
  const sleepy = clamp(E.mg / 24, 0, 1)

  const eye = (i: 0 | 1): EyeGeo => {
    const side = i === 0 ? -1 : 1
    const cx = side * E.es + lx
    const cy = E.ey + ly
    const altAmt = i === 0 ? E.altL : E.altR
    const kind = ALT[i === 0 ? p.kindL : p.kindR]

    let ox = -ew * 0.18
    let oy = -eh * 0.22
    if (p.thinking) {
      const a = p.phase * 11 + i * Math.PI
      ox = Math.cos(a) * ew * 0.2
      oy = Math.sin(a) * eh * 0.22
    }

    // the eyelid is a skin-coloured slab sliding down over the hole, tilted for anger/sadness
    const cut = clamp(E.lid, 0, 1.2)
    const lw = ew + 16
    const lh = eh + 8
    const lidY = cy - eh / 2 - lh + cut * eh * 0.5
    const tilt = E.tilt * -side

    return {
      d: roundedRect(cx - ew / 2, cy - eh / 2, ew, eh, er, er, er, er),
      opacity: 1 - altAmt,
      catch: {
        cx: f(cx + ox),
        cy: f(cy + oy),
        r: f(Math.min(5, eh * 0.18)),
        opacity: f((1 - altAmt) * (1 - sleepy) * (eh > 10 ? 1 : 0) * (1 - clamp(cut - 0.6, 0, 1)))
      },
      lid: {
        d: roundedRect(cx - lw / 2, lidY, lw, lh, 4, 4, 6, 6),
        transform: `rotate(${f(tilt)} ${f(cx)} ${f(cy)})`,
        opacity: cut > 0.02 ? (1 - altAmt) : 0
      },
      alt: {
        d: kind.d[i],
        transform: `translate(${f(cx)} ${f(cy)})`,
        opacity: f(altAmt),
        fill: kind.fill
      }
    }
  }

  const hw = (E.mw - E.mg) / 2
  const x0 = E.mx - E.mw / 2 + lx
  const y0 = E.my - E.mh / 2 + ly
  const rOut = E.mh / 2
  const rTop = E.mf > 0 ? lerp(rOut, 3, E.mf) : rOut
  const rBot = E.mf < 0 ? lerp(rOut, 3, -E.mf) : rOut
  const rInTop = Math.min(rTop, E.mg * 0.8)
  const rInBot = Math.min(rBot, E.mg * 0.8)

  return {
    eyes: [eye(0), eye(1)],
    mouth: [
      roundedRect(x0, y0, hw + 0.6, E.mh, rTop, rInTop, rInBot, rBot),
      roundedRect(x0 + hw + E.mg - 0.6, y0, hw + 0.6, E.mh, rInTop, rTop, rBot, rInBot)
    ],
    blush: f(E.blush * 0.75),
    offset: { x: f(p.lookX * 16), y: f(p.lookY * 12) },
    disc: { x: f(p.lookX * 5), y: f(p.lookY * 4) }
  }
}
