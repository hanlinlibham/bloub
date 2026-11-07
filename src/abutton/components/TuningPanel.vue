<script setup lang="ts">
import { DEFAULT_TUNING, type Tuning } from '../core/life'

const tuning = defineModel<Tuning>({ required: true })
defineEmits<{ download: []; copy: [] }>()
defineProps<{ copied: boolean }>()

type NumKey = Exclude<keyof Tuning, 'debug'>
const SLIDERS: { key: NumKey; label: string; min: number; max: number; step: number; unit?: string }[] = [
  { key: 'speed', label: '动画速度', min: 0.25, max: 2, step: 0.05, unit: '×' },
  { key: 'breath', label: '呼吸幅度', min: 0, max: 3, step: 0.1, unit: '×' },
  { key: 'bounce', label: '弹性刚度', min: 0.06, max: 0.4, step: 0.01 },
  { key: 'damping', label: '阻尼', min: 0.5, max: 0.92, step: 0.01 },
  { key: 'squash', label: '挤压深度', min: 0.3, max: 1.8, step: 0.05, unit: '×' },
  { key: 'gaze', label: '视线跟随', min: 0, max: 1.5, step: 0.05, unit: '×' },
  { key: 'sleepAfter', label: '自动休眠', min: 0, max: 60, step: 5, unit: 's' }
]

const fmt = (k: NumKey, v: number, unit?: string) =>
  k === 'sleepAfter' && v === 0 ? '关闭' : `${Number(v.toFixed(2))}${unit ?? ''}`

function reset() {
  tuning.value = { ...DEFAULT_TUNING, debug: tuning.value.debug }
}
</script>

<template>
  <div class="flex flex-col gap-5">
    <section class="flex flex-col gap-3">
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-semibold text-ink">动效参数</h2>
        <button type="button" class="cursor-pointer text-xs font-semibold text-brand hover:text-ink" @click="reset">
          恢复默认
        </button>
      </div>
      <label v-for="s in SLIDERS" :key="s.key" class="flex flex-col gap-1.5">
        <span class="flex items-center justify-between text-sm text-ink">
          {{ s.label }}
          <output class="font-mono text-xs text-muted">{{ fmt(s.key, tuning[s.key], s.unit) }}</output>
        </span>
        <input
          v-model.number="tuning[s.key]"
          type="range"
          :min="s.min"
          :max="s.max"
          :step="s.step"
          class="w-full accent-[var(--color-brand)]"
        />
      </label>
      <label class="flex cursor-pointer items-center justify-between gap-3 py-1 text-sm text-ink">
        显示调试叠层
        <input v-model="tuning.debug" type="checkbox" class="h-4 w-4 accent-[var(--color-brand)]" />
      </label>
    </section>

    <section class="flex flex-col gap-2">
      <h2 class="text-sm font-semibold text-ink">导出当前帧</h2>
      <div class="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          class="cursor-pointer rounded-2xl bg-brand px-3 py-2.5 text-sm font-semibold text-paper hover:bg-ink"
          @click="$emit('download')"
        >
          下载 SVG
        </button>
        <button
          type="button"
          class="cursor-pointer rounded-2xl border-2 border-line px-3 py-2.5 text-sm font-semibold text-ink hover:border-ink"
          @click="$emit('copy')"
        >
          {{ copied ? '已复制' : '复制 SVG' }}
        </button>
      </div>
    </section>
  </div>
</template>
