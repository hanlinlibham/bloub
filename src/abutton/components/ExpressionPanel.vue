<script setup lang="ts">
import { EXPRESSIONS } from '../core/expressions'
import BotTile from './BotTile.vue'

const mood = defineModel<string>('mood', { required: true })
defineProps<{ shape: string; skin: string; finish: string }>()
const emit = defineEmits<{ picked: [] }>()

function pick(id: string) {
  mood.value = id
  emit('picked')
}
</script>

<template>
  <section class="flex flex-col gap-2">
    <h2 class="text-sm font-semibold text-ink">基础表情</h2>
    <p class="text-xs leading-relaxed text-muted">
      选中的表情是扣扣发呆和注视时的默认情绪。思考、说话、被戳等状态会临时覆盖它。
    </p>
    <div class="grid grid-cols-4 gap-1.5">
      <BotTile
        v-for="e in EXPRESSIONS"
        :key="e.id"
        :label="e.name"
        :selected="e.id === mood"
        :shape="shape"
        :skin="skin"
        :finish="finish"
        :expression="e.id"
        @click="pick(e.id)"
      />
    </div>
  </section>
</template>
