<script setup lang="ts">
import { ref } from 'vue'

export type TabId = 'look' | 'face' | 'state' | 'tune'
const TABS: { id: TabId; label: string }[] = [
  { id: 'look', label: '外观' },
  { id: 'face', label: '表情' },
  { id: 'state', label: '状态' },
  { id: 'tune', label: '调试' }
]
const tab = ref<TabId>('state')

function onKey(e: KeyboardEvent, i: number) {
  if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
  const next = (i + (e.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length
  tab.value = TABS[next]!.id
  document.getElementById(`ab-tab-${TABS[next]!.id}`)?.focus()
}
</script>

<template>
  <aside class="flex min-h-0 flex-col overflow-hidden rounded-3xl bg-paper text-ink shadow-xl">
    <div class="flex gap-1 border-b border-line p-2" role="tablist" aria-label="调试面板">
      <button
        v-for="(t, i) in TABS"
        :id="`ab-tab-${t.id}`"
        :key="t.id"
        type="button"
        role="tab"
        :aria-selected="tab === t.id"
        :aria-controls="`ab-panel-${t.id}`"
        :tabindex="tab === t.id ? 0 : -1"
        class="flex-1 cursor-pointer rounded-xl px-3 py-2 text-sm font-semibold transition-colors"
        :class="tab === t.id ? 'bg-mist text-ink' : 'text-muted hover:text-ink'"
        @click="tab = t.id"
        @keydown="onKey($event, i)"
      >
        {{ t.label }}
      </button>
    </div>
    <div
      :id="`ab-panel-${tab}`"
      role="tabpanel"
      :aria-labelledby="`ab-tab-${tab}`"
      class="min-h-0 flex-1 overflow-y-auto p-4"
    >
      <slot :name="tab" />
    </div>
  </aside>
</template>
