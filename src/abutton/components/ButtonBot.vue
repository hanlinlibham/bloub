<script setup lang="ts">
import { computed } from 'vue'
import { buildFace, type Pose } from '../core/face'
import { f } from '../core/math'
import { shapeExtent, shapePath } from '../core/shapes'
import { DEFAULT_FINISH, FINISH_BY_ID, SKIN_BY_ID, SKINS, type Finish, type Skin } from '../core/skins'

const props = withDefaults(
  defineProps<{
    pose: Pose
    shape: string
    skin: string
    finish?: string
    frame?: boolean
    frameColor?: string
    shadowColor?: string
    viewBox?: string
    interactive?: boolean
    label?: string
  }>(),
  {
    finish: DEFAULT_FINISH,
    frame: false,
    frameColor: '#FFFFFF',
    shadowColor: '#0A2240',
    viewBox: '0 0 400 400',
    interactive: false,
    label: '扣扣'
  }
)

const emit = defineEmits<{
  press: [e: PointerEvent]
  flip: []
  key: [e: KeyboardEvent, down: boolean]
}>()

let seq = 0
const uid = `ab${Math.random().toString(36).slice(2, 7)}${seq++}`
const id = (n: string) => `${uid}-${n}`

const S = computed<Skin>(() => SKIN_BY_ID.get(props.skin) ?? SKINS[0]!)
const F = computed<Finish>(() => FINISH_BY_ID.get(props.finish) ?? FINISH_BY_ID.get(DEFAULT_FINISH)!)

const R = 120
const outline = computed(() => ({
  side: shapePath(props.shape, 0, -116, R),
  face: shapePath(props.shape, 0, -130, R),
  groove: shapePath(props.shape, 0, -130, R * 0.8),
  rimHi: shapePath(props.shape, 0, -127, R * 0.83),
  disc: shapePath(props.shape, 0, -130, R * 0.76)
}))
const extent = computed(() => shapeExtent(props.shape))

const geo = computed(() => buildFace(props.pose))
const back = computed(() => props.pose.flip < 0)

const body = computed(() => {
  const p = props.pose
  return `translate(${f(200 + p.x)} ${f(334 + p.y)}) rotate(${f(p.rot)}) scale(${p.sx.toFixed(4)} ${p.sy.toFixed(4)})`
})

const shadow = computed(() => {
  const p = props.pose
  const lift = p.lift
  return {
    cx: f(200 + p.x * 0.6),
    rx: f(112 * extent.value.w * Math.abs(p.sx) * (1 - lift * 0.35)),
    opacity: f((p.mode === 'press' ? 0.6 : 0.45) * (1 - lift * 0.5))
  }
})

const light = computed(() => ({
  cx: `${f(38 - props.pose.lookX * 12)}%`,
  cy: `${f(30 - props.pose.lookY * 10)}%`
}))

function mix(a: string, b: string, t: number) {
  const pa = parseInt(a.slice(1), 16)
  const pb = parseInt(b.slice(1), 16)
  const ch = (s: number) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t)
  return `#${((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1)}`
}
const shadeColor = computed(() => mix(S.value.face, S.value.shade, F.value.depth))
const strokeKind = (fill: boolean) => (fill ? 'none' : S.value.hole)

function onKey(e: KeyboardEvent, down: boolean) {
  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault()
    if (!e.repeat) emit('key', e, down)
  }
}
</script>

<template>
  <svg :viewBox="viewBox" class="block h-full w-full overflow-visible" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient :id="id('face')" :cx="light.cx" :cy="light.cy" r="78%">
        <stop offset="0" :stop-color="S.face" />
        <stop offset=".5" :stop-color="S.face" />
        <stop offset="1" :stop-color="shadeColor" />
      </radialGradient>
      <linearGradient :id="id('side')" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" :stop-color="S.sideHi" />
        <stop offset="1" :stop-color="S.side" />
      </linearGradient>
      <radialGradient :id="id('disc')" cx="62%" cy="74%" r="82%">
        <stop offset="0" :stop-color="S.disc" />
        <stop offset="1" :stop-color="mix(S.disc, S.shade, 0.35 * F.depth)" />
      </radialGradient>
      <linearGradient :id="id('hole')" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" :stop-color="S.holeDeep" />
        <stop offset=".65" :stop-color="S.hole" />
      </linearGradient>
      <clipPath :id="id('clip')"><path :d="outline.face" /></clipPath>
      <filter :id="id('blur')" x="-30%" y="-100%" width="160%" height="300%">
        <feGaussianBlur stdDeviation="7" />
      </filter>
    </defs>

    <rect
      v-if="frame"
      x="16"
      y="16"
      width="368"
      height="368"
      rx="76"
      fill="none"
      :stroke="frameColor"
      stroke-width="10"
    />
    <slot name="under" />
    <ellipse
      :cx="shadow.cx"
      :cy="336 + (extent.bottom - 1) * R * 0.5"
      :rx="shadow.rx"
      ry="15"
      :fill="shadowColor"
      :opacity="shadow.opacity"
      :filter="`url(#${id('blur')})`"
    />

    <g :transform="body">
      <g
        :role="interactive ? 'button' : undefined"
        :tabindex="interactive ? 0 : undefined"
        :aria-label="interactive ? label : undefined"
        :class="interactive ? 'cursor-grab outline-none active:cursor-grabbing' : ''"
        @pointerdown="interactive && emit('press', $event)"
        @dblclick="interactive && emit('flip')"
        @keydown="interactive && onKey($event, true)"
        @keyup="interactive && onKey($event, false)"
      >
        <path :d="outline.side" :fill="`url(#${id('side')})`" />
        <path :d="outline.face" :fill="`url(#${id('face')})`" :fill-opacity="F.body" />
        <path
          v-if="F.glow > 0"
          :d="outline.face"
          fill="none"
          :stroke="S.face"
          stroke-width="10"
          :opacity="F.glow"
          :clip-path="`url(#${id('clip')})`"
        />
        <path :d="outline.groove" fill="none" :stroke="S.groove" stroke-width="7" />
        <path :d="outline.rimHi" fill="none" :stroke="mix(S.face, '#ffffff', 0.6)" stroke-width="2" opacity=".9" />
        <path
          :d="outline.groove"
          fill="none"
          :stroke="S.hole"
          stroke-width="7"
          stroke-linecap="round"
          pathLength="100"
          stroke-dasharray="12 88"
          :stroke-dashoffset="-(pose.spin / 3.6)"
          :opacity="pose.arc"
        />
        <g :transform="`translate(${geo.disc.x} ${geo.disc.y})`">
          <path :d="outline.disc" :fill="`url(#${id('disc')})`" :fill-opacity="F.body" />
        </g>

        <g :transform="`translate(${geo.offset.x} ${-130 + geo.offset.y})`">
          <template v-if="!back">
            <ellipse cx="-60" cy="4" rx="15" ry="8" :fill="S.cheek" :opacity="geo.blush" />
            <ellipse cx="60" cy="4" rx="15" ry="8" :fill="S.cheek" :opacity="geo.blush" />
          </template>
          <template v-for="(e, i) in geo.eyes" :key="i">
            <path :d="e.d" :fill="`url(#${id('hole')})`" :opacity="e.opacity" />
            <circle :cx="e.catch.cx" :cy="e.catch.cy" :r="e.catch.r" fill="#FFFFFF" :opacity="e.catch.opacity" />
            <path :d="e.lid.d" :transform="e.lid.transform" :fill="S.disc" :opacity="e.lid.opacity" />
            <path
              :d="e.alt.d"
              :transform="e.alt.transform"
              :fill="e.alt.fill ? S.hole : 'none'"
              :stroke="strokeKind(e.alt.fill)"
              stroke-width="8"
              stroke-linecap="round"
              stroke-linejoin="round"
              :opacity="e.alt.opacity"
            />
          </template>
          <path :d="geo.mouth[0]" :fill="`url(#${id('hole')})`" />
          <path :d="geo.mouth[1]" :fill="`url(#${id('hole')})`" />
        </g>

        <ellipse
          v-if="F.spec > 0"
          cx="-48"
          cy="-200"
          rx="30"
          ry="13"
          transform="rotate(-30 -48 -200)"
          fill="#FFFFFF"
          :opacity="F.spec * (back ? 0.5 : 1)"
          :clip-path="`url(#${id('clip')})`"
        />
      </g>
    </g>
    <slot />
  </svg>
</template>
