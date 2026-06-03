<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useResumeStore } from '../composables/useResumeStore'
import { useTemplate } from '../composables/useTemplate'
import { provideResumeData } from '../composables/useResume'
import ResumePreview from '../components/ResumePreview.vue'
import ExportDialog from '../components/ExportDialog.vue'
import TemplateCustomizer from '../components/TemplateCustomizer.vue'
import ThemeSwitcher from '../components/ThemeSwitcher.vue'
import type { ResumeData, TemplateId } from '../types/resume'
import { DEFAULT_SECTION_NAMES } from '../types/resume'

const props = defineProps<{ id: string }>()

const router = useRouter()
const { getResume, updateResume } = useResumeStore()
const { currentTemplate, templates, setTemplate, removeCustomTemplate } = useTemplate()

const resumeData = reactive<ResumeData>({
  personal: { name: '', title: '', email: '', phone: '', location: '', summary: '' },
  experiences: [],
  education: [],
  skills: [],
  skillsText: '',
  projects: [],
  sectionOrder: ['experiences', 'projects', 'education', 'skills'],
  customSections: {},
  sectionNames: { ...DEFAULT_SECTION_NAMES },
})

provideResumeData(resumeData)

const resumeTitle = ref('未命名简历')
const loaded = ref(false)
const showExportDialog = ref(false)
const showCustomizer = ref(false)
const showResetConfirm = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

onMounted(async () => {
  const record = await getResume(props.id)
  if (!record) {
    router.replace({ name: 'dashboard' })
    return
  }
  Object.assign(resumeData, record.data)
  if (!resumeData.skillsText && resumeData.skills?.length) {
    resumeData.skillsText = '<ul>' + resumeData.skills.map(s => `<li>${s.name}</li>`).join('') + '</ul>'
  }
  if (!resumeData.contactFields || !resumeData.contactFields.length) {
    resumeData.contactFields = [
      { id: 'email', type: 'email', label: '邮箱', value: resumeData.personal.email || '', visible: true },
      { id: 'phone', type: 'phone', label: '电话', value: resumeData.personal.phone || '', visible: true },
      { id: 'location', type: 'location', label: '城市', value: resumeData.personal.location || '', visible: true },
    ]
  }
  resumeTitle.value = record.title
  if (record.templateId) {
    setTemplate(record.templateId)
  }
  loaded.value = true
  setTimeout(() => { watchEnabled = true }, 100)
  document.addEventListener('click', onDocClick)
})

const hasUnsavedChanges = ref(false)
const showSaveToast = ref(false)
let watchEnabled = false

const autoSaveEnabled = ref(localStorage.getItem('resume_auto_save') !== 'false')
let autoSaveTimer: ReturnType<typeof setTimeout> | null = null

function toggleAutoSave() {
  autoSaveEnabled.value = !autoSaveEnabled.value
  localStorage.setItem('resume_auto_save', String(autoSaveEnabled.value))
  if (autoSaveEnabled.value && hasUnsavedChanges.value) {
    scheduleAutoSave()
  }
}

function scheduleAutoSave() {
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  autoSaveTimer = setTimeout(async () => {
    if (hasUnsavedChanges.value && autoSaveEnabled.value) {
      await updateResume(props.id, {
        title: resumeTitle.value,
        data: JSON.parse(JSON.stringify(resumeData)),
        templateId: currentTemplate.value,
      })
      hasUnsavedChanges.value = false
    }
  }, 1500)
}

watch(resumeData, () => {
  if (!watchEnabled) return
  hasUnsavedChanges.value = true
  if (autoSaveEnabled.value) scheduleAutoSave()
}, { deep: true })

watch(currentTemplate, () => {
  if (!watchEnabled) return
  hasUnsavedChanges.value = true
  if (autoSaveEnabled.value) scheduleAutoSave()
})

async function handleSave() {
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  await updateResume(props.id, {
    title: resumeTitle.value,
    data: JSON.parse(JSON.stringify(resumeData)),
    templateId: currentTemplate.value,
  })
  hasUnsavedChanges.value = false
  showSaveToast.value = true
  setTimeout(() => { showSaveToast.value = false }, 2000)
}

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  if (hasUnsavedChanges.value) {
    updateResume(props.id, {
      title: resumeTitle.value,
      data: JSON.parse(JSON.stringify(resumeData)),
      templateId: currentTemplate.value,
    })
  }
})

function handlePrint() {
  window.print()
}

async function handleImport(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files?.[0]) {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string) as ResumeData
        Object.assign(resumeData, data)
      } catch (err) {
        console.error('Import failed:', err)
      }
    }
    reader.readAsText(input.files[0])
    input.value = ''
  }
}

function confirmReset() {
  Object.assign(resumeData, {
    personal: { name: '', title: '', email: '', phone: '', location: '', summary: '' },
    contactFields: [
      { id: 'email', type: 'email', label: '邮箱', value: '', visible: true },
      { id: 'phone', type: 'phone', label: '电话', value: '', visible: true },
      { id: 'location', type: 'location', label: '城市', value: '', visible: true },
    ],
    experiences: [],
    education: [],
    skills: [],
    projects: [],
    sectionOrder: ['experiences', 'projects', 'education', 'skills'],
    customSections: {},
    sectionNames: { ...DEFAULT_SECTION_NAMES },
  })
  showResetConfirm.value = false
}

function pickTemplate(id: TemplateId) {
  setTemplate(id)
}

function handleEditTemplate(id: TemplateId) {
  setTemplate(id)
  showCustomizer.value = true
}

const showDeleteConfirm = ref(false)
const pendingDeleteId = ref<TemplateId | null>(null)

function handleDeleteTemplate(id: TemplateId) {
  pendingDeleteId.value = id
  showDeleteConfirm.value = true
}

function confirmDeleteTemplate() {
  if (pendingDeleteId.value) {
    removeCustomTemplate(pendingDeleteId.value)
    pendingDeleteId.value = null
  }
  showDeleteConfirm.value = false
}

const templateDropdownOpen = ref(false)
const templateDropdownRef = ref<HTMLElement | null>(null)
const builtinIds = new Set(['classic', 'modern', 'minimalist', 'ats'])
const currentTemplateName = computed(() => templates.value.find(t => t.id === currentTemplate.value)?.name || '选择模板')

function toggleDropdown() {
  templateDropdownOpen.value = !templateDropdownOpen.value
}

function selectTemplate(id: TemplateId) {
  pickTemplate(id)
  templateDropdownOpen.value = false
}

function onDocClick(e: MouseEvent) {
  if (templateDropdownRef.value && !templateDropdownRef.value.contains(e.target as Node)) {
    templateDropdownOpen.value = false
  }
}

function saveTitle() {
  const title = resumeTitle.value.trim() || '未命名简历'
  resumeTitle.value = title
  updateResume(props.id, { title })
}

function goBack() {
  router.push({ name: 'dashboard' })
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-base-200" v-if="loaded">
    <!-- Navbar -->
    <nav class="navbar no-print sticky top-0 z-50 px-4 lg:px-6 py-2 border-b border-base-300 bg-base-100 min-h-0">
      <div class="flex-1 flex items-center gap-2">
        <button class="btn btn-ghost btn-sm btn-square" @click="goBack" title="返回看板">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <input
          v-model="resumeTitle"
          @blur="saveTitle"
          @keyup.enter="($event.target as HTMLInputElement).blur()"
          class="input input-ghost input-sm text-sm font-semibold max-w-[160px] h-8"
        />
      </div>

      <!-- Template Dropdown -->
      <div ref="templateDropdownRef" class="relative mx-2">
        <button
          class="btn btn-sm btn-ghost gap-1.5 h-8 min-h-0 px-3 border border-base-300 font-medium text-xs"
          @click.stop="toggleDropdown"
        >
          {{ currentTemplateName }}
          <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 opacity-50 transition-transform" :class="{ 'rotate-180': templateDropdownOpen }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <ul v-if="templateDropdownOpen" class="menu menu-sm absolute top-full left-0 mt-1 bg-base-100 border border-base-300 rounded-box shadow-sm z-60 w-56 p-1">
          <li v-for="tmpl in templates" :key="tmpl.id">
            <a
              class="flex items-center gap-2"
              :class="currentTemplate === tmpl.id ? 'active' : ''"
              @click="selectTemplate(tmpl.id)"
            >
              <span
                class="w-2.5 h-2.5 rounded-full border-2 shrink-0"
                :class="currentTemplate === tmpl.id ? 'border-primary bg-primary' : 'border-base-content/30'"
              ></span>
              <span class="flex-1 min-w-0">
                <span class="block truncate text-xs">{{ tmpl.name }}</span>
                <span class="block truncate text-[10px] opacity-50 leading-tight">{{ tmpl.description }}</span>
              </span>
              <span v-if="!builtinIds.has(tmpl.id)" class="flex items-center gap-0.5 shrink-0" @click.stop>
                <button class="btn btn-ghost btn-xs p-0.5 min-h-0 h-auto" @click="handleEditTemplate(tmpl.id)" title="编辑">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button class="btn btn-ghost btn-xs p-0.5 min-h-0 h-auto text-error" @click="handleDeleteTemplate(tmpl.id)" title="删除">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </span>
            </a>
          </li>
          <li class="border-t border-base-200 mt-1 pt-1">
            <a class="flex items-center gap-2 text-base-content/50 hover:text-primary" @click="showCustomizer = true; templateDropdownOpen = false">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              <span>自定义模板</span>
            </a>
          </li>
        </ul>
      </div>

      <div class="flex-none flex items-center gap-0.5">
        <button
          v-if="!autoSaveEnabled"
          @click="handleSave"
          class="btn btn-ghost btn-xs gap-1"
          :class="hasUnsavedChanges ? 'text-primary' : 'text-base-content/25 btn-disabled'"
          :disabled="!hasUnsavedChanges"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          保存
        </button>
        <span v-else class="text-xs text-success/70 flex items-center gap-1 px-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          自动保存
        </span>

        <div class="dropdown dropdown-end">
          <div tabindex="0" role="button" class="btn btn-ghost btn-xs btn-circle text-base-content/50">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </div>
          <ul tabindex="0" class="dropdown-content menu bg-base-100 rounded-box shadow-lg border border-base-300 w-48 p-2 z-50">
            <li>
              <label class="flex items-center justify-between gap-2 cursor-pointer">
                <span class="text-xs">实时保存</span>
                <input type="checkbox" class="toggle toggle-xs toggle-primary" :checked="autoSaveEnabled" @change="toggleAutoSave" />
              </label>
            </li>
          </ul>
        </div>

        <div class="divider divider-horizontal mx-0.5 h-4"></div>

        <button class="btn btn-ghost btn-xs gap-1" @click="handlePrint">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          打印
        </button>

        <div class="divider divider-horizontal mx-0.5 h-4"></div>

        <button class="btn btn-ghost btn-xs gap-1 text-base-content/50" @click="fileInput?.click()">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          导入
        </button>
        <input ref="fileInput" type="file" accept=".json" class="hidden" @change="handleImport" />

        <button class="btn btn-ghost btn-xs gap-1 text-base-content/50" @click="showExportDialog = true">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          导出
        </button>

        <ThemeSwitcher />

        <button class="btn btn-ghost btn-xs gap-1 text-base-content/50 hover:text-error" @click="showResetConfirm = true">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
          重置
        </button>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="flex-1 py-8 px-4 lg:px-6">
      <ResumePreview :data="resumeData" />
    </main>

    <!-- Export Dialog -->
    <ExportDialog :open="showExportDialog" :data="resumeData" @close="showExportDialog = false" />

    <!-- Template Customizer -->
    <TemplateCustomizer :open="showCustomizer" @close="showCustomizer = false" />

    <!-- Reset Confirm Modal -->
    <dialog class="modal" :class="{ 'modal-open': showResetConfirm }">
      <div class="modal-box rounded-lg bg-base-100 border border-base-300">
        <h3 class="text-base font-bold text-base-content">确认重置</h3>
        <p class="text-sm text-base-content/60 mt-2">确定要清空所有简历数据吗？重置后数据将无法恢复。</p>
        <div class="modal-action">
          <button class="btn btn-ghost btn-sm" @click="showResetConfirm = false">取消</button>
          <button class="btn btn-error btn-sm" @click="confirmReset">确认重置</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop bg-black/30" @click="showResetConfirm = false">
        <button>close</button>
      </form>
    </dialog>

    <!-- Delete Template Confirm Modal -->
    <dialog class="modal" :class="{ 'modal-open': showDeleteConfirm }">
      <div class="modal-box rounded-lg bg-base-100 border border-base-300">
        <h3 class="text-base font-bold text-base-content">删除模板</h3>
        <p class="text-sm text-base-content/60 mt-2">确定要删除这个自定义模板吗？</p>
        <div class="modal-action">
          <button class="btn btn-ghost btn-sm" @click="showDeleteConfirm = false">取消</button>
          <button class="btn btn-error btn-sm" @click="confirmDeleteTemplate">确认删除</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop bg-black/30" @click="showDeleteConfirm = false">
        <button>close</button>
      </form>
    </dialog>

    <!-- Save Toast -->
    <Transition name="slide-toast">
      <div v-if="showSaveToast" class="fixed right-4 top-16 z-50">
        <div class="alert alert-success shadow-lg px-4 py-2.5 flex items-center gap-2 text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          <span>保存成功</span>
        </div>
      </div>
    </Transition>
  </div>

  <!-- Loading -->
  <div v-else class="min-h-screen flex items-center justify-center bg-base-200">
    <span class="loading loading-spinner loading-md text-primary"></span>
  </div>
</template>

<style scoped>
.slide-toast-enter-active {
  transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}
.slide-toast-leave-active {
  transition: all 0.25s ease-in;
}
.slide-toast-enter-from {
  transform: translateY(-100%);
  opacity: 0;
}
.slide-toast-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>
