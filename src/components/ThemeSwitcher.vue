<script setup lang="ts">
import { ref } from 'vue'
import { useTheme, type ThemeMode } from '../composables/useTheme'

const { currentMode, customConfig, setMode, updateCustomConfig, resetCustomConfig } = useTheme()

const showCustomPanel = ref(false)
const detailsRef = ref<HTMLDetailsElement | null>(null)

function selectMode(mode: ThemeMode) {
  setMode(mode)
  if (mode !== 'custom') {
    showCustomPanel.value = false
    if (detailsRef.value) detailsRef.value.open = false
  } else {
    showCustomPanel.value = true
  }
}
</script>

<template>
  <details ref="detailsRef" class="dropdown dropdown-end">
    <summary class="btn btn-ghost btn-xs gap-1 text-base-content/50 m-0" title="切换主题">
      <svg v-if="currentMode === 'light'" xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
      <svg v-else-if="currentMode === 'dark'" xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
      <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="10.5" r="2.5"/><circle cx="8.5" cy="7.5" r="2.5"/><circle cx="6.5" cy="12" r="2.5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>
      主题
    </summary>

    <ul class="dropdown-content menu menu-sm bg-base-100 border border-base-300 rounded-md shadow-sm z-60 p-1 mt-1" :class="showCustomPanel ? 'w-64' : 'w-40'">
      <li>
        <button
          class="flex items-center gap-2 text-xs"
          :class="currentMode === 'light' ? 'active' : ''"
          @click="selectMode('light')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          <span class="flex-1">浅色</span>
        </button>
      </li>
      <li>
        <button
          class="flex items-center gap-2 text-xs"
          :class="currentMode === 'dark' ? 'active' : ''"
          @click="selectMode('dark')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          <span class="flex-1">暗黑</span>
        </button>
      </li>
      <li class="border-t border-base-200 mt-0.5 pt-0.5">
        <button
          class="flex items-center gap-2 text-xs"
          :class="currentMode === 'custom' ? 'active' : ''"
          @click="selectMode('custom')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="10.5" r="2.5"/><circle cx="8.5" cy="7.5" r="2.5"/><circle cx="6.5" cy="12" r="2.5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>
          <span class="flex-1">自定义</span>
        </button>
      </li>

      <div v-if="showCustomPanel" class="border-t border-base-200 mt-1.5 pt-2 px-1 pb-1 space-y-2">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-medium text-base-content/50 uppercase tracking-wider">自定义配色</span>
          <button class="btn btn-ghost btn-xs text-[10px] text-base-content/30 p-0 min-h-0 h-auto" @click="resetCustomConfig">重置</button>
        </div>
        <label class="flex items-center gap-2">
          <input type="color" :value="customConfig.primary" @input="updateCustomConfig({ primary: ($event.target as HTMLInputElement).value })" class="w-5 h-5 rounded cursor-pointer border-0 p-0" />
          <span class="text-xs text-base-content/60">主题色</span>
        </label>
        <label class="flex items-center gap-2">
          <input type="color" :value="customConfig.base100" @input="updateCustomConfig({ base100: ($event.target as HTMLInputElement).value })" class="w-5 h-5 rounded cursor-pointer border-0 p-0" />
          <span class="text-xs text-base-content/60">背景色</span>
        </label>
        <label class="flex items-center gap-2">
          <input type="color" :value="customConfig.base200" @input="updateCustomConfig({ base200: ($event.target as HTMLInputElement).value })" class="w-5 h-5 rounded cursor-pointer border-0 p-0" />
          <span class="text-xs text-base-content/60">次要背景</span>
        </label>
        <label class="flex items-center gap-2">
          <input type="color" :value="customConfig.base300" @input="updateCustomConfig({ base300: ($event.target as HTMLInputElement).value })" class="w-5 h-5 rounded cursor-pointer border-0 p-0" />
          <span class="text-xs text-base-content/60">边框色</span>
        </label>
        <label class="flex items-center gap-2">
          <input type="color" :value="customConfig.baseContent" @input="updateCustomConfig({ baseContent: ($event.target as HTMLInputElement).value })" class="w-5 h-5 rounded cursor-pointer border-0 p-0" />
          <span class="text-xs text-base-content/60">文字色</span>
        </label>
      </div>
    </ul>
  </details>
</template>
