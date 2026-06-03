<script setup lang="ts">
import { useTemplate } from '../composables/useTemplate'
import type { TemplateId } from '../types/resume'

const { currentTemplate, templates, setTemplate } = useTemplate()

function pick(id: TemplateId) {
  setTemplate(id)
}
</script>

<template>
  <div>
    <h3 class="font-semibold text-base mb-3 flex items-center gap-2">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
      选择模版
    </h3>
    <div class="grid grid-cols-4 gap-3">
      <button
        v-for="tmpl in templates"
        :key="tmpl.id"
        class="btn btn-ghost group relative h-auto p-1 transition-all hover:shadow-md border-2"
        :class="currentTemplate === tmpl.id ? 'border-primary shadow-md' : 'border-base-300 hover:border-base-content/20'"
        @click="pick(tmpl.id)"
      >
        <!-- Mini preview illustration -->
        <div class="aspect-[210/297] rounded bg-white overflow-hidden p-2">
          <!-- Classic -->
          <template v-if="tmpl.id === 'classic'">
            <div class="border-b-2 border-gray-800 pb-1.5 mb-1.5">
              <div class="h-2 w-12 bg-gray-800 rounded-sm"></div>
              <div class="h-1 w-8 bg-gray-300 rounded-sm mt-1"></div>
            </div>
            <div class="space-y-1.5">
              <div>
                <div class="h-1 w-6 bg-gray-200 rounded-sm mb-1"></div>
                <div class="h-1 w-full bg-gray-100 rounded-sm"></div>
                <div class="h-1 w-3/4 bg-gray-100 rounded-sm mt-0.5"></div>
              </div>
              <div>
                <div class="h-1 w-6 bg-gray-200 rounded-sm mb-1"></div>
                <div class="h-1 w-full bg-gray-100 rounded-sm"></div>
                <div class="h-1 w-2/3 bg-gray-100 rounded-sm mt-0.5"></div>
              </div>
              <div>
                <div class="h-1 w-6 bg-gray-200 rounded-sm mb-1"></div>
                <div class="flex gap-1 mt-1">
                  <div class="h-1.5 w-6 bg-gray-100 rounded-full"></div>
                  <div class="h-1.5 w-5 bg-gray-100 rounded-full"></div>
                  <div class="h-1.5 w-7 bg-gray-100 rounded-full"></div>
                </div>
              </div>
            </div>
          </template>

          <!-- Modern -->
          <template v-if="tmpl.id === 'modern'">
            <div class="bg-blue-600 -mx-2 -mt-2 px-2 py-2 mb-1.5">
              <div class="h-2 w-12 bg-white/90 rounded-sm"></div>
              <div class="h-1 w-8 bg-white/40 rounded-sm mt-1"></div>
            </div>
            <div class="flex gap-1.5">
              <div class="w-1/3 space-y-1.5">
                <div>
                  <div class="h-1 w-full bg-blue-100 rounded-sm mb-1"></div>
                  <div class="h-1 w-full bg-gray-100 rounded-sm"></div>
                  <div class="h-1 w-full bg-gray-100 rounded-sm mt-0.5"></div>
                </div>
                <div>
                  <div class="h-1 w-full bg-blue-100 rounded-sm mb-1"></div>
                  <div class="h-1 w-full bg-gray-100 rounded-sm"></div>
                </div>
              </div>
              <div class="w-2/3 space-y-1.5">
                <div>
                  <div class="h-1 w-8 bg-blue-100 rounded-sm mb-1"></div>
                  <div class="h-1 w-full bg-gray-100 rounded-sm"></div>
                  <div class="h-1 w-3/4 bg-gray-100 rounded-sm mt-0.5"></div>
                </div>
                <div>
                  <div class="h-1 w-8 bg-blue-100 rounded-sm mb-1"></div>
                  <div class="h-1 w-full bg-gray-100 rounded-sm"></div>
                  <div class="h-1 w-2/3 bg-gray-100 rounded-sm mt-0.5"></div>
                </div>
              </div>
            </div>
          </template>

          <!-- Minimalist -->
          <template v-if="tmpl.id === 'minimalist'">
            <div class="text-center mb-2">
              <div class="h-2 w-14 bg-gray-800 rounded-sm mx-auto"></div>
              <div class="h-1 w-8 bg-emerald-300 rounded-sm mx-auto mt-1"></div>
              <div class="w-6 h-px bg-emerald-400 mx-auto mt-1.5"></div>
            </div>
            <div class="space-y-1.5">
              <div>
                <div class="flex items-center gap-1 mb-1">
                  <div class="h-px bg-gray-200 flex-1"></div>
                  <div class="h-1 w-6 bg-emerald-200 rounded-sm"></div>
                  <div class="h-px bg-gray-200 flex-1"></div>
                </div>
                <div class="h-1 w-full bg-gray-100 rounded-sm"></div>
                <div class="h-1 w-3/4 bg-gray-100 rounded-sm mt-0.5"></div>
              </div>
              <div>
                <div class="flex items-center gap-1 mb-1">
                  <div class="h-px bg-gray-200 flex-1"></div>
                  <div class="h-1 w-6 bg-emerald-200 rounded-sm"></div>
                  <div class="h-px bg-gray-200 flex-1"></div>
                </div>
                <div class="h-1 w-full bg-gray-100 rounded-sm"></div>
                <div class="h-1 w-2/3 bg-gray-100 rounded-sm mt-0.5"></div>
              </div>
            </div>
          </template>

          <!-- ATS Professional -->
          <template v-if="tmpl.id === 'ats'">
            <div class="text-center mb-2">
              <div class="h-2 w-16 bg-gray-900 rounded-sm mx-auto"></div>
              <div class="h-0.5 w-20 bg-gray-300 rounded-sm mx-auto mt-1"></div>
            </div>
            <div class="space-y-1.5">
              <div>
                <div class="h-px bg-gray-900 w-full mb-1"></div>
                <div class="h-1 w-10 bg-gray-900 rounded-sm mb-0.5" style="font-size:0;letter-spacing:0.1em;"></div>
                <div class="h-1 w-full bg-gray-100 rounded-sm"></div>
                <div class="h-1 w-5/6 bg-gray-100 rounded-sm mt-0.5"></div>
                <div class="h-1 w-4/5 bg-gray-100 rounded-sm mt-0.5"></div>
              </div>
              <div>
                <div class="h-px bg-gray-900 w-full mb-1"></div>
                <div class="h-1 w-8 bg-gray-900 rounded-sm mb-0.5"></div>
                <div class="h-1 w-full bg-gray-100 rounded-sm"></div>
                <div class="h-1 w-3/4 bg-gray-100 rounded-sm mt-0.5"></div>
              </div>
            </div>
          </template>
        </div>

        <!-- Label -->
        <div class="text-center py-1.5">
          <p class="text-xs font-medium">{{ tmpl.name }}</p>
        </div>

        <!-- Active indicator -->
        <div v-if="currentTemplate === tmpl.id"
          class="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 text-primary-content" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
      </button>
    </div>
    <p class="text-xs text-base-content/50 mt-2">
      {{ templates.find(t => t.id === currentTemplate)?.description }}
    </p>
  </div>
</template>
