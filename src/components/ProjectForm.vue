<script setup lang="ts">
import type { Project } from '../types/resume'

const props = defineProps<{
  projects: Project[]
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
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
        项目经历
      </h3>
      <button class="btn btn-sm btn-ghost btn-circle" @click="emit('add')">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>
    </div>

    <div v-if="!props.projects.length" class="text-sm text-base-content/50 text-center py-4">
      点击 + 添加项目经历
    </div>

    <div v-for="proj in props.projects" :key="proj.id" class="card bg-base-200/50 p-4 space-y-3">
      <div class="flex justify-end">
        <button class="btn btn-xs btn-ghost text-error" @click="emit('remove', proj.id)">删除</button>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <label class="floating-label">
          <span>项目名称</span>
          <input v-model="proj.name" type="text" placeholder="项目名称" class="input input-bordered w-full" />
        </label>
        <label class="floating-label">
          <span>担任角色</span>
          <input v-model="proj.role" type="text" placeholder="担任角色" class="input input-bordered w-full" />
        </label>
        <label class="floating-label">
          <span>开始时间</span>
          <input v-model="proj.startDate" type="text" placeholder="开始时间" class="input input-bordered w-full" />
        </label>
        <label class="floating-label">
          <span>结束时间</span>
          <input v-model="proj.endDate" type="text" placeholder="结束时间" class="input input-bordered w-full" />
        </label>
      </div>
      <label class="floating-label">
        <span>项目描述</span>
        <textarea v-model="proj.description" placeholder="项目描述" class="textarea textarea-bordered w-full" rows="3" />
      </label>
    </div>
  </div>
</template>
