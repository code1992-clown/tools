<script setup lang="ts">
import { computed } from 'vue'
import type { ResumeData } from '../types/resume'
import { useTemplate } from '../composables/useTemplate'
import ClassicTemplate from './templates/ClassicTemplate.vue'
import ModernTemplate from './templates/ModernTemplate.vue'
import MinimalistTemplate from './templates/MinimalistTemplate.vue'
import ATSTemplate from './templates/ATSTemplate.vue'

defineProps<{
  data: ResumeData
}>()

const { baseTemplateId, activeConfig, getConfigCSSVars } = useTemplate()

const templateComponents = {
  classic: ClassicTemplate,
  modern: ModernTemplate,
  minimalist: MinimalistTemplate,
  ats: ATSTemplate,
} as const

const cssVars = computed(() => {
  if (!activeConfig.value) return {}
  return getConfigCSSVars(activeConfig.value)
})
</script>

<template>
  <div :style="cssVars" :class="{ 'custom-template': !!activeConfig }">
    <component :is="templateComponents[baseTemplateId]" :data="data" />
  </div>
</template>
