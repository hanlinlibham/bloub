<script setup lang="ts">
const model = defineModel<string>({ required: true })
defineProps<{ options: { value: string; label: string; hint?: string }[]; label: string }>()
</script>

<template>
  <div class="flex gap-1 rounded-2xl bg-mist p-1" role="group" :aria-label="label">
    <button
      v-for="o in options"
      :key="o.value"
      type="button"
      class="flex flex-1 cursor-pointer flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-sm font-medium transition-colors"
      :class="model === o.value ? 'bg-paper text-ink shadow-sm' : 'text-muted hover:text-ink'"
      :aria-pressed="model === o.value"
      @click="model = o.value"
    >
      {{ o.label }}
      <small v-if="o.hint" class="font-mono text-[10px] tracking-wider opacity-70">{{ o.hint }}</small>
    </button>
  </div>
</template>
