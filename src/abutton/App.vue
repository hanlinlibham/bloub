<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppearancePanel from './components/AppearancePanel.vue'
import BotStage from './components/BotStage.vue'
import ControlPanel from './components/ControlPanel.vue'
import ExpressionPanel from './components/ExpressionPanel.vue'
import StatePanel from './components/StatePanel.vue'
import TuningPanel from './components/TuningPanel.vue'
import { DEFAULT_EXPRESSION, EXPRESSIONS } from './core/expressions'
import { DEFAULT_TUNING, STATUS, useButtonLife, type Lock } from './core/life'
import { DEFAULT_SHAPE, SHAPE_BY_ID } from './core/shapes'
import {
  DEFAULT_FINISH,
  DEFAULT_SKIN,
  DEFAULT_STAGE,
  FINISH_BY_ID,
  SKIN_BY_ID,
  STAGE_BY_ID,
  STAGES
} from './core/skins'
import { persisted, persistedJson } from './core/storage'

const shape = persisted('shape', DEFAULT_SHAPE, (v) => SHAPE_BY_ID.has(v))
const skin = persisted('skin', DEFAULT_SKIN, (v) => SKIN_BY_ID.has(v))
const finish = persisted('finish', DEFAULT_FINISH, (v) => FINISH_BY_ID.has(v))
const stageId = persisted('stage', DEFAULT_STAGE, (v) => STAGE_BY_ID.has(v))
const mood = persisted('mood', DEFAULT_EXPRESSION, (v) => EXPRESSIONS.some((e) => e.id === v))
const frameOn = persisted('frame', '1', () => true)
const frame = computed({
  get: () => frameOn.value === '1',
  set: (v: boolean) => (frameOn.value = v ? '1' : '0')
})
const tuning = persistedJson('tuning', DEFAULT_TUNING)
const lock = ref<Lock>('auto')

const stage = computed(() => STAGE_BY_ID.get(stageId.value) ?? STAGES[0]!)

const stageRef = ref<InstanceType<typeof BotStage> | null>(null)
const life = useButtonLife({
  mood,
  lock,
  tuning,
  stageRect: () => stageRef.value?.box?.getBoundingClientRect() ?? null
})

watch([shape, skin, finish], () => life.react())

function svgSource() {
  const svg = stageRef.value?.svg()
  if (!svg) return ''
  const clone = svg.cloneNode(true) as SVGSVGElement
  clone.querySelectorAll('[role],[tabindex]').forEach((n) => {
    n.removeAttribute('role')
    n.removeAttribute('tabindex')
  })
  return '<?xml version="1.0" encoding="UTF-8"?>\n' + clone.outerHTML
}

function download() {
  const blob = new Blob([svgSource()], { type: 'image/svg+xml' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `abutton-${shape.value}-${skin.value}-${mood.value}.svg`
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

const copied = ref(false)
async function copy() {
  try {
    await navigator.clipboard.writeText(svgSource())
    copied.value = true
    setTimeout(() => (copied.value = false), 1400)
  } catch {
    copied.value = false
  }
}
</script>

<template>
  <div
    class="flex min-h-screen flex-col gap-4 p-4 transition-colors duration-500 lg:h-screen lg:flex-row lg:gap-6 lg:p-6"
    :style="{ background: stage.bg, color: stage.ink }"
  >
    <main class="flex min-h-0 flex-1 flex-col gap-4">
      <header class="flex items-center justify-between gap-3">
        <h1 class="flex items-baseline gap-2 text-3xl font-extrabold leading-none tracking-tight">
          abutton
          <small class="text-sm font-medium tracking-normal opacity-75">扣扣 · 角色工坊</small>
        </h1>
        <p
          class="flex items-center gap-2 whitespace-nowrap rounded-full bg-ink/30 px-3 py-2 font-mono text-[11px] font-semibold tracking-wide"
          :class="stage.id === 'mist' ? 'bg-ink/10' : ''"
          aria-live="polite"
        >
          <i class="chip-dot block h-1.5 w-1.5 rounded-full" :style="{ background: stage.ink }" />
          {{ STATUS[life.mode.value] }}
        </p>
      </header>

      <div class="flex min-h-0 flex-1 items-center justify-center">
        <div class="w-full max-w-[min(100%,560px,calc(100vh-9rem))]">
          <BotStage
            ref="stageRef"
            :life="life"
            :shape="shape"
            :skin="skin"
            :finish="finish"
            :stage="stage"
            :frame="frame"
            :tuning="tuning"
          />
        </div>
      </div>

      <p class="text-pretty text-center text-sm leading-relaxed opacity-75">
        四个扣眼就是它的脸。移动鼠标让它看你，单击压扁，双击翻面，按住拖动把它拉长。
      </p>
    </main>

    <ControlPanel class="w-full lg:w-[22rem] lg:shrink-0">
      <template #look>
        <AppearancePanel
          v-model:shape="shape"
          v-model:skin="skin"
          v-model:finish="finish"
          v-model:stage="stageId"
          v-model:frame="frame"
          :mood="mood"
        />
      </template>
      <template #face>
        <ExpressionPanel v-model:mood="mood" :shape="shape" :skin="skin" :finish="finish" @picked="life.react()" />
      </template>
      <template #state>
        <StatePanel v-model:lock="lock" :life="life" />
      </template>
      <template #tune>
        <TuningPanel v-model="tuning" :copied="copied" @download="download" @copy="copy" />
      </template>
    </ControlPanel>
  </div>
</template>
