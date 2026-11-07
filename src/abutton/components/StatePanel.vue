<script setup lang="ts">
import { ref } from 'vue'
import type { ButtonLife, Lock } from '../core/life'

const props = defineProps<{ life: ButtonLife }>()
const lock = defineModel<Lock>('lock', { required: true })
const active = ref<string>(lock.value)

const STATES: { id: Lock; label: string; hint: string }[] = [
  { id: 'auto', label: '自动', hint: 'AUTO' },
  { id: 'idle', label: '发呆', hint: 'IDLE' },
  { id: 'gaze', label: '注视', hint: 'GAZE' },
  { id: 'thinking', label: '思考', hint: 'THINKING' },
  { id: 'speaking', label: '说话', hint: 'SPEAKING' },
  { id: 'sleep', label: '睡觉', hint: 'SLEEP' }
]

function choose(id: Lock) {
  props.life.activity()
  active.value = id
  if (id === 'thinking') {
    lock.value = 'auto'
    props.life.think()
    return
  }
  if (id === 'speaking') {
    lock.value = 'auto'
    props.life.speakLine(() => (active.value = 'auto'))
    return
  }
  props.life.clearTask()
  lock.value = id
}

function poke() {
  props.life.pressStart()
  setTimeout(() => props.life.pressEnd(), 200)
}

const msg = ref('')
function send() {
  const v = msg.value.trim()
  if (!v) return
  msg.value = ''
  lock.value = 'auto'
  active.value = 'thinking'
  props.life.reply(
    v,
    () => (active.value = 'speaking'),
    () => (active.value = 'auto')
  )
}
function onEnter(e: KeyboardEvent) {
  if (e.isComposing || e.keyCode === 229) return
  e.preventDefault()
  send()
}
</script>

<template>
  <div class="flex flex-col gap-5">
    <section class="flex flex-col gap-2">
      <h2 class="text-sm font-semibold text-ink">Agent 状态</h2>
      <div class="grid grid-cols-3 gap-1.5">
        <button
          v-for="s in STATES"
          :key="s.id"
          type="button"
          class="flex cursor-pointer flex-col items-center gap-0.5 rounded-2xl border-2 px-2 py-2.5 text-sm font-semibold transition-colors"
          :class="active === s.id ? 'border-ink bg-ink text-paper' : 'border-line text-ink hover:border-ink'"
          :aria-pressed="active === s.id"
          @click="choose(s.id)"
        >
          {{ s.label }}
          <small class="font-mono text-[10px] font-medium tracking-wider opacity-70">{{ s.hint }}</small>
        </button>
      </div>
    </section>

    <section class="flex flex-col gap-2">
      <h2 class="text-sm font-semibold text-ink">互动</h2>
      <div class="grid grid-cols-2 gap-1.5">
        <button type="button" class="action" @click="poke">戳一下 <small>CLICK</small></button>
        <button type="button" class="action" @click="life.flip()">翻个面 <small>FLIP</small></button>
      </div>
      <p class="text-xs leading-relaxed text-muted">
        舞台上：单击压扁回弹，快速连点 4 下会转晕，双击翻面，按住拖动可以把它拉长。
      </p>
    </section>

    <section class="flex flex-col gap-2">
      <h2 class="text-sm font-semibold text-ink">对话测试</h2>
      <form class="flex gap-2" @submit.prevent="send">
        <label for="ab-msg" class="sr-only">和扣扣说点什么</label>
        <input
          id="ab-msg"
          v-model="msg"
          autocomplete="off"
          placeholder="和扣扣说点什么…"
          class="min-w-0 flex-1 rounded-full border-2 border-line bg-paper px-4 py-2.5 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none"
          @focus="life.setInput(true, msg.length)"
          @blur="life.setInput(false, 0)"
          @input="life.setInput(true, msg.length)"
          @keydown.enter="onEnter"
        />
        <button type="submit" class="cursor-pointer rounded-full bg-brand px-5 text-sm font-bold text-paper hover:bg-ink">
          发送
        </button>
      </form>
    </section>
  </div>
</template>

<style scoped>
@reference '../styles.css';
.action {
  @apply flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-line px-3 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-ink;
}
.action small {
  @apply font-mono text-[10px] font-medium tracking-wider opacity-60;
}
</style>
