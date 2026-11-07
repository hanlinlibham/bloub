export interface Skin {
  id: string
  name: string
  face: string
  shade: string
  sideHi: string
  side: string
  groove: string
  disc: string
  hole: string
  holeDeep: string
  cheek: string
}

export const SKINS: Skin[] = [
  { id: 'porcelain', name: '陶瓷白', face: '#FFFFFF', shade: '#CFDCEB', sideHi: '#C9D7E8', side: '#93AAC6', groove: '#BDCEE3', disc: '#F3F7FC', hole: '#0A63B0', holeDeep: '#062C55', cheek: '#FF8F80' },
  { id: 'denim', name: '牛仔蓝', face: '#4A97E2', shade: '#2366AD', sideHi: '#1F5FA3', side: '#123F73', groove: '#2E74BF', disc: '#57A2EA', hole: '#0A2240', holeDeep: '#040E1C', cheek: '#FFB3A8' },
  { id: 'cherry', name: '樱桃红', face: '#F25C63', shade: '#BA313B', sideHi: '#A82A34', side: '#741A22', groove: '#CC3F48', disc: '#F66E74', hole: '#4A0E14', holeDeep: '#220408', cheek: '#FFD3C7' },
  { id: 'mint', name: '薄荷绿', face: '#86DBBB', shade: '#47A985', sideHi: '#3E9877', side: '#2A735A', groove: '#5DBF9B', disc: '#97E3C7', hole: '#0F4A36', holeDeep: '#05261B', cheek: '#FF9A8A' },
  { id: 'lemon', name: '柠檬黄', face: '#FFD94F', shade: '#E2A920', sideHi: '#C98F17', side: '#9C6B0C', groove: '#EDBE33', disc: '#FFE27C', hole: '#5A3A06', holeDeep: '#2C1C02', cheek: '#FF8F70' },
  { id: 'tangerine', name: '橘子橙', face: '#FF9D42', shade: '#D8681A', sideHi: '#BE5713', side: '#8E3D09', groove: '#E8792A', disc: '#FFAE5E', hole: '#4D1F03', holeDeep: '#260E00', cheek: '#FFE0BF' },
  { id: 'pearl', name: '奶咖', face: '#F6EEE5', shade: '#DCCAB6', sideHi: '#C4AE96', side: '#9A8167', groove: '#E2D2C0', disc: '#FAF4EE', hole: '#6B4E34', holeDeep: '#3A2817', cheek: '#FF9F95' },
  { id: 'ebony', name: '乌木黑', face: '#4C5260', shade: '#2A2E37', sideHi: '#22252D', side: '#111318', groove: '#3A3F4A', disc: '#59606F', hole: '#0B0C10', holeDeep: '#000000', cheek: '#FF8F80' }
]

export const SKIN_BY_ID = new Map(SKINS.map((s) => [s.id, s]))
export const DEFAULT_SKIN = 'porcelain'

export interface Finish {
  id: string
  name: string
  /** Strength of the specular highlight. */
  spec: number
  /** Fill opacity of the face — jelly is slightly see-through. */
  body: number
  /** How far the gradient goes toward the shade colour (0 = flat). */
  depth: number
  /** Inner rim glow. */
  glow: number
}

export const FINISHES: Finish[] = [
  { id: 'gloss', name: '亮釉', spec: 0.6, body: 1, depth: 1, glow: 0 },
  { id: 'matte', name: '哑光', spec: 0, body: 1, depth: 0.55, glow: 0 },
  { id: 'jelly', name: '果冻', spec: 0.85, body: 0.84, depth: 0.8, glow: 0.55 }
]
export const FINISH_BY_ID = new Map(FINISHES.map((s) => [s.id, s]))
export const DEFAULT_FINISH = 'gloss'

export interface StageTheme {
  id: string
  name: string
  bg: string
  ink: string
  shadow: string
}
export const STAGES: StageTheme[] = [
  { id: 'brand', name: '品牌蓝', bg: '#0A63B0', ink: '#FFFFFF', shadow: '#0A2240' },
  { id: 'mist', name: '雾白', bg: '#E6EEF7', ink: '#0A2240', shadow: '#0A2240' },
  { id: 'night', name: '深夜', bg: '#0A2240', ink: '#FFFFFF', shadow: '#000000' }
]
export const STAGE_BY_ID = new Map(STAGES.map((s) => [s.id, s]))
export const DEFAULT_STAGE = 'brand'
