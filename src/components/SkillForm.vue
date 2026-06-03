<script setup lang="ts">
import type { Skill } from '../types/resume'

const props = defineProps<{
  skills: Skill[]
}>()

const emit = defineEmits<{
  add: []
  remove: [id: string]
}>()

const levelLabels = ['入门', '初级', '中级', '熟练', '精通']
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <h3 class="font-bold text-lg flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        专业技能
      </h3>
      <button class="btn btn-sm btn-ghost btn-circle" @click="emit('add')">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>
    </div>

    <div v-if="!props.skills.length" class="text-sm text-base-content/50 text-center py-4">
      点击 + 添加技能
    </div>

    <div v-for="skill in props.skills" :key="skill.id" class="flex items-center gap-3">
      <input v-model="skill.name" type="text" placeholder="技能名称" class="input input-bordered input-sm flex-1" />
      <div class="flex items-center gap-1">
        <input v-model.number="skill.level" type="range" min="1" max="5" class="range range-xs range-primary w-24" />
        <span class="text-xs w-8 text-base-content/60">{{ levelLabels[skill.level - 1] }}</span>
      </div>
      <button class="btn btn-xs btn-ghost text-error" @click="emit('remove', skill.id)">×</button>
    </div>
  </div>
</template>
