<script setup lang="ts">
import { ref } from 'vue'
import type { ResumeData } from '../../types/resume'
import { useResume } from '../../composables/useResume'
import EditableField from '../EditableField.vue'
import EditableDateField from '../EditableDateField.vue'
import RichTextEditor from '../RichTextEditor.vue'
import SectionDesigner from '../SectionDesigner.vue'
import DynamicFieldRenderer from '../DynamicFieldRenderer.vue'
import { VueDraggable } from 'vue-draggable-plus'
import type { CustomSectionFieldDef } from '../../types/resume'
import { useMoveAnimation } from '../../composables/useMoveAnimation'

const { data } = defineProps<{
  data: ResumeData
}>()

const {
  addExperience, removeExperience,
  addEducation, removeEducation,
  addSkill, removeSkill,
  addProject, removeProject,
  addContactField, removeContactField, toggleContactField,
  addCustomSection, removeSection, restoreBuiltinSection,
  addCustomItem, removeCustomItem,
  getSectionName, setSectionName,
  getRemovedBuiltinSections,
} = useResume()

const showContactManager = ref(false)
const avatarInput = ref<HTMLInputElement | null>(null)

const pendingDelete = ref<{ action: () => void } | null>(null)
function confirmDelete(action: () => void) { pendingDelete.value = { action } }
function executeDelete() { pendingDelete.value?.action(); pendingDelete.value = null }
function cancelDelete() { pendingDelete.value = null }

function handleAvatarUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (file.size > 2 * 1024 * 1024) return
  const reader = new FileReader()
  reader.onload = () => {
    data.personal.avatar = reader.result as string
  }
  reader.readAsDataURL(file)
}

function removeAvatar() {
  data.personal.avatar = ''
  if (avatarInput.value) avatarInput.value.value = ''
}

const CONTACT_ICONS: Record<string, string> = {
  email: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
  location: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  wechat: '<path d="M9.5 4C5.36 4 2 6.69 2 10c0 1.89 1.08 3.57 2.78 4.72L4 17l2.5-1.5c.64.19 1.31.3 2 .34"/><path d="M14.5 7c3.58 0 6.5 2.27 6.5 5.08 0 1.59-.91 3-2.34 3.97l.34 1.95-2.13-1.28c-.54.16-1.1.25-1.69.28"/><circle cx="7.5" cy="10" r="0.75" fill="currentColor"/><circle cx="11.5" cy="10" r="0.75" fill="currentColor"/><circle cx="12.75" cy="12" r="0.6" fill="currentColor"/><circle cx="16.25" cy="12" r="0.6" fill="currentColor"/>',
  website: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  github: '<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65S8.93 17.38 9 18v4"/><path d="M9 18c-4.51 2-5-2-7-2"/>',
  linkedin: '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/>',
  birthday: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M12 14v3"/><path d="M10 14.5c0-.83.67-1.5 1.5-1.5h1c.83 0 1.5.67 1.5 1.5"/>',
  gender: '<circle cx="10" cy="8" r="5"/><path d="M10 13v9"/><path d="M7 19h6"/><path d="M17 3l4 4"/><path d="M21 3h-4v4"/>',
  experience_years: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  education_level: '<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 6 3 6 3s3 0 6-3v-5"/>',
  job_status: '<rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  custom: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
}

function getContactIcon(type: string) {
  return CONTACT_ICONS[type] || CONTACT_ICONS.custom
}

const levelLabels = ['入门', '初级', '中级', '熟练', '精通']

function addItem(key: string) {
  const fns: Record<string, () => void> = {
    experiences: addExperience,
    projects: addProject,
    education: addEducation,
    skills: addSkill,
  }
  if (fns[key]) {
    fns[key]()
  } else {
    addCustomItem(key)
  }
}

function cycleLevel(skill: { level: number }) {
  skill.level = (skill.level % 5) + 1
}

function handleSectionNameChange(key: string, value: string) {
  setSectionName(key, value)
}

const sectionDragRef = ref<InstanceType<typeof VueDraggable> | null>(null)
const { animateMove } = useMoveAnimation()

function moveSectionUp(sectionKey: string) {
  const idx = data.sectionOrder.indexOf(sectionKey)
  if (idx <= 0) return
  animateMove(sectionDragRef.value?.$el, () => {
    data.sectionOrder.splice(idx, 1)
    data.sectionOrder.splice(idx - 1, 0, sectionKey)
  })
}

function moveSectionDown(sectionKey: string) {
  const idx = data.sectionOrder.indexOf(sectionKey)
  if (idx >= data.sectionOrder.length - 1) return
  animateMove(sectionDragRef.value?.$el, () => {
    data.sectionOrder.splice(idx, 1)
    data.sectionOrder.splice(idx + 1, 0, sectionKey)
  })
}

function getItemContainer(event: MouseEvent): HTMLElement | null {
  const el = (event.currentTarget as HTMLElement).closest('.item-wrapper')
  return (el?.parentElement as HTMLElement) || null
}

function moveItemUp(event: MouseEvent, arr: any[], index: number) {
  if (index <= 0) return
  animateMove(getItemContainer(event), () => {
    const item = arr.splice(index, 1)[0]
    arr.splice(index - 1, 0, item)
  })
}

function moveItemDown(event: MouseEvent, arr: any[], index: number) {
  if (index >= arr.length - 1) return
  animateMove(getItemContainer(event), () => {
    const item = arr.splice(index, 1)[0]
    arr.splice(index + 1, 0, item)
  })
}

const designerOpen = ref(false)
const designerSectionKey = ref('')

function openDesigner(sectionKey: string) {
  designerSectionKey.value = sectionKey
  designerOpen.value = true
}

function getSchema(sectionKey: string): CustomSectionFieldDef[] {
  return data.customSectionSchemas?.[sectionKey] || []
}

function saveSchema(fields: CustomSectionFieldDef[]) {
  if (!data.customSectionSchemas) {
    data.customSectionSchemas = {}
  }
  data.customSectionSchemas[designerSectionKey.value] = fields
}
</script>

<template>
  <div class="print-area bg-white text-gray-700 p-10 max-w-[210mm] mx-auto rounded-2xl min-h-[297mm] shadow-[0_8px_60px_rgba(99,102,241,0.07),0_2px_8px_rgba(0,0,0,0.03)] ring-1 ring-gray-200/40">
    <!-- Centered header -->
    <header class="text-center pb-6 mb-8 group/header">
      <!-- Avatar (centered) -->
      <div class="flex justify-center mb-3 group/avatar relative mx-auto">
        <div
          v-if="data.personal.avatar"
          class="w-16 h-16 rounded-full overflow-hidden ring-1 ring-gray-200 relative"
        >
          <img :src="data.personal.avatar" alt="头像" class="w-full h-full object-cover" />
          <button
            class="btn btn-xs no-print absolute inset-0 rounded-full bg-black/40 text-white border-none opacity-0 group-hover/avatar:opacity-100 transition-opacity"
            @click="removeAvatar"
          >删除</button>
        </div>
        <button
          v-else
          class="btn btn-circle btn-outline btn-ghost no-print w-16 h-16 border-2 border-dashed border-base-300 hover:border-accent text-base-content/30 hover:text-accent"
          @click="avatarInput?.click()"
          title="上传头像"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </button>
        <input
          ref="avatarInput"
          type="file"
          accept="image/*"
          class="hidden"
          @change="handleAvatarUpload"
        />
      </div>
      <h1 class="text-4xl font-extralight text-gray-900 tracking-wide">
        <EditableField v-model="data.personal.name" placeholder="你的姓名" />
      </h1>
      <div class="text-emerald-600 text-sm font-medium uppercase tracking-[0.2em] mt-2">
        <EditableField v-model="data.personal.title" placeholder="职位 / 头衔" />
      </div>
      <div class="w-12 h-px bg-emerald-500 mx-auto mt-4"></div>
      <VueDraggable
        v-model="data.contactFields"
        handle=".contact-handle"
        :animation="200"
        class="flex justify-center flex-wrap gap-x-6 gap-y-1 mt-4 text-xs text-gray-400"
      >
        <span
          v-for="field in data.contactFields"
          :key="field.id"
          v-show="field.visible"
          class="contact-item flex items-center gap-1 group/contact"
          :class="{ 'print-hide-empty': !field.value }"
        >
          <span class="contact-handle cursor-grab active:cursor-grabbing no-print">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="getContactIcon(field.type)"></svg>
          </span>
          <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 shrink-0 print-only hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="getContactIcon(field.type)"></svg>
          <EditableField v-model="field.value" :placeholder="field.label" autoWidth />
          <button
            class="btn btn-ghost btn-xs btn-circle no-print opacity-0 group-hover/contact:opacity-100 min-h-0 h-4 w-4 text-base-content/30 hover:text-error"
            @click="removeContactField(field.id)"
            title="删除字段"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </span>
      </VueDraggable>
      <button
        class="btn btn-ghost btn-xs no-print mx-auto mt-2 opacity-0 group-hover/header:opacity-100 gap-1"
        @click="showContactManager = true"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        管理联系信息
      </button>
    </header>

    <!-- Contact Field Manager Dialog -->
    <dialog class="modal no-print" :class="{ 'modal-open': showContactManager }">
      <div class="modal-box rounded-2xl shadow-2xl border border-base-content/10 max-w-sm">
        <h3 class="text-base font-bold text-base-content mb-3">管理联系信息</h3>
        <VueDraggable v-model="data.contactFields" handle=".contact-handle" :animation="200" ghost-class="drag-ghost" class="space-y-2 mb-4">
          <div
            v-for="field in data.contactFields"
            :key="field.id"
            class="flex items-center gap-2 p-2 rounded-lg border border-base-content/10"
          >
            <span class="contact-handle cursor-grab active:cursor-grabbing text-base-content/30 hover:text-base-content/60">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/></svg>
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-base-content/70 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="getContactIcon(field.type)"></svg>
            <input
              v-model="field.label"
              class="input input-ghost input-sm flex-1 text-base-content font-semibold h-auto min-h-0 px-1"
              placeholder="字段名称"
            />
            <label class="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" v-model="field.visible" class="checkbox checkbox-xs checkbox-primary" />
              <span class="text-xs text-base-content/80 font-medium">显示</span>
            </label>
            <button
              @click="removeContactField(field.id)"
              class="btn btn-ghost btn-xs btn-circle text-base-content/30 hover:text-error"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </VueDraggable>
        <div class="flex flex-wrap gap-2 mb-4">
          <button class="btn btn-soft btn-xs" @click="addContactField('wechat', '微信')">+ 微信</button>
          <button class="btn btn-soft btn-xs" @click="addContactField('website', '个人网站')">+ 个人网站</button>
          <button class="btn btn-soft btn-xs" @click="addContactField('github', 'GitHub')">+ GitHub</button>
          <button class="btn btn-soft btn-xs" @click="addContactField('linkedin', 'LinkedIn')">+ LinkedIn</button>
          <button class="btn btn-soft btn-xs" @click="addContactField('birthday', '出生年月')">+ 出生年月</button>
          <button class="btn btn-soft btn-xs" @click="addContactField('gender', '性别')">+ 性别</button>
          <button class="btn btn-soft btn-xs" @click="addContactField('experience_years', '工作年限')">+ 工作年限</button>
          <button class="btn btn-soft btn-xs" @click="addContactField('education_level', '最高学历')">+ 最高学历</button>
          <button class="btn btn-soft btn-xs" @click="addContactField('job_status', '求职状态')">+ 求职状态</button>
          <button class="btn btn-soft btn-xs" @click="addContactField('link', '链接')">+ 链接</button>
          <button class="btn btn-soft btn-xs" @click="addContactField('custom', '')">+ 自定义</button>
        </div>
        <div class="modal-action">
          <button class="btn btn-primary btn-sm" @click="showContactManager = false">完成</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop bg-black/30 backdrop-blur-sm" @click="showContactManager = false">
        <button>close</button>
      </form>
    </dialog>

    <!-- Summary / Self-evaluation -->
    <div v-if="data.personal.summary" class="mb-8 resume-section group/section relative">
      <div class="text-sm text-gray-500 leading-relaxed font-light text-center">
        <RichTextEditor v-model="data.personal.summary" placeholder="输入自我评价 / 个人简介..." />
      </div>
    </div>
    <div v-else class="mb-2 no-print opacity-0 hover:opacity-100 transition-opacity text-center">
      <button class="btn btn-ghost btn-xs text-base-content/30" @click="data.personal.summary = ' '" title="添加自我评价">+ 自我评价</button>
    </div>

    <!-- Draggable Sections -->
    <VueDraggable
      ref="sectionDragRef"
      v-model="data.sectionOrder"
      handle=".section-handle"
      :animation="280"
      ghost-class="drag-ghost"
      chosen-class="drag-chosen"
    >
      <div v-for="sectionKey in data.sectionOrder" :key="sectionKey" class="mb-8 resume-section group/section relative">
        <!-- Section Header -->
        <div class="flex items-center gap-4 mb-4 relative">
          <div class="h-px bg-gray-200 flex-1"></div>
          <h2 class="text-xs font-medium uppercase tracking-[0.2em] text-emerald-600 shrink-0">
            <EditableField
              :modelValue="getSectionName(sectionKey)"
              @update:modelValue="handleSectionNameChange(sectionKey, $event)"
              :placeholder="'板块名称'"
            />
          </h2>
          <div class="h-px bg-gray-200 flex-1"></div>
          <button class="move-btn no-print relative! right-auto!" @click="moveSectionUp(sectionKey)" :disabled="data.sectionOrder.indexOf(sectionKey) === 0" title="上移">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="18 15 12 9 6 15"/></svg>
          </button>
          <button class="move-btn no-print relative! right-auto!" @click="moveSectionDown(sectionKey)" :disabled="data.sectionOrder.indexOf(sectionKey) === data.sectionOrder.length - 1" title="下移">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <button class="section-handle no-print relative! right-auto! left-0!" title="拖拽排序">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>
          </button>
          <button v-if="sectionKey !== 'skills'" class="section-add-btn no-print relative! right-auto!" @click="openDesigner(sectionKey)" title="设计板块布局">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          </button>
          <button v-if="sectionKey !== 'skills'" class="section-add-btn no-print relative! right-auto!" @click="addItem(sectionKey)" title="添加">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
          <button class="section-remove-btn no-print relative! right-auto!" @click="removeSection(sectionKey)" title="移除板块">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <!-- ===== EXPERIENCES ===== -->
        <template v-if="sectionKey === 'experiences'">
          <VueDraggable v-model="data.experiences" handle=".item-handle" :animation="200" ghost-class="drag-ghost">
            <div v-for="(exp, expIdx) in data.experiences" :key="exp.id" class="mb-5 last:mb-0 group/item relative item-wrapper">
              <div class="flex-1 min-w-0">
                <template v-if="getSchema('experiences').length">
                  <DynamicFieldRenderer :fields="getSchema('experiences')" :item="exp" />
                </template>
                <template v-else>
                  <div class="flex justify-between items-baseline gap-4">
                    <span class="font-medium text-gray-900 flex-1 min-w-0">
                      <EditableField v-model="exp.company" placeholder="公司名称" />
                    </span>
                    <span class="text-xs text-gray-300 shrink-0 font-light flex items-center gap-1 whitespace-nowrap">
                      <EditableDateField v-model="exp.startDate" placeholder="开始" />
                      <span class="mx-1">—</span>
                      <EditableDateField v-model="exp.endDate" placeholder="至今" emptyText="至今" :min="exp.startDate" />
                      <button class="move-btn no-print" @click="moveItemUp($event, data.experiences, expIdx)" :disabled="expIdx === 0" title="上移">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="18 15 12 9 6 15"/></svg>
                      </button>
                      <button class="move-btn no-print" @click="moveItemDown($event, data.experiences, expIdx)" :disabled="expIdx === data.experiences.length - 1" title="下移">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
                      </button>
                      <button class="item-handle no-print" title="拖拽排序">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/></svg>
                      </button>
                    </span>
                  </div>
                  <div class="text-gray-400 text-sm font-light -mt-0.5">
                    <EditableField v-model="exp.position" placeholder="职位" />
                  </div>
                  <div class="text-sm text-gray-500 mt-1 leading-relaxed font-light">
                    <RichTextEditor v-model="exp.description" placeholder="描述你的工作内容和成就..." />
                  </div>
                </template>
              </div>
              <button class="item-delete-btn no-print" @click="confirmDelete(() => removeExperience(exp.id))" title="删除"><svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
            </div>
          </VueDraggable>
          <button v-if="!data.experiences.length" class="empty-add-btn no-print" @click="addExperience">
            + 添加{{ getSectionName(sectionKey) }}
          </button>
        </template>

        <!-- ===== PROJECTS ===== -->
        <template v-else-if="sectionKey === 'projects'">
          <VueDraggable v-model="data.projects" handle=".item-handle" :animation="200" ghost-class="drag-ghost">
            <div v-for="(proj, projIdx) in data.projects" :key="proj.id" class="mb-5 last:mb-0 group/item relative item-wrapper">
              <div class="flex-1 min-w-0">
                <template v-if="getSchema('projects').length">
                  <DynamicFieldRenderer :fields="getSchema('projects')" :item="proj" />
                </template>
                <template v-else>
                  <div class="flex justify-between items-baseline gap-4">
                    <span class="font-medium text-gray-900 flex-1 min-w-0">
                      <EditableField v-model="proj.name" placeholder="项目名称" />
                    </span>
                    <span class="text-xs text-gray-300 shrink-0 font-light flex items-center gap-1 whitespace-nowrap">
                      <EditableDateField v-model="proj.startDate" placeholder="开始" />
                      <span class="mx-1">—</span>
                      <EditableDateField v-model="proj.endDate" placeholder="至今" emptyText="至今" :min="proj.startDate" />
                      <button class="move-btn no-print" @click="moveItemUp($event, data.projects, projIdx)" :disabled="projIdx === 0" title="上移">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="18 15 12 9 6 15"/></svg>
                      </button>
                      <button class="move-btn no-print" @click="moveItemDown($event, data.projects, projIdx)" :disabled="projIdx === data.projects.length - 1" title="下移">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
                      </button>
                      <button class="item-handle no-print" title="拖拽排序">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/></svg>
                      </button>
                    </span>
                  </div>
                  <div class="text-gray-400 text-sm font-light -mt-0.5">
                    <EditableField v-model="proj.role" placeholder="担任角色" />
                  </div>
                  <div class="text-sm text-gray-500 mt-1 leading-relaxed font-light">
                    <RichTextEditor v-model="proj.description" placeholder="描述项目内容和你的贡献..." />
                  </div>
                </template>
              </div>
              <button class="item-delete-btn no-print" @click="confirmDelete(() => removeProject(proj.id))" title="删除"><svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
            </div>
          </VueDraggable>
          <button v-if="!data.projects.length" class="empty-add-btn no-print" @click="addProject">
            + 添加{{ getSectionName(sectionKey) }}
          </button>
        </template>

        <!-- ===== EDUCATION ===== -->
        <template v-else-if="sectionKey === 'education'">
          <VueDraggable v-model="data.education" handle=".item-handle" :animation="200" ghost-class="drag-ghost">
            <div v-for="(edu, eduIdx) in data.education" :key="edu.id" class="mb-3 last:mb-0 group/item relative item-wrapper">
              <div class="flex-1 min-w-0">
                <template v-if="getSchema('education').length">
                  <DynamicFieldRenderer :fields="getSchema('education')" :item="edu" />
                </template>
                <template v-else>
                  <div class="flex justify-between items-baseline gap-4">
                    <span class="font-medium text-gray-900 flex-1 min-w-0">
                      <EditableField v-model="edu.school" placeholder="学校名称" />
                    </span>
                    <span class="text-xs text-gray-300 shrink-0 font-light flex items-center gap-1 whitespace-nowrap">
                      <EditableDateField v-model="edu.startDate" placeholder="开始" />
                      <span class="mx-1">—</span>
                      <EditableDateField v-model="edu.endDate" placeholder="至今" emptyText="至今" :min="edu.startDate" />
                      <button class="move-btn no-print" @click="moveItemUp($event, data.education, eduIdx)" :disabled="eduIdx === 0" title="上移">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="18 15 12 9 6 15"/></svg>
                      </button>
                      <button class="move-btn no-print" @click="moveItemDown($event, data.education, eduIdx)" :disabled="eduIdx === data.education.length - 1" title="下移">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
                      </button>
                      <button class="item-handle no-print" title="拖拽排序">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/></svg>
                      </button>
                    </span>
                  </div>
                  <div class="text-gray-400 text-sm font-light -mt-0.5 flex items-baseline gap-1">
                    <EditableField v-model="edu.degree" placeholder="学历" />
                    <span class="shrink-0">/</span>
                    <EditableField v-model="edu.major" placeholder="专业" />
                  </div>
                </template>
              </div>
              <button class="item-delete-btn no-print" @click="confirmDelete(() => removeEducation(edu.id))" title="删除"><svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
            </div>
          </VueDraggable>
          <button v-if="!data.education.length" class="empty-add-btn no-print" @click="addEducation">
            + 添加{{ getSectionName(sectionKey) }}
          </button>
        </template>

        <!-- ===== SKILLS ===== -->
        <template v-else-if="sectionKey === 'skills'">
          <RichTextEditor v-model="data.skillsText" placeholder="输入专业技能..." />
        </template>

        <!-- ===== CUSTOM SECTIONS ===== -->
        <template v-else-if="data.customSections[sectionKey]">
          <VueDraggable v-model="data.customSections[sectionKey]" handle=".item-handle" :animation="200" ghost-class="drag-ghost">
            <div v-for="(item, itemIdx) in data.customSections[sectionKey]" :key="item.id" class="mb-5 last:mb-0 group/item relative item-wrapper">
              <div class="flex-1 min-w-0">
                <template v-if="getSchema(sectionKey).length">
                  <DynamicFieldRenderer :fields="getSchema(sectionKey)" :item="item" />
                </template>
                <template v-else>
                  <div class="flex justify-between items-baseline gap-4">
                    <span class="font-medium text-gray-900 flex-1 min-w-0">
                      <EditableField v-model="item.title" placeholder="标题" />
                    </span>
                    <span class="text-xs text-gray-300 shrink-0 font-light flex items-center gap-1 whitespace-nowrap">
                      <EditableDateField v-model="item.startDate" placeholder="开始" />
                      <span class="mx-1">—</span>
                      <EditableDateField v-model="item.endDate" placeholder="结束" emptyText="至今" :min="item.startDate" />
                      <button class="move-btn no-print" @click="moveItemUp($event, data.customSections[sectionKey], itemIdx)" :disabled="itemIdx === 0" title="上移">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="18 15 12 9 6 15"/></svg>
                      </button>
                      <button class="move-btn no-print" @click="moveItemDown($event, data.customSections[sectionKey], itemIdx)" :disabled="itemIdx === data.customSections[sectionKey].length - 1" title="下移">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
                      </button>
                      <button class="item-handle no-print" title="拖拽排序">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/></svg>
                      </button>
                    </span>
                  </div>
                  <div class="text-gray-400 text-sm font-light -mt-0.5">
                    <EditableField v-model="item.subtitle" placeholder="副标题" />
                  </div>
                  <div class="text-sm text-gray-500 mt-1 leading-relaxed font-light">
                    <RichTextEditor v-model="item.description" placeholder="输入详细描述..." />
                  </div>
                </template>
              </div>
              <button class="item-delete-btn no-print" @click="confirmDelete(() => removeCustomItem(sectionKey, item.id))" title="删除"><svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
            </div>
          </VueDraggable>
          <button v-if="!data.customSections[sectionKey]?.length" class="empty-add-btn no-print mx-auto" @click="addCustomItem(sectionKey)">
            + 添加{{ getSectionName(sectionKey) }}
          </button>
        </template>
      </div>
    </VueDraggable>

    <!-- Add Section Area -->
    <div class="no-print mt-6 border-t border-dashed border-gray-200 pt-4">
      <div class="flex flex-wrap items-center gap-2 justify-center">
        <button
          v-for="key in getRemovedBuiltinSections()"
          :key="key"
          class="btn btn-xs btn-outline btn-ghost text-gray-400 hover:text-emerald-600"
          @click="restoreBuiltinSection(key)"
        >
          + {{ getSectionName(key) }}
        </button>
        <button
          class="btn btn-xs btn-outline btn-primary"
          @click="addCustomSection()"
        >
          + 新增自定义板块
        </button>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="!data.personal.name && !data.experiences.length && !data.education.length && !data.skillsText && !data.projects.length"
      class="flex flex-col items-center justify-center py-20 text-gray-300 no-print">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-16 h-16 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
      <p class="text-lg">直接点击文字开始编辑简历</p>
      <p class="text-sm mt-1">拖拽各区块可调整顺序</p>
    </div>

    <SectionDesigner
      :open="designerOpen"
      :sectionKey="designerSectionKey"
      :fields="getSchema(designerSectionKey)"
      @close="designerOpen = false"
      @save="saveSchema"
    />

    <dialog class="modal no-print" :class="{ 'modal-open': pendingDelete }">
      <div class="modal-box rounded-lg bg-base-100 border border-base-300 max-w-xs p-5">
        <h3 class="text-sm font-bold text-base-content">确认删除</h3>
        <p class="text-xs text-base-content/50 mt-1.5">删除后无法恢复，确定要删除吗？</p>
        <div class="flex justify-end gap-2 mt-4">
          <button class="btn btn-ghost btn-xs" @click="cancelDelete">取消</button>
          <button class="btn btn-error btn-xs" @click="executeDelete">确认删除</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop bg-black/20" @click="cancelDelete">
        <button>close</button>
      </form>
    </dialog>
  </div>
</template>
