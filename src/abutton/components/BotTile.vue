<script setup lang="ts">
import { computed } from 'vue'
import { stillPose } from '../core/face'
import ButtonBot from './ButtonBot.vue'

const props = defineProps<{
  label: string
  selected: boolean
  shape: string
  skin: string
  finish: string
  expression: string
}>()
defineEmits<{ click: [] }>()

const pose = computed(() => stillPose(props.expression))
</script>

<template>
  <button
    type="button"
    class="group flex cursor-pointer flex-col items-center gap-1 rounded-2xl border-2 p-1.5 transition-colors"
    :class="selected ? 'border-ink bg-mist' : 'border-transparent hover:border-line hover:bg-mist/60'"
    :aria-pressed="selected"
    @click="$emit('click')"
  >
    <span class="block aspect-square w-full transition-transform group-active:scale-95">
      <ButtonBot :pose="pose" :shape="shape" :skin="skin" :finish="finish" view-box="62 62 276 290" shadow-color="#0A2240" />
    </span>
    <span class="text-xs font-medium leading-none text-ink">{{ label }}</span>
  </button>
</template>
