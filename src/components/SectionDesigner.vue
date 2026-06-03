<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import type { CustomSectionFieldDef, CustomFieldType, FieldStyle } from '../types/resume'
import { VueDraggable } from 'vue-draggable-plus'

const props = defineProps<{
  open: boolean
  sectionKey: string
  fields: CustomSectionFieldDef[]
}>()

const emit = defineEmits<{
  close: []
  save: [fields: CustomSectionFieldDef[]]
}>()

const localFields = ref<CustomSectionFieldDef[]>([])
const selectedFieldId = ref<string | null>(null)

const selectedField = computed(() =>
  localFields.value.find(f => f.id === selectedFieldId.value) || null
)

const BUILTIN_PRESETS: Record<string, () => CustomSectionFieldDef[]> = {
  personal: () => [
    { id: 'name', type: 'text', label: '姓名', placeholder: '你的姓名', style: { fontSize: '24px', fontWeight: 'bold', color: '#111827', textAlign: 'left', width: '100%' } },
    { id: 'title', type: 'text', label: '职位头衔', placeholder: '职位 / 头衔', style: { fontSize: '16px', fontWeight: 'normal', color: '#4b5563', textAlign: 'left', width: '100%' } },
    { id: 'email', type: 'text', label: '邮箱', placeholder: '邮箱', style: { fontSize: '14px', fontWeight: 'normal', color: '#6b7280', textAlign: 'left', width: '33%' } },
    { id: 'phone', type: 'text', label: '电话', placeholder: '电话', style: { fontSize: '14px', fontWeight: 'normal', color: '#6b7280', textAlign: 'left', width: '33%' } },
    { id: 'location', type: 'text', label: '城市', placeholder: '城市', style: { fontSize: '14px', fontWeight: 'normal', color: '#6b7280', textAlign: 'left', width: '33%' } },
  ],
  experiences: () => [
    { id: 'company', type: 'text', label: '公司名称', placeholder: '公司名称', style: { fontSize: '16px', fontWeight: '600', color: '#111827', textAlign: 'left', width: '60%' } },
    { id: 'dates', type: 'daterange', label: '时间', placeholder: '开始', style: { fontSize: '12px', fontWeight: 'normal', color: '#9ca3af', textAlign: 'right', width: '40%' } },
    { id: 'position', type: 'text', label: '职位', placeholder: '职位', style: { fontSize: '14px', fontWeight: 'normal', color: '#4b5563', textAlign: 'left', width: '100%' } },
    { id: 'description', type: 'richtext', label: '描述', placeholder: '工作内容和成就...', style: { fontSize: '14px', fontWeight: 'normal', color: '#4b5563', textAlign: 'left', width: '100%' } },
  ],
  projects: () => [
    { id: 'name', type: 'text', label: '项目名称', placeholder: '项目名称', style: { fontSize: '16px', fontWeight: '600', color: '#111827', textAlign: 'left', width: '60%' } },
    { id: 'dates', type: 'daterange', label: '时间', placeholder: '开始', style: { fontSize: '12px', fontWeight: 'normal', color: '#9ca3af', textAlign: 'right', width: '40%' } },
    { id: 'role', type: 'text', label: '担任角色', placeholder: '担任角色', style: { fontSize: '14px', fontWeight: 'normal', color: '#4b5563', textAlign: 'left', width: '100%' } },
    { id: 'description', type: 'richtext', label: '描述', placeholder: '项目内容和贡献...', style: { fontSize: '14px', fontWeight: 'normal', color: '#4b5563', textAlign: 'left', width: '100%' } },
  ],
  education: () => [
    { id: 'school', type: 'text', label: '学校', placeholder: '学校名称', style: { fontSize: '16px', fontWeight: '600', color: '#111827', textAlign: 'left', width: '60%' } },
    { id: 'dates', type: 'daterange', label: '时间', placeholder: '开始', style: { fontSize: '12px', fontWeight: 'normal', color: '#9ca3af', textAlign: 'right', width: '40%' } },
    { id: 'degree', type: 'text', label: '学历', placeholder: '学历', style: { fontSize: '14px', fontWeight: 'normal', color: '#4b5563', textAlign: 'left', width: '50%' } },
    { id: 'major', type: 'text', label: '专业', placeholder: '专业', style: { fontSize: '14px', fontWeight: 'normal', color: '#4b5563', textAlign: 'left', width: '50%' } },
  ],
}

watch(() => props.open, (open) => {
  if (open) {
    if (props.fields.length) {
      localFields.value = JSON.parse(JSON.stringify(props.fields))
    } else if (BUILTIN_PRESETS[props.sectionKey]) {
      localFields.value = BUILTIN_PRESETS[props.sectionKey]()
    } else {
      localFields.value = []
    }
    selectedFieldId.value = null
  }
})

interface PaletteItem {
  type: CustomFieldType
  label: string
  icon: string
}

const PALETTE: PaletteItem[] = [
  { type: 'text', label: '文本', icon: 'T' },
  { type: 'textarea', label: '多行文本', icon: '¶' },
  { type: 'date', label: '日期', icon: '📅' },
  { type: 'daterange', label: '日期范围', icon: '⇔' },
  { type: 'richtext', label: '富文本', icon: 'R' },
]

const paletteSource = ref<PaletteItem[]>([...PALETTE])

watch(paletteSource, () => {
  nextTick(() => { paletteSource.value = [...PALETTE] })
})

const FONT_SIZES = ['12px', '13px', '14px', '16px', '18px', '20px', '24px']
const FONT_WEIGHTS = [
  { value: 'normal', label: '常规' },
  { value: '500', label: '中等' },
  { value: '600', label: '半粗' },
  { value: 'bold', label: '粗体' },
]
const TEXT_ALIGNS = [
  { value: 'left', icon: '⊣' },
  { value: 'center', icon: '⊡' },
  { value: 'right', icon: '⊢' },
]

function generateId() {
  return 'f_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5)
}

function onPaletteClone(item: PaletteItem): CustomSectionFieldDef {
  return {
    id: generateId(),
    type: item.type,
    label: item.label,
    placeholder: '',
    style: {
      fontSize: '14px',
      fontWeight: 'normal',
      color: '#374151',
      textAlign: 'left',
      width: '100%',
    },
  }
}

function removeField(id: string) {
  const idx = localFields.value.findIndex(f => f.id === id)
  if (idx !== -1) localFields.value.splice(idx, 1)
  if (selectedFieldId.value === id) selectedFieldId.value = null
}

function updateStyle(key: keyof FieldStyle, value: string) {
  if (selectedField.value) {
    if (!selectedField.value.style) selectedField.value.style = {}
    selectedField.value.style[key] = value
  }
}

// Resize logic
const resizing = ref<{ id: string; startX: number; startWidth: number } | null>(null)
const canvasRef = ref<HTMLElement | null>(null)

function startResize(e: MouseEvent, field: CustomSectionFieldDef) {
  e.stopPropagation()
  e.preventDefault()
  const canvasWidth = canvasRef.value?.clientWidth || 600
  const currentWidthPct = parseFloat(field.style?.width || '100') || 100
  const startWidthPx = (currentWidthPct / 100) * canvasWidth
  resizing.value = { id: field.id, startX: e.clientX, startWidth: startWidthPx }
  document.addEventListener('mousemove', onResize)
  document.addEventListener('mouseup', stopResize)
}

function onResize(e: MouseEvent) {
  if (!resizing.value || !canvasRef.value) return
  const canvasWidth = canvasRef.value.clientWidth
  const delta = e.clientX - resizing.value.startX
  const newWidthPx = Math.max(80, resizing.value.startWidth + delta)
  let pct = Math.round((newWidthPx / canvasWidth) * 100)
  pct = Math.min(100, Math.max(10, pct))
  const field = localFields.value.find(f => f.id === resizing.value!.id)
  if (field) {
    if (!field.style) field.style = {}
    field.style.width = pct + '%'
  }
}

function stopResize() {
  resizing.value = null
  document.removeEventListener('mousemove', onResize)
  document.removeEventListener('mouseup', stopResize)
}

function handleSave() {
  emit('save', JSON.parse(JSON.stringify(localFields.value)))
  emit('close')
}
</script>

<template>
  <dialog class="modal" :class="{ 'modal-open': open }">
    <div class="modal-box rounded-2xl shadow-2xl border border-gray-100/80 bg-white/98 backdrop-blur-lg max-w-5xl w-[92vw] p-0 flex flex-col max-h-[85vh]">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-100/80 flex items-center justify-between shrink-0 bg-linear-to-r from-gray-50/50 to-transparent">
        <div>
          <h3 class="text-sm font-bold text-gray-800 tracking-tight">板块布局设计器</h3>
          <p class="text-[11px] text-gray-400 mt-0.5 font-light">从左侧拖拽组件到画布，拖动右边缘调整宽度</p>
        </div>
        <div class="flex items-center gap-2">
          <button class="btn btn-ghost btn-sm" @click="emit('close')">取消</button>
          <button class="btn btn-primary btn-sm" @click="handleSave">保存布局</button>
        </div>
      </div>

      <!-- Body -->
      <div class="flex flex-1 min-h-0 overflow-hidden">
        <!-- Left: Palette (drag source) -->
        <div class="w-40 border-r border-gray-100/80 p-4 shrink-0 bg-gray-50/30">
          <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">组件面板</p>
          <VueDraggable
            v-model="paletteSource"
            :group="{ name: 'designer', pull: 'clone', put: false }"
            :clone="onPaletteClone"
            :sort="false"
            :animation="200"
            class="space-y-2"
          >
            <div
              v-for="item in paletteSource"
              :key="item.type"
              class="flex items-center gap-2.5 px-3 py-2.5 text-xs rounded-xl border border-gray-200/80 hover:border-indigo-300 hover:bg-white hover:shadow-sm text-gray-600 hover:text-indigo-600 cursor-grab active:cursor-grabbing transition-all duration-200 select-none"
            >
              <span class="w-7 h-7 rounded-lg bg-white shadow-sm border border-gray-100 flex items-center justify-center text-[11px] font-bold shrink-0">{{ item.icon }}</span>
              <span class="font-medium">{{ item.label }}</span>
            </div>
          </VueDraggable>
        </div>

        <!-- Center: Canvas -->
        <div class="flex-1 p-6 overflow-y-auto relative" ref="canvasRef" style="background-color: #fafbff; background-image: linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px); background-size: 20px 20px;">
          <VueDraggable
            v-model="localFields"
            :group="{ name: 'designer', put: true }"
            :animation="300"
            ghost-class="designer-ghost"
            drag-class="designer-dragging"
            class="min-h-[200px] flex flex-wrap gap-2.5 content-start relative"
          >
            <div
              v-for="field in localFields"
              :key="field.id"
              class="relative group rounded-xl border-2 bg-white transition-all duration-250 overflow-hidden"
              :class="[
                selectedFieldId === field.id ? 'border-indigo-400 shadow-lg shadow-indigo-100/60 ring-2 ring-indigo-50' : 'border-gray-200/80 hover:border-gray-300 shadow-sm hover:shadow-md',
                resizing ? '' : 'cursor-pointer'
              ]"
              :style="{ width: field.style?.width || '100%', minHeight: '60px' }"
              @click="selectedFieldId = field.id"
            >
              <!-- Field content -->
              <div class="p-3.5">
                <div class="flex items-center gap-1.5 mb-1.5">
                  <span class="badge badge-xs badge-primary badge-outline font-semibold uppercase tracking-wide">
                    {{ PALETTE.find(p => p.type === field.type)?.label }}
                  </span>
                  <span class="text-[11px] text-gray-400 truncate font-light">{{ field.label }}</span>
                </div>
                <div
                  class="border border-dashed border-gray-200 rounded-lg px-3 py-2 text-gray-400 truncate"
                  :style="{
                    fontSize: field.style?.fontSize || '14px',
                    fontWeight: field.style?.fontWeight || 'normal',
                    color: field.style?.color || '#9ca3af',
                    textAlign: (field.style?.textAlign || 'left') as any,
                  }"
                >
                  {{ field.placeholder || field.label || '...' }}
                </div>
              </div>

              <!-- Delete button -->
              <button
                class="btn btn-ghost btn-xs btn-circle absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-base-content/30 hover:text-error transition-all"
                @click.stop="removeField(field.id)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>

              <!-- Resize handle (right edge) -->
              <div
                class="absolute right-0 top-0 bottom-0 w-2.5 cursor-col-resize opacity-0 group-hover:opacity-100 hover:bg-indigo-100/60 transition-all rounded-r-xl"
                @mousedown="startResize($event, field)"
              >
                <div class="absolute top-1/2 right-0.5 -translate-y-1/2 w-1 h-7 rounded-full bg-indigo-300/80"></div>
              </div>
            </div>
          </VueDraggable>

          <!-- Empty state -->
          <div v-if="!localFields.length" class="absolute inset-0 flex flex-col items-center justify-center text-gray-300 pointer-events-none">
            <div class="w-16 h-16 rounded-2xl bg-gray-100/60 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" stroke-dasharray="4 4"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
            </div>
            <p class="text-sm font-medium text-gray-400">从左侧拖入组件开始设计</p>
            <p class="text-xs text-gray-300 mt-1">支持拖拽排序和调整宽度</p>
          </div>
        </div>

        <!-- Right: Properties -->
        <div class="w-56 border-l border-gray-100/80 p-4 shrink-0 overflow-y-auto bg-gray-50/20">
          <template v-if="selectedField">
            <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">属性配置</p>

            <div class="mb-3.5">
              <label class="text-[11px] text-gray-500 mb-1.5 block font-medium">标签</label>
              <input v-model="selectedField.label" class="input input-bordered input-sm w-full text-xs" />
            </div>
            <div class="mb-3.5">
              <label class="text-[11px] text-gray-500 mb-1.5 block font-medium">占位文本</label>
              <input v-model="selectedField.placeholder" class="input input-bordered input-sm w-full text-xs" placeholder="提示文字..." />
            </div>

            <div class="h-px bg-gray-100 my-4"></div>
            <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">样式</p>

            <div class="mb-3.5">
              <label class="text-[11px] text-gray-500 mb-1.5 block font-medium">字号</label>
              <select
                :value="selectedField.style?.fontSize || '14px'"
                @change="updateStyle('fontSize', ($event.target as HTMLSelectElement).value)"
                class="select select-bordered select-sm w-full text-xs"
              >
                <option v-for="s in FONT_SIZES" :key="s" :value="s">{{ s }}</option>
              </select>
            </div>

            <div class="mb-3.5">
              <label class="text-[11px] text-gray-500 mb-1.5 block font-medium">字重</label>
              <div class="join w-full">
                <button
                  v-for="fw in FONT_WEIGHTS"
                  :key="fw.value"
                  @click="updateStyle('fontWeight', fw.value)"
                  class="btn btn-xs join-item flex-1"
                  :class="(selectedField.style?.fontWeight || 'normal') === fw.value
                    ? 'btn-active btn-primary'
                    : ''"
                >{{ fw.label }}</button>
              </div>
            </div>

            <div class="mb-3.5">
              <label class="text-[11px] text-gray-500 mb-1.5 block font-medium">颜色</label>
              <div class="flex items-center gap-2">
                <input
                  type="color"
                  :value="selectedField.style?.color || '#374151'"
                  @input="updateStyle('color', ($event.target as HTMLInputElement).value)"
                  class="w-8 h-8 rounded-lg border border-base-300 cursor-pointer shrink-0 p-0.5"
                />
                <input
                  :value="selectedField.style?.color || '#374151'"
                  @input="updateStyle('color', ($event.target as HTMLInputElement).value)"
                  class="input input-bordered input-sm flex-1 text-xs font-mono"
                />
              </div>
            </div>

            <div class="mb-3.5">
              <label class="text-[11px] text-gray-500 mb-1.5 block font-medium">对齐</label>
              <div class="join w-full">
                <button
                  v-for="ta in TEXT_ALIGNS"
                  :key="ta.value"
                  @click="updateStyle('textAlign', ta.value)"
                  class="btn btn-xs join-item flex-1"
                  :class="(selectedField.style?.textAlign || 'left') === ta.value
                    ? 'btn-active btn-primary'
                    : ''"
                >{{ ta.icon }}</button>
              </div>
            </div>

            <div class="mb-3.5">
              <label class="text-[11px] text-gray-500 mb-1.5 block font-medium">宽度 <span class="text-indigo-400 font-mono">{{ selectedField.style?.width || '100%' }}</span></label>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                :value="parseInt(selectedField.style?.width || '100')"
                @input="updateStyle('width', ($event.target as HTMLInputElement).value + '%')"
                class="range range-xs range-primary w-full"
              />
              <div class="flex justify-between text-[9px] text-gray-300 mt-1">
                <span>10%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </template>

          <div v-else class="flex flex-col items-center justify-center h-full text-gray-300 text-center px-3">
            <div class="w-12 h-12 rounded-xl bg-gray-100/60 flex items-center justify-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
            </div>
            <p class="text-[11px] text-gray-400">选中画布中的组件</p>
            <p class="text-[11px] text-gray-300 mt-0.5">即可编辑属性</p>
          </div>
        </div>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop bg-black/20 backdrop-blur-sm" @click="emit('close')">
      <button>close</button>
    </form>
  </dialog>
</template>

<style scoped>
.designer-ghost {
  opacity: 0.3;
  border-color: rgb(129, 140, 248) !important;
  background: rgb(238, 242, 255) !important;
  border-radius: 12px;
}
.designer-dragging {
  opacity: 0.9;
  transform: rotate(1.5deg) scale(1.02);
  box-shadow: 0 20px 60px rgba(99, 102, 241, 0.15), 0 4px 16px rgba(0, 0, 0, 0.08);
}
</style>
