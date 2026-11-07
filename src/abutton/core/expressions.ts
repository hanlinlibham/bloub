export type AltKind = 'arc' | 'squeeze' | 'heart' | 'cross' | 'star'

/**
 * The whole face is the four button holes: the top two are eyes, the bottom two
 * merge into a mouth (`mg` is the gap between them — 0 means one mouth).
 */
export interface FaceParams {
  ey: number
  es: number
  ew: number
  eh: number
  /** Eyelid cut (0 = none, 1 = half the eye covered). */
  lid: number
  /** Eyelid angle in degrees: positive = angry (inner corners down). */
  tilt: number
  mx: number
  my: number
  mw: number
  mh: number
  mg: number
  /** -1 frown, 0 pill, 1 smile (flat top, round bottom). */
  mf: number
  blush: number
  altL: number
  altR: number
}

export interface Expression {
  id: string
  name: string
  face: FaceParams
  kindL: AltKind
  kindR: AltKind
}

const base: FaceParams = {
  ey: -22, es: 32, ew: 28, eh: 38, lid: 0, tilt: 0,
  mx: 0, my: 32, mw: 24, mh: 10, mg: 0, mf: 0.7,
  blush: 0.25, altL: 0, altR: 0
}

const x = (id: string, name: string, p: Partial<FaceParams>, kindL: AltKind = 'arc', kindR: AltKind = kindL): Expression => ({
  id,
  name,
  face: { ...base, ...p },
  kindL,
  kindR
})

/** Moods the user can pick as the character's baseline. */
export const EXPRESSIONS: Expression[] = [
  x('neutral', '平静', {}),
  x('smile', '微笑', { mw: 40, mh: 20, mf: 1, blush: 0.6 }),
  x('joy', '开心', { mw: 46, mh: 26, mf: 1, altL: 1, altR: 1, blush: 0.9 }),
  x('love', '心动', { mw: 34, mh: 18, mf: 1, altL: 1, altR: 1, blush: 1 }, 'heart'),
  x('wink', '眨眼', { mw: 38, mh: 16, mf: 1, mx: 6, altL: 1, blush: 0.6 }),
  x('starry', '星星眼', { mw: 30, mh: 24, mf: 0.4, altL: 1, altR: 1, blush: 0.7 }, 'star'),
  x('surprise', '惊讶', { ey: -27, es: 34, ew: 34, eh: 46, my: 36, mw: 22, mh: 26, mf: 0, blush: 0.2 }),
  x('sleepy', '困倦', { ew: 30, eh: 30, lid: 1.05, mw: 16, mh: 8, mf: 0.2, blush: 0.2 }),
  x('smug', '得意', { lid: 0.85, tilt: -6, mx: 12, mw: 26, mh: 10, mf: 1, blush: 0.45 }),
  x('angry', '生气', { ew: 32, eh: 34, lid: 0.75, tilt: 24, mw: 26, mh: 10, mf: -1, blush: 0 }),
  x('sad', '委屈', { ey: -20, ew: 30, eh: 40, lid: 0.5, tilt: -18, my: 36, mw: 22, mh: 10, mf: -1, blush: 0.35 }),
  x('dizzy', '晕乎', { mw: 22, mh: 16, mf: 0, mx: -6, altL: 1, altR: 1, blush: 0.3 }, 'cross')
]

/** Transient faces the engine plays on its own. */
export const INTERNAL: Record<string, Expression> = {
  dormant: x('dormant', '纽扣', { ey: -30, es: 30, ew: 36, eh: 36, mx: 0, my: 30, mw: 96, mh: 36, mg: 24, mf: 0, blush: 0 }),
  think: x('think', '思考', { ey: -26, es: 30, ew: 26, eh: 30, mx: 14, mw: 14, mh: 8, mf: 0, blush: 0.1 }),
  talk: x('talk', '说话', { ey: -24, mw: 30, mh: 12, mf: 0.45, blush: 0.45 }),
  yawn: x('yawn', '哈欠', { ey: -20, es: 33, ew: 30, eh: 30, lid: 1.15, mw: 30, mh: 46, mf: 0, blush: 0.2 }),
  squeeze: x('squeeze', '被压', { mw: 42, mh: 12, mf: 0, altL: 1, altR: 1, blush: 0.9 }, 'squeeze'),
  strain: x('strain', '被拉', { ey: -26, ew: 26, eh: 40, mw: 20, mh: 22, mf: 0, blush: 0.6 })
}

export const EXPRESSION_BY_ID = new Map<string, Expression>([
  ...EXPRESSIONS.map((e) => [e.id, e] as const),
  ...Object.values(INTERNAL).map((e) => [e.id, e] as const)
])
export const DEFAULT_EXPRESSION = 'neutral'

export function expressionOf(id: string): Expression {
  return EXPRESSION_BY_ID.get(id) ?? EXPRESSIONS[0]!
}
