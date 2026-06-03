<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useTemplate } from '../composables/useTemplate'
import type { TemplateConfig } from '../types/resume'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const {
  currentTemplate,
  builtinTemplates,
  customTemplates,
  activeConfig,
  setTemplate,
  addCustomTemplate,
  updateCustomTemplate,
  removeCustomTemplate,
} = useTemplate()

const editingConfig = ref<TemplateConfig | null>(null)

watch(() => activeConfig.value, (cfg) => {
  if (cfg) {
    editingConfig.value = JSON.parse(JSON.stringify(cfg))
  } else {
    editingConfig.value = null
  }
}, { immediate: true })

const isCustom = computed(() => !!activeConfig.value)

function createCustom() {
  const baseId = currentTemplate.value
  const base = (baseId === 'classic' || baseId === 'modern' || baseId === 'minimalist') ? baseId : 'classic'
  const config = addCustomTemplate(base)
  editingConfig.value = JSON.parse(JSON.stringify(config))
}

function saveChanges() {
  if (!editingConfig.value) return
  updateCustomTemplate(editingConfig.value.id, editingConfig.value)
}

function deleteTemplate() {
  if (!editingConfig.value) return
  removeCustomTemplate(editingConfig.value.id)
  editingConfig.value = null
}

function handleColorChange(key: keyof TemplateConfig['colors'], value: string) {
  if (!editingConfig.value) return
  editingConfig.value.colors[key] = value
  saveChanges()
}

function handleFontChange(key: keyof TemplateConfig['fonts'], value: string) {
  if (!editingConfig.value) return
  editingConfig.value.fonts[key] = value
  saveChanges()
}

function handleSizeChange(key: keyof TemplateConfig['fontSize'], value: number) {
  if (!editingConfig.value) return
  editingConfig.value.fontSize[key] = value
  saveChanges()
}

function handleSpacingChange(key: keyof TemplateConfig['spacing'], value: number) {
  if (!editingConfig.value) return
  editingConfig.value.spacing[key] = value
  saveChanges()
}

function handleNameChange(value: string) {
  if (!editingConfig.value) return
  editingConfig.value.name = value
  saveChanges()
}

function handleBaseChange(base: 'classic' | 'modern' | 'minimalist') {
  if (!editingConfig.value) return
  editingConfig.value.baseTemplate = base
  saveChanges()
}

const fontOptions = [
  { label: '系统默认', value: 'system-ui, sans-serif' },
  { label: '微软雅黑', value: '"Microsoft YaHei", sans-serif' },
  { label: '宋体', value: '"SimSun", serif' },
  { label: '黑体', value: '"SimHei", sans-serif' },
  { label: 'Noto Sans SC', value: '"Noto Sans SC", sans-serif' },
  { label: 'Inter', value: '"Inter", system-ui, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Courier', value: '"Courier New", monospace' },
]
</script>

<template>
  <dialog class="modal" :class="{ 'modal-open': open }">
    <div class="modal-box max-w-lg max-h-[85vh] rounded-lg bg-base-100 border border-base-300">
      <h3 class="text-base font-bold text-base-content">自定义模板</h3>
      <p class="text-xs text-base-content/40 mt-0.5 mb-4">调整颜色、字体和间距</p>

      <!-- Custom templates list -->
      <div v-if="customTemplates.length" class="mb-4">
        <p class="text-xs font-medium text-base-content/50 mb-2">你的自定义模板</p>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="tmpl in customTemplates"
            :key="tmpl.id"
            class="btn btn-sm"
            :class="currentTemplate === tmpl.id ? 'btn-primary' : 'btn-outline'"
            @click="setTemplate(tmpl.id)"
          >
            <span class="w-2.5 h-2.5 rounded-full inline-block mr-1" :style="{ background: tmpl.colors.accent }"></span>
            {{ tmpl.name }}
          </button>
        </div>
      </div>

      <!-- Create or edit -->
      <div v-if="!isCustom" class="text-center py-6">
        <p class="text-sm text-base-content/50 mb-3">当前使用内置模板，创建自定义模板以调整样式</p>
        <button class="btn btn-primary btn-sm" @click="createCustom">+ 创建自定义模板</button>
      </div>

      <!-- Customizer -->
      <div v-else-if="editingConfig" class="space-y-4">
        <!-- Name -->
        <div>
          <label class="text-xs font-medium text-base-content/50 mb-1 block">模板名称</label>
          <input
            :value="editingConfig.name"
            @input="handleNameChange(($event.target as HTMLInputElement).value)"
            class="input input-bordered input-sm w-full"
          />
        </div>

        <!-- Base template -->
        <div>
          <label class="text-xs font-medium text-base-content/50 mb-1 block">基础布局</label>
          <div class="flex gap-1.5">
            <button
              v-for="b in builtinTemplates"
              :key="b.id"
              class="btn btn-sm flex-1"
              :class="editingConfig.baseTemplate === b.id ? 'btn-primary' : 'btn-outline'"
              @click="handleBaseChange(b.id as 'classic' | 'modern' | 'minimalist')"
            >
              {{ b.name }}
            </button>
          </div>
        </div>

        <!-- Colors -->
        <div>
          <label class="text-xs font-medium text-base-content/50 mb-2 block">颜色</label>
          <div class="grid grid-cols-3 gap-3">
            <div v-for="(label, key) in { accent: '强调色', headerBg: '头部背景', headerText: '头部文字', text: '正文', subtext: '辅助文字', background: '页面背景' }" :key="key" class="flex flex-col items-center gap-1">
              <label class="relative cursor-pointer">
                <input
                  type="color"
                  :value="editingConfig.colors[key as keyof typeof editingConfig.colors]"
                  @input="handleColorChange(key as keyof typeof editingConfig.colors, ($event.target as HTMLInputElement).value)"
                  class="sr-only"
                />
                <div class="w-7 h-7 rounded border border-base-300 hover:border-primary transition-colors"
                  :style="{ backgroundColor: editingConfig.colors[key as keyof typeof editingConfig.colors] }">
                </div>
              </label>
              <span class="text-[10px] text-base-content/40">{{ label }}</span>
            </div>
          </div>
        </div>

        <!-- Fonts -->
        <div>
          <label class="text-xs font-medium text-base-content/50 mb-2 block">字体</label>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <span class="text-[10px] text-base-content/40 block mb-1">标题字体</span>
              <select
                :value="editingConfig.fonts.heading"
                @change="handleFontChange('heading', ($event.target as HTMLSelectElement).value)"
                class="select select-bordered select-xs w-full"
              >
                <option v-for="opt in fontOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </div>
            <div>
              <span class="text-[10px] text-base-content/40 block mb-1">正文字体</span>
              <select
                :value="editingConfig.fonts.body"
                @change="handleFontChange('body', ($event.target as HTMLSelectElement).value)"
                class="select select-bordered select-xs w-full"
              >
                <option v-for="opt in fontOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Font sizes -->
        <div>
          <label class="text-xs font-medium text-base-content/50 mb-2 block">字号</label>
          <div class="space-y-2">
            <div v-for="(label, key) in { name: '姓名', sectionTitle: '段落标题', body: '正文' }" :key="key" class="flex items-center gap-3">
              <span class="text-xs text-base-content/40 w-14 shrink-0">{{ label }}</span>
              <input
                type="range"
                :min="key === 'name' ? 20 : key === 'sectionTitle' ? 8 : 10"
                :max="key === 'name' ? 48 : key === 'sectionTitle' ? 18 : 20"
                :value="editingConfig.fontSize[key as keyof typeof editingConfig.fontSize]"
                @input="handleSizeChange(key as keyof typeof editingConfig.fontSize, +($event.target as HTMLInputElement).value)"
                class="range range-xs range-primary flex-1"
              />
              <span class="text-xs text-base-content/40 w-8 text-right">{{ editingConfig.fontSize[key as keyof typeof editingConfig.fontSize] }}px</span>
            </div>
          </div>
        </div>

        <!-- Spacing -->
        <div>
          <label class="text-xs font-medium text-base-content/50 mb-2 block">间距</label>
          <div class="space-y-2">
            <div v-for="(label, key) in { pagePadding: '页面内边距', sectionGap: '段落间距' }" :key="key" class="flex items-center gap-3">
              <span class="text-xs text-base-content/40 w-20 shrink-0">{{ label }}</span>
              <input
                type="range" min="16" max="64"
                :value="editingConfig.spacing[key as keyof typeof editingConfig.spacing]"
                @input="handleSpacingChange(key as keyof typeof editingConfig.spacing, +($event.target as HTMLInputElement).value)"
                class="range range-xs range-primary flex-1"
              />
              <span class="text-xs text-base-content/40 w-8 text-right">{{ editingConfig.spacing[key as keyof typeof editingConfig.spacing] }}px</span>
            </div>
          </div>
        </div>

        <!-- Delete -->
        <div class="pt-2 border-t border-base-300">
          <button class="btn btn-ghost btn-sm text-error" @click="deleteTemplate">删除此自定义模板</button>
        </div>
      </div>

      <div class="modal-action mt-4">
        <button class="btn btn-ghost btn-sm" @click="emit('close')">关闭</button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop bg-black/30" @click="emit('close')">
      <button>close</button>
    </form>
  </dialog>
</template>
