<script setup lang="ts">
import type { Experience } from '../types/resume'

const props = defineProps<{
  experiences: Experience[]
}>()

const emit = defineEmits<{
  add: []
  remove: [id: string]
}>()
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <h3 class="font-bold text-lg flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
        工作经历
      </h3>
      <button class="btn btn-sm btn-ghost btn-circle" @click="emit('add')">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>
    </div>

    <div v-if="!props.experiences.length" class="text-sm text-base-content/50 text-center py-4">
      点击 + 添加工作经历
    </div>

    <div v-for="exp in props.experiences" :key="exp.id" class="card bg-base-200/50 p-4 space-y-3">
      <div class="flex justify-end">
        <button class="btn btn-xs btn-ghost text-error" @click="emit('remove', exp.id)">删除</button>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <label class="floating-label">
          <span>公司</span>
          <input v-model="exp.company" type="text" placeholder="公司" class="input input-bordered w-full" />
        </label>
        <label class="floating-label">
          <span>职位</span>
          <input v-model="exp.position" type="text" placeholder="职位" class="input input-bordered w-full" />
        </label>
        <label class="floating-label">
          <span>开始时间</span>
          <input v-model="exp.startDate" type="text" placeholder="开始时间" class="input input-bordered w-full" />
        </label>
        <label class="floating-label">
          <span>结束时间</span>
          <input v-model="exp.endDate" type="text" placeholder="结束时间（或至今）" class="input input-bordered w-full" />
        </label>
      </div>
      <label class="floating-label">
        <span>工作描述</span>
        <textarea v-model="exp.description" placeholder="工作描述" class="textarea textarea-bordered w-full" rows="3" />
      </label>
    </div>
  </div>
</template>
