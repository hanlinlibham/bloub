<script setup lang="ts">
import { SHAPES } from '../core/shapes'
import { FINISHES, SKINS, STAGES } from '../core/skins'
import BotTile from './BotTile.vue'
import Segmented from './Segmented.vue'

const shape = defineModel<string>('shape', { required: true })
const skin = defineModel<string>('skin', { required: true })
const finish = defineModel<string>('finish', { required: true })
const stage = defineModel<string>('stage', { required: true })
const frame = defineModel<boolean>('frame', { required: true })
defineProps<{ mood: string }>()
</script>

<template>
  <div class="flex flex-col gap-5">
    <section class="flex flex-col gap-2">
      <h2 class="text-sm font-semibold text-ink">形状</h2>
      <div class="grid grid-cols-4 gap-1.5">
        <BotTile
          v-for="s in SHAPES"
          :key="s.id"
          :label="s.name"
          :selected="s.id === shape"
          :shape="s.id"
          :skin="skin"
          :finish="finish"
          :expression="mood"
          @click="shape = s.id"
        />
      </div>
    </section>

    <section class="flex flex-col gap-2">
      <h2 class="text-sm font-semibold text-ink">颜色</h2>
      <div class="grid grid-cols-8 gap-1.5">
        <button
          v-for="c in SKINS"
          :key="c.id"
          type="button"
          class="flex aspect-square cursor-pointer items-center justify-center rounded-full border-2 transition-colors"
          :class="c.id === skin ? 'border-ink' : 'border-transparent hover:border-line'"
          :aria-label="c.name"
          :aria-pressed="c.id === skin"
          :title="c.name"
          @click="skin = c.id"
        >
          <span
            class="flex h-[80%] w-[80%] items-center justify-center rounded-full ring-1 ring-ink/10 ring-inset"
            :style="{ background: c.face }"
          >
            <span class="grid grid-cols-2 gap-0.5">
              <i v-for="n in 4" :key="n" class="block h-1 w-1 rounded-full" :style="{ background: c.hole }" />
            </span>
          </span>
        </button>
      </div>
    </section>

    <section class="flex flex-col gap-2">
      <h2 class="text-sm font-semibold text-ink">材质</h2>
      <Segmented v-model="finish" :options="FINISHES.map((x) => ({ value: x.id, label: x.name }))" label="材质" />
    </section>

    <section class="flex flex-col gap-2">
      <h2 class="text-sm font-semibold text-ink">舞台</h2>
      <Segmented v-model="stage" :options="STAGES.map((x) => ({ value: x.id, label: x.name }))" label="舞台背景" />
      <label class="flex cursor-pointer items-center justify-between gap-3 rounded-xl px-1 py-1.5 text-sm text-ink">
        显示 logo 外框
        <input v-model="frame" type="checkbox" class="h-4 w-4 accent-[var(--color-brand)]" />
      </label>
    </section>
  </div>
</template>
