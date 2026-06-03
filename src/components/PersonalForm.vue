<script setup lang="ts">
import type { PersonalInfo } from '../types/resume'

defineProps<{
  personal: PersonalInfo
}>()
</script>

<template>
  <div class="space-y-3">
    <h3 class="font-bold text-lg flex items-center gap-2">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      基本信息
    </h3>

    <div class="grid grid-cols-2 gap-3">
      <label class="floating-label">
        <span>姓名</span>
        <input v-model="personal.name" type="text" placeholder="姓名" class="input input-bordered w-full" />
      </label>
      <label class="floating-label">
        <span>职位</span>
        <input v-model="personal.title" type="text" placeholder="职位" class="input input-bordered w-full" />
      </label>
      <label class="floating-label">
        <span>邮箱</span>
        <input v-model="personal.email" type="email" placeholder="邮箱" class="input input-bordered w-full" />
      </label>
      <label class="floating-label">
        <span>电话</span>
        <input v-model="personal.phone" type="tel" placeholder="电话" class="input input-bordered w-full" />
      </label>
    </div>

    <label class="floating-label">
      <span>所在城市</span>
      <input v-model="personal.location" type="text" placeholder="所在城市" class="input input-bordered w-full" />
    </label>

    <label class="floating-label">
      <span>个人简介</span>
      <textarea v-model="personal.summary" placeholder="个人简介" class="textarea textarea-bordered w-full" rows="3" />
    </label>
  </div>
</template>
