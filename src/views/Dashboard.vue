<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useResumeStore } from '../composables/useResumeStore'
import ThemeSwitcher from '../components/ThemeSwitcher.vue'
import Fuse from 'fuse.js'
import gsap from 'gsap'
import type { ResumeRecord } from '../db'
import resumeBg from '../assets/resume.png'

const router = useRouter()
const { allResumes, loading, loadAllResumes, createResume, duplicateResume, deleteResume, updateResume } = useResumeStore()

const showDeleteConfirm = ref<string | null>(null)
const editingTitle = ref<string | null>(null)
const editTitleValue = ref('')
const gridRef = ref<HTMLElement | null>(null)
const welcomeToastRef = ref<HTMLElement | null>(null)
const WELCOME_SHOWN_KEY = 'resume-welcome-shown'
const showWelcome = ref(!sessionStorage.getItem(WELCOME_SHOWN_KEY))

const bgRef = ref<HTMLElement | null>(null)
const subtitleRef = ref<HTMLElement | null>(null)
const subtitleText = '管理你的所有简历，随时编辑和导出'
const displayedSubtitle = ref('')

function typeSubtitle() {
  let i = 0
  const timer = setInterval(() => {
    if (i < subtitleText.length) {
      displayedSubtitle.value += subtitleText[i]
      i++
    } else {
      clearInterval(timer)
      if (subtitleRef.value) subtitleRef.value.classList.add('typing-done')
    }
  }, 80)
}

const showSearch = ref(false)
const searchQuery = ref('')
const searchResults = ref<Fuse.FuseResult<ResumeRecord>[]>([])
const searchInputRef = ref<HTMLInputElement | null>(null)

let debounceTimer: ReturnType<typeof setTimeout> | null = null
let fuseInstance: Fuse<ResumeRecord> | null = null

function buildFuseIndex() {
  fuseInstance = new Fuse(allResumes.value, {
    keys: [
      { name: 'title', weight: 2 },
      { name: 'data.personal.name', weight: 1.5 },
      { name: 'data.personal.title', weight: 1.2 },
      { name: 'data.personal.email', weight: 0.8 },
      { name: 'data.experiences.company', weight: 1 },
      { name: 'data.experiences.position', weight: 1 },
      { name: 'data.projects.name', weight: 1 },
      { name: 'data.education.school', weight: 0.8 },
      { name: 'data.education.major', weight: 0.8 },
      { name: 'data.skills.name', weight: 0.8 },
    ],
    threshold: 0.4,
    includeMatches: true,
    minMatchCharLength: 1,
    useExtendedSearch: false,
  })
}

function openSearch() {
  buildFuseIndex()
  showSearch.value = true
  searchQuery.value = ''
  searchResults.value = []
  nextTick(() => searchInputRef.value?.focus())
}

function closeSearch() {
  showSearch.value = false
  searchQuery.value = ''
  searchResults.value = []
}

function onSearchInput() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    if (!fuseInstance || !searchQuery.value.trim()) {
      searchResults.value = []
      return
    }
    searchResults.value = fuseInstance.search(searchQuery.value.trim())
  }, 200)
}

function goToResult(id: string) {
  closeSearch()
  router.push({ name: 'editor', params: { id } })
}

const keyLabelMap: Record<string, string> = {
  'title': '简历名称',
  'data.personal.name': '姓名',
  'data.personal.title': '职位',
  'data.personal.email': '邮箱',
  'data.experiences.company': '公司',
  'data.experiences.position': '职位',
  'data.projects.name': '项目',
  'data.education.school': '学校',
  'data.education.major': '专业',
  'data.skills.name': '技能',
}

function getMatchLabel(key: string): string {
  return keyLabelMap[key] || key
}

function highlightMatch(value: string, indices: readonly [number, number][]): string {
  if (!indices || !indices.length) return escapeHtml(value)
  const sorted = [...indices].sort((a, b) => a[0] - b[0])
  let result = ''
  let lastIdx = 0
  for (const [start, end] of sorted) {
    result += escapeHtml(value.slice(lastIdx, start))
    result += `<mark class="bg-primary/20 text-primary rounded px-0.5">${escapeHtml(value.slice(start, end + 1))}</mark>`
    lastIdx = end + 1
  }
  result += escapeHtml(value.slice(lastIdx))
  return result
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function getUniqueMatches(result: Fuse.FuseResult<ResumeRecord>) {
  if (!result.matches) return []
  const seen = new Set<string>()
  return result.matches.filter(m => {
    const key = `${m.key}:${m.value}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }).slice(0, 3)
}

watch(searchQuery, onSearchInput)

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && showSearch.value) {
    closeSearch()
  }
}

function dismissWelcome() {
  sessionStorage.setItem(WELCOME_SHOWN_KEY, '1')
  if (welcomeToastRef.value) {
    gsap.to(welcomeToastRef.value, {
      x: 400,
      opacity: 0,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => { showWelcome.value = false }
    })
  } else {
    showWelcome.value = false
  }
}

onMounted(async () => {
  typeSubtitle()
  if (bgRef.value) {
    gsap.to(bgRef.value, {
      x: 30,
      y: -20,
      scale: 1.05,
      duration: 12,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    })
  }
  await loadAllResumes()
  document.addEventListener('keydown', onKeydown)
  nextTick(() => {
    if (gridRef.value && gridRef.value.children.length) {
      gsap.fromTo(gridRef.value.children,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.06, ease: 'power2.out', onComplete: setup3DCards }
      )
    }
    if (welcomeToastRef.value) {
      gsap.fromTo(welcomeToastRef.value,
        { x: 300, opacity: 0 },
        {
          x: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.2)', delay: 0.5,
          onComplete: () => {
            setTimeout(dismissWelcome, 2000)
          }
        }
      )
    }
  })
})

function setup3DCards() {
  if (!gridRef.value) return
  const cards = gridRef.value.querySelectorAll('.resume-card-3d') as NodeListOf<HTMLElement>
  cards.forEach(card => {
    const glowEl = card.querySelector('.card-glow-border') as HTMLElement | null
    const onMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(2)
      const y = ((e.clientY - rect.top) / rect.height * 100).toFixed(2)
      card.style.setProperty('--x', `${x}%`)
      card.style.setProperty('--y', `${y}%`)
      if (glowEl) glowEl.style.visibility = 'visible'
    }
    const onLeave = () => {
      if (glowEl) glowEl.style.visibility = 'hidden'
    }
    card.addEventListener('mousemove', onMove)
    card.addEventListener('mouseleave', onLeave)
    ;(card as any)._3d = { onMove, onLeave }
  })
}

function cleanup3DCards() {
  if (!gridRef.value) return
  const cards = gridRef.value.querySelectorAll('.resume-card-3d') as NodeListOf<HTMLElement>
  cards.forEach(card => {
    const l = (card as any)._3d
    if (l) {
      card.removeEventListener('mousemove', l.onMove)
      card.removeEventListener('mouseleave', l.onLeave)
    }
  })
}

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  if (debounceTimer) clearTimeout(debounceTimer)
  cleanup3DCards()
})

async function handleCreate() {
  const id = await createResume()
  router.push({ name: 'editor', params: { id } })
}

function openEditor(id: string) {
  router.push({ name: 'editor', params: { id } })
}

async function handleDuplicate(id: string) {
  await duplicateResume(id)
}

async function handleDelete(id: string) {
  await deleteResume(id)
  showDeleteConfirm.value = null
}

function startEditTitle(id: string, currentTitle: string) {
  editingTitle.value = id
  editTitleValue.value = currentTitle
}

async function saveTitle(id: string) {
  if (editTitleValue.value.trim()) {
    await updateResume(id, { title: editTitleValue.value.trim() })
  }
  editingTitle.value = null
}

function getCardGradient(templateId?: string): string {
  switch (templateId) {
    case 'modern': return 'bg-gradient-to-br from-indigo-600 via-blue-700 to-cyan-600'
    case 'minimalist': return 'bg-gradient-to-br from-slate-700 via-gray-800 to-zinc-900'
    default: return 'bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900'
  }
}

function getTemplateBadgeClass(templateId?: string): string {
  switch (templateId) {
    case 'modern': return 'badge-info'
    case 'minimalist': return 'badge-neutral'
    default: return 'badge-primary'
  }
}

function getTemplateBadgeLabel(templateId?: string): string {
  switch (templateId) {
    case 'modern': return '现代'
    case 'minimalist': return '简约'
    case 'classic': return '经典'
    default: return templateId?.startsWith('custom') ? '自定义' : '经典'
  }
}

function formatDate(ts: number) {
  const d = new Date(ts)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`
  return d.toLocaleDateString('zh-CN')
}
</script>

<template>
  <div class="min-h-screen bg-base-200 relative overflow-hidden">
    <!-- Background image with animation -->
    <img ref="bgRef" :src="resumeBg" class="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-30" alt="" />
    <!-- Header -->
    <header class="sticky top-0 z-50 bg-base-100 border-b border-base-300">
      <div class="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button class="btn btn-ghost btn-sm btn-square" @click="router.push({ name: 'home' })" title="返回首页">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div>
            <h1 class="text-xl font-bold text-base-content tracking-tight">简历管理</h1>
            <p ref="subtitleRef" class="typing-text text-xs text-base-content/40 mt-0.5">{{ displayedSubtitle }}</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <ThemeSwitcher />
          <button class="btn btn-ghost btn-sm gap-1.5 text-base-content/50" @click="openSearch">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            搜索
          </button>
          <button class="btn btn-primary btn-sm gap-1.5" @click="handleCreate">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            新建简历
          </button>
        </div>
      </div>
    </header>

    <!-- Content -->
    <main class="max-w-5xl mx-auto px-6 py-8 relative z-10">
      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <span class="loading loading-spinner loading-md text-primary"></span>
      </div>

      <!-- Empty state -->
      <div v-else-if="!allResumes.length" class="flex flex-col items-center justify-center py-24 animate-fade-in">
        <div class="w-16 h-16 rounded-xl bg-base-300 flex items-center justify-center mb-5">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-base-content/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
        </div>
        <h2 class="text-lg font-semibold text-base-content mb-1">还没有简历</h2>
        <p class="text-sm text-base-content/40 mb-6">点击下方按钮创建你的第一份简历</p>
        <button class="btn btn-primary btn-sm gap-1.5" @click="handleCreate">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          创建第一份简历
        </button>
      </div>

      <!-- Resume grid -->
      <div v-else ref="gridRef" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <!-- Create new card -->
        <button
          @click="handleCreate"
          class="btn btn-outline btn-block group flex flex-col items-center justify-center min-h-[200px] border-2 border-dashed border-base-300 hover:border-primary/40 hover:bg-primary/5"
        >
          <div class="w-10 h-10 rounded-lg bg-base-300 group-hover:bg-primary/10 flex items-center justify-center mb-2 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-base-content/30 group-hover:text-primary transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </div>
          <span class="text-sm text-base-content/40 group-hover:text-primary font-medium transition-colors">新建简历</span>
        </button>

        <!-- Resume cards -->
        <div
          v-for="(resume, index) in allResumes"
          :key="resume.id"
          class="resume-card-3d cursor-pointer group relative"
          @click="openEditor(resume.id)"
        >
          <div class="card-glow-border"></div>
          <div class="card-inner card bg-base-100 border border-base-300/60 overflow-hidden relative">
          <!-- Preview header with template-based gradient -->
          <div class="h-32 flex items-center justify-center relative overflow-hidden">
            <div
              class="absolute inset-0 transition-all duration-500 group-hover:scale-105"
              :class="getCardGradient(resume.templateId)"
            ></div>
            <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            <div class="relative text-center px-5 z-10">
              <div v-if="resume.data.personal.avatar" class="w-10 h-10 rounded-full mx-auto mb-2 border-2 border-white/40 overflow-hidden shadow-sm">
                <img :src="resume.data.personal.avatar" class="w-full h-full object-cover" alt="" />
              </div>
              <div class="text-base font-bold text-white truncate max-w-[200px] drop-shadow-sm">
                {{ resume.data.personal.name || '未填写姓名' }}
              </div>
              <div class="text-xs text-white/70 mt-0.5 truncate max-w-[200px]">
                {{ resume.data.personal.title || '未填写职位' }}
              </div>
            </div>
          </div>

          <!-- Card body -->
          <div class="card-body p-4 gap-2">
            <div class="flex items-center gap-2">
              <div v-if="editingTitle === resume.id" class="flex-1" @click.stop>
                <input
                  v-model="editTitleValue"
                  @keyup.enter="saveTitle(resume.id)"
                  @blur="saveTitle(resume.id)"
                  class="input input-bordered input-sm w-full"
                  autofocus
                />
              </div>
              <h3 v-else class="card-title text-sm truncate flex-1" @dblclick.stop="startEditTitle(resume.id, resume.title)">
                {{ resume.title }}
              </h3>
              <span class="badge badge-xs px-1.5 py-0.5 text-[10px] font-normal" :class="getTemplateBadgeClass(resume.templateId)">
                {{ getTemplateBadgeLabel(resume.templateId) }}
              </span>
            </div>

            <div class="flex items-center gap-3 text-xs text-base-content/40">
              <span class="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                {{ formatDate(resume.updatedAt) }}
              </span>
              <span class="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                {{ resume.data.experiences.length + resume.data.projects.length }} 条经历
              </span>
            </div>

            <div class="card-actions justify-end mt-1 opacity-0 group-hover:opacity-100 transition-opacity" @click.stop>
              <button class="btn btn-ghost btn-xs text-base-content/40 hover:text-primary" @click.stop="startEditTitle(resume.id, resume.title)" title="重命名">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="btn btn-ghost btn-xs text-base-content/40 hover:text-primary" @click.stop="handleDuplicate(resume.id)" title="复制">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              </button>
              <button class="btn btn-ghost btn-xs text-base-content/40 hover:text-error" @click.stop="showDeleteConfirm = resume.id" title="删除">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Welcome Toast -->
    <div
      v-if="showWelcome"
      ref="welcomeToastRef"
      class="fixed top-20 right-6 z-50 opacity-0"
    >
      <div class="alert bg-base-100 border border-primary/20 shadow-lg shadow-primary/10 max-w-xs">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-primary shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
        <div>
          <h3 class="font-bold text-sm">欢迎来到简历工具</h3>
          <p class="text-xs text-base-content/60">创建、编辑和导出你的专业简历</p>
        </div>
        <button class="btn btn-ghost btn-xs btn-circle" @click="dismissWelcome">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>

    <!-- Search Modal -->
    <dialog class="modal" :class="{ 'modal-open': showSearch }">
      <div class="modal-box rounded-lg bg-base-100 border border-base-300 max-w-lg p-0">
        <!-- Search input -->
        <div class="flex items-center gap-3 px-4 py-3 border-b border-base-200">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-base-content/30 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            placeholder="搜索简历名称、姓名、公司、技能..."
            class="input input-ghost input-sm flex-1 border-none focus:outline-none"
          />
          <kbd v-if="!searchQuery" class="kbd kbd-sm text-base-content/30">ESC</kbd>
          <button v-else class="btn btn-ghost btn-xs btn-circle" @click="searchQuery = ''">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <!-- Results -->
        <div class="max-h-80 overflow-y-auto">
          <!-- No query -->
          <div v-if="!searchQuery.trim()" class="px-4 py-8 text-center text-xs text-base-content/30">
            输入关键词搜索简历
          </div>

          <!-- No results -->
          <div v-else-if="searchResults.length === 0" class="px-4 py-8 text-center text-xs text-base-content/30">
            未找到匹配的简历
          </div>

          <!-- Result list -->
          <ul v-else class="p-2">
            <li
              v-for="result in searchResults"
              :key="result.item.id"
              class="rounded-md hover:bg-base-200 transition-colors cursor-pointer"
              @click="goToResult(result.item.id)"
            >
              <div class="flex items-start gap-3 px-3 py-2.5">
                <div class="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between gap-2">
                    <div class="text-sm font-medium text-base-content truncate">{{ result.item.title }}</div>
                    <div class="text-xs text-base-content/25 shrink-0">{{ formatDate(result.item.updatedAt) }}</div>
                  </div>
                  <div class="text-xs text-base-content/40 truncate mt-0.5">
                    {{ result.item.data.personal.name || '未填写' }}
                    <template v-if="result.item.data.personal.title"> · {{ result.item.data.personal.title }}</template>
                  </div>
                  <div v-if="getUniqueMatches(result).length" class="flex flex-wrap gap-1 mt-1.5">
                    <span
                      v-for="(match, mi) in getUniqueMatches(result)"
                      :key="mi"
                      class="inline-flex items-center gap-1 text-xs bg-base-200 rounded px-1.5 py-0.5"
                    >
                      <span class="text-base-content/40">{{ getMatchLabel(match.key!) }}</span>
                      <span class="text-base-content/70" v-html="highlightMatch(match.value!, match.indices)"></span>
                    </span>
                  </div>
                </div>
              </div>
            </li>
          </ul>
        </div>

        <!-- Footer -->
        <div v-if="searchResults.length > 0" class="px-4 py-2 border-t border-base-200 text-xs text-base-content/30">
          找到 {{ searchResults.length }} 条结果
        </div>
      </div>
      <form method="dialog" class="modal-backdrop bg-black/30" @click="closeSearch">
        <button>close</button>
      </form>
    </dialog>

    <!-- Delete confirm modal -->
    <dialog class="modal" :class="{ 'modal-open': showDeleteConfirm }">
      <div class="modal-box rounded-lg bg-base-100 border border-base-300">
        <h3 class="text-base font-bold text-base-content">删除简历</h3>
        <p class="text-sm text-base-content/60 mt-2">确定要删除这份简历吗？删除后数据无法恢复。</p>
        <div class="modal-action">
          <button class="btn btn-ghost btn-sm" @click="showDeleteConfirm = null">取消</button>
          <button class="btn btn-error btn-sm" @click="handleDelete(showDeleteConfirm!)">确认删除</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop bg-black/30" @click="showDeleteConfirm = null">
        <button>close</button>
      </form>
    </dialog>
  </div>
</template>

<style scoped>
.resume-card-3d {
  --x: 50%;
  --y: 50%;
  position: relative;
  border-radius: 1rem;
}

.card-glow-border {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: conic-gradient(
    from 0deg,
    #03a9f4,
    #e91e63,
    #9c27b0,
    #ff5722,
    #03a9f4
  );
  visibility: hidden;
  mask: radial-gradient(
    circle 150px at var(--x) var(--y),
    #000 20%,
    transparent 80%
  );
  -webkit-mask: radial-gradient(
    circle 150px at var(--x) var(--y),
    #000 20%,
    transparent 80%
  );
  z-index: 0;
}

.card-inner {
  position: relative;
  z-index: 1;
  margin: 2px;
  border-radius: calc(1rem - 2px);
}

.resume-card-3d:hover .card-inner {
  border-color: transparent;
}


.typing-text {
  border-right: 1.5px solid currentColor;
  padding-right: 2px;
  animation: cursorBlink 0.8s step-end infinite;
}

.typing-text.typing-done {
  animation: cursorBlink 0.8s step-end 3;
  animation-fill-mode: forwards;
  border-color: transparent;
}

@keyframes cursorBlink {
  0%, 50% { border-color: currentColor; }
  51%, 100% { border-color: transparent; }
}
</style>
