<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import type { ButtonLife, Tuning } from '../core/life'
import { STATUS } from '../core/life'
import type { StageTheme } from '../core/skins'
import ButtonBot from './ButtonBot.vue'

const props = defineProps<{
  life: ButtonLife
  shape: string
  skin: string
  finish: string
  stage: StageTheme
  frame: boolean
  tuning: Tuning
}>()

const box = ref<HTMLElement | null>(null)
defineExpose({ box, svg: () => box.value?.querySelector('svg') ?? null })

const onMove = (e: PointerEvent) => props.life.onPointer(e.clientX, e.clientY)
const onUp = () => props.life.pressEnd()

function onPress(e: PointerEvent) {
  e.preventDefault()
  props.life.pressStart(e.clientX, e.clientY)
}
function onKey(_: KeyboardEvent, down: boolean) {
  if (down) props.life.pressStart()
  else props.life.pressEnd()
}

onMounted(() => {
  addEventListener('pointermove', onMove, { passive: true })
  addEventListener('pointerup', onUp)
  addEventListener('pointercancel', onUp)
})
onBeforeUnmount(() => {
  removeEventListener('pointermove', onMove)
  removeEventListener('pointerup', onUp)
  removeEventListener('pointercancel', onUp)
})
</script>

<template>
  <section
    ref="box"
    class="relative aspect-square w-full touch-none select-none"
    :style="{ color: stage.ink }"
    aria-label="角色舞台"
  >
    <ButtonBot
      :pose="life.pose.value"
      :shape="shape"
      :skin="skin"
      :finish="finish"
      :frame="frame"
      :frame-color="stage.ink"
      :shadow-color="stage.shadow"
      interactive
      label="戳一下扣扣，双击翻面，按住拖动可以拉伸"
      @press="onPress"
      @flip="life.flip()"
      @key="onKey"
    />

    <div
      v-if="life.pose.value.dormant"
      class="zzz pointer-events-none absolute right-[24%] top-[30%] font-mono text-xl font-bold"
      aria-hidden="true"
    >
      <span>z</span><span>z</span><span>Z</span>
    </div>

    <div
      class="bubble pointer-events-none absolute left-1/2 top-[3%] w-max max-w-[80%] rounded-2xl bg-paper px-4 py-2.5 text-[15px] leading-relaxed text-ink shadow-lg"
      :class="{ 'bubble--on': life.bubble.value.on }"
      role="status"
      aria-live="polite"
    >
      <span v-if="life.bubble.value.thinking" class="dots flex gap-1.5 py-1.5" aria-label="思考中">
        <span /><span /><span />
      </span>
      <p v-else class="text-pretty">{{ life.bubble.value.text }}</p>
    </div>

    <span
      v-for="p in life.pops.value"
      :key="p.id"
      class="duang pointer-events-none absolute top-[22%] text-[26px] font-black"
      :style="{ left: p.x + '%', '--shadow': stage.shadow }"
      aria-hidden="true"
      >{{ p.text }}</span
    >

    <dl
      v-if="tuning.debug"
      class="absolute bottom-2 left-2 grid grid-cols-[auto_auto] gap-x-3 rounded-xl bg-ink/80 px-3 py-2 font-mono text-[11px] leading-5 text-paper"
    >
      <dt class="opacity-60">mode</dt><dd>{{ STATUS[life.mode.value] }}</dd>
      <dt class="opacity-60">face</dt><dd>{{ life.pose.value.expression }}</dd>
      <dt class="opacity-60">look</dt><dd>{{ life.pose.value.lookX.toFixed(2) }}, {{ life.pose.value.lookY.toFixed(2) }}</dd>
      <dt class="opacity-60">scale</dt><dd>{{ life.pose.value.sx.toFixed(2) }} × {{ life.pose.value.sy.toFixed(2) }}</dd>
      <dt class="opacity-60">fps</dt><dd>{{ life.fps.value }}</dd>
    </dl>
  </section>
</template>
