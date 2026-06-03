<script setup lang="ts">
import type { Education } from '../types/resume'

const props = defineProps<{
  education: Education[]
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
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 4 3 6 3s6-1 6-3v-5"/></svg>
        教育背景
      </h3>
      <button class="btn btn-sm btn-ghost btn-circle" @click="emit('add')">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>
    </div>

    <div v-if="!props.education.length" class="text-sm text-base-content/50 text-center py-4">
      点击 + 添加教育背景
    </div>

    <div v-for="edu in props.education" :key="edu.id" class="card bg-base-200/50 p-4 space-y-3">
      <div class="flex justify-end">
        <button class="btn btn-xs btn-ghost text-error" @click="emit('remove', edu.id)">删除</button>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <label class="floating-label">
          <span>学校</span>
          <input v-model="edu.school" type="text" placeholder="学校" class="input input-bordered w-full" />
        </label>
        <label class="floating-label">
          <span>学历</span>
          <input v-model="edu.degree" type="text" placeholder="学历" class="input input-bordered w-full" />
        </label>
        <label class="floating-label">
          <span>专业</span>
          <input v-model="edu.major" type="text" placeholder="专业" class="input input-bordered w-full" />
        </label>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <label class="floating-label">
          <span>开始时间</span>
          <input v-model="edu.startDate" type="text" placeholder="开始时间" class="input input-bordered w-full" />
        </label>
        <label class="floating-label">
          <span>结束时间</span>
          <input v-model="edu.endDate" type="text" placeholder="结束时间" class="input input-bordered w-full" />
        </label>
      </div>
    </div>
  </div>
</template>
