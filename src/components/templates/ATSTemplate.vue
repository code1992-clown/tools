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
const designerTarget = ref<string | null>(null)
const sectionDragRef = ref<InstanceType<typeof VueDraggable> | null>(null)
const { animateMove } = useMoveAnimation()

function openDesigner(section: string) {
  designerTarget.value = section
}

function handleSectionNameChange(key: string, name: string) {
  setSectionName(key, name)
}

function getSchema(section: string): CustomSectionFieldDef[] {
  return data.customFieldSchemas?.[section] || []
}

function confirmDelete(fn: () => void) {
  fn()
}

function handleAvatarUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    data.personal.avatar = reader.result as string
  }
  reader.readAsDataURL(file)
}

function removeAvatar() {
  data.personal.avatar = ''
}

function addExperienceItem() {
  addExperience()
}

function addProjectItem() {
  addProject()
}

function addEducationItem() {
  addEducation()
}

function addSkillItem() {
  addSkill()
}

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
</script>

<template>
  <div class="ats-template print-area mx-auto bg-white shadow-sm" style="max-width: 210mm; padding: 20mm 18mm;">

    <!-- Header: Name + Contact -->
    <header class="text-center mb-4 group/header relative">
      <h1 class="text-2xl font-bold tracking-wide text-gray-900 leading-tight">
        <EditableField v-model="data.personal.name" placeholder="姓名" />
      </h1>
      <p class="text-xs text-gray-600 mt-1.5 flex items-center justify-center flex-wrap gap-x-3 gap-y-0.5">
        <template v-for="field in data.personal.contactFields" :key="field.id">
          <span v-if="field.visible" class="inline-flex items-center gap-0.5">
            <EditableField v-model="field.value" :placeholder="field.label" autoWidth />
          </span>
        </template>
      </p>
      <button class="section-add-btn no-print absolute top-0 right-0 opacity-0 group-hover/header:opacity-50" @click="showContactManager = true" title="管理联系方式">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
      </button>
    </header>

    <!-- Summary / Self-evaluation -->
    <div v-if="data.personal.summary" class="mb-4 resume-section group/section relative">
      <div class="flex items-center gap-2 mb-2 border-b border-gray-900 pb-0.5">
        <h2 class="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-900 flex-1">自我评价</h2>
      </div>
      <div class="text-[10pt] text-gray-800 leading-relaxed">
        <RichTextEditor v-model="data.personal.summary" placeholder="输入自我评价 / 个人简介..." />
      </div>
    </div>
    <div v-else class="mb-2 no-print opacity-0 hover:opacity-100 transition-opacity">
      <button class="btn btn-ghost btn-xs text-base-content/30" @click="data.personal.summary = ' '" title="添加自我评价">+ 自我评价</button>
    </div>

    <!-- Sections (draggable order) -->
    <VueDraggable
      ref="sectionDragRef"
      v-model="data.sectionOrder"
      handle=".section-handle"
      :animation="280"
      ghost-class="drag-ghost"
      chosen-class="drag-chosen"
    >
      <div v-for="sectionKey in data.sectionOrder" :key="sectionKey" class="mb-4 resume-section group/section relative">
        <!-- Section Header with divider line -->
        <div class="flex items-center gap-2 mb-2 border-b border-gray-900 pb-0.5">
          <h2 class="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-900 flex-1">
            <EditableField
              :modelValue="getSectionName(sectionKey)"
              @update:modelValue="handleSectionNameChange(sectionKey, $event)"
              :placeholder="'板块名称'"
            />
          </h2>
          <button class="move-btn no-print" @click="moveSectionUp(sectionKey)" :disabled="data.sectionOrder.indexOf(sectionKey) === 0" title="上移">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="18 15 12 9 6 15"/></svg>
          </button>
          <button class="move-btn no-print" @click="moveSectionDown(sectionKey)" :disabled="data.sectionOrder.indexOf(sectionKey) === data.sectionOrder.length - 1" title="下移">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <button class="section-handle no-print" title="拖拽排序">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/></svg>
          </button>
          <button v-if="sectionKey !== 'skills'" class="section-add-btn no-print" @click="openDesigner(sectionKey)" title="设计板块布局">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          </button>
          <button v-if="sectionKey !== 'skills'" class="section-add-btn no-print" @click="sectionKey === 'experiences' ? addExperienceItem() : sectionKey === 'projects' ? addProjectItem() : sectionKey === 'education' ? addEducationItem() : addCustomItem(sectionKey)" title="添加条目">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
          <button class="section-remove-btn no-print" @click="removeSection(sectionKey)" title="移除板块">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <!-- Experiences -->
        <template v-if="sectionKey === 'experiences'">
          <VueDraggable v-model="data.experiences" handle=".item-handle" :animation="200" ghost-class="drag-ghost">
            <div v-for="(exp, expIdx) in data.experiences" :key="exp.id" class="mb-3 last:mb-0 group/item relative item-wrapper">
              <div class="flex-1 min-w-0">
                <template v-if="getSchema('experiences').length">
                  <DynamicFieldRenderer :fields="getSchema('experiences')" :item="exp" />
                </template>
                <template v-else>
                  <div class="flex justify-between items-baseline">
                    <span class="font-semibold text-[11pt] text-gray-900">
                      <EditableField v-model="exp.company" placeholder="公司名称" />
                    </span>
                    <span class="text-[9pt] text-gray-600 shrink-0 flex items-center gap-1 whitespace-nowrap">
                      <EditableDateField v-model="exp.startDate" placeholder="开始" />
                      <span class="mx-1">–</span>
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
                  <div class="text-[10pt] text-gray-700 italic">
                    <EditableField v-model="exp.position" placeholder="职位" />
                  </div>
                  <div class="mt-1 text-[10pt] text-gray-800 leading-relaxed">
                    <RichTextEditor v-model="exp.description" placeholder="• 使用动词+技术+量化描述工作成果（如：主导系统重构，QPS提升300%）" />
                  </div>
                </template>
              </div>
              <button class="item-delete-btn no-print" @click="confirmDelete(() => removeExperience(exp.id))" title="删除">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </VueDraggable>
          <button v-if="!data.experiences.length" class="empty-add-btn no-print" @click="addExperience">+ 添加工作经历</button>
        </template>

        <!-- Projects -->
        <template v-if="sectionKey === 'projects'">
          <VueDraggable v-model="data.projects" handle=".item-handle" :animation="200" ghost-class="drag-ghost">
            <div v-for="(proj, projIdx) in data.projects" :key="proj.id" class="mb-3 last:mb-0 group/item relative item-wrapper">
              <div class="flex-1 min-w-0">
                <template v-if="getSchema('projects').length">
                  <DynamicFieldRenderer :fields="getSchema('projects')" :item="proj" />
                </template>
                <template v-else>
                  <div class="flex justify-between items-baseline">
                    <span class="font-semibold text-[11pt] text-gray-900">
                      <EditableField v-model="proj.name" placeholder="项目名称" />
                    </span>
                    <span class="text-[9pt] text-gray-600 shrink-0 flex items-center gap-1 whitespace-nowrap">
                      <EditableDateField v-model="proj.startDate" placeholder="开始" />
                      <span class="mx-1">–</span>
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
                  <div class="text-[10pt] text-gray-700 italic">
                    <EditableField v-model="proj.role" placeholder="技术栈 / 角色" />
                  </div>
                  <div class="mt-1 text-[10pt] text-gray-800 leading-relaxed">
                    <RichTextEditor v-model="proj.description" placeholder="• 项目描述：背景、你的职责、技术选型决策、量化成果" />
                  </div>
                </template>
              </div>
              <button class="item-delete-btn no-print" @click="confirmDelete(() => removeProject(proj.id))" title="删除">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </VueDraggable>
          <button v-if="!data.projects.length" class="empty-add-btn no-print" @click="addProject">+ 添加项目经验</button>
        </template>

        <!-- Skills -->
        <template v-if="sectionKey === 'skills'">
          <RichTextEditor v-model="data.skillsText" placeholder="输入专业技能..." />
        </template>

        <!-- Education -->
        <template v-if="sectionKey === 'education'">
          <VueDraggable v-model="data.education" handle=".item-handle" :animation="200" ghost-class="drag-ghost">
            <div v-for="(edu, eduIdx) in data.education" :key="edu.id" class="mb-2 last:mb-0 group/item relative item-wrapper">
              <div class="flex-1 min-w-0">
                <template v-if="getSchema('education').length">
                  <DynamicFieldRenderer :fields="getSchema('education')" :item="edu" />
                </template>
                <template v-else>
                  <div class="flex justify-between items-baseline">
                    <span class="font-semibold text-[11pt] text-gray-900">
                      <EditableField v-model="edu.school" placeholder="学校名称" />
                    </span>
                    <span class="text-[9pt] text-gray-600 shrink-0 flex items-center gap-1 whitespace-nowrap">
                      <EditableDateField v-model="edu.startDate" placeholder="开始" />
                      <span class="mx-1">–</span>
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
                  <div class="flex items-baseline gap-3 text-[10pt] text-gray-700">
                    <span><EditableField v-model="edu.degree" placeholder="学位" /></span>
                    <span>·</span>
                    <span><EditableField v-model="edu.major" placeholder="专业" /></span>
                  </div>
                  <div v-if="edu.description" class="mt-0.5 text-[9.5pt] text-gray-600 leading-relaxed">
                    <RichTextEditor v-model="edu.description" placeholder="相关课程、GPA、荣誉" />
                  </div>
                </template>
              </div>
              <button class="item-delete-btn no-print" @click="confirmDelete(() => removeEducation(edu.id))" title="删除">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </VueDraggable>
          <button v-if="!data.education.length" class="empty-add-btn no-print" @click="addEducation">+ 添加教育经历</button>
        </template>

        <!-- Custom Sections -->
        <template v-if="!['experiences', 'projects', 'education', 'skills'].includes(sectionKey)">
          <VueDraggable v-model="data.customSections[sectionKey]" handle=".item-handle" :animation="200" ghost-class="drag-ghost">
            <div v-for="(item, itemIdx) in data.customSections[sectionKey]" :key="item.id" class="mb-3 last:mb-0 group/item relative item-wrapper">
              <div class="flex-1 min-w-0">
                <template v-if="getSchema(sectionKey).length">
                  <DynamicFieldRenderer :fields="getSchema(sectionKey)" :item="item" />
                </template>
                <template v-else>
                  <div class="flex justify-between items-baseline">
                    <span class="font-semibold text-[11pt] text-gray-900">
                      <EditableField v-model="item.title" placeholder="标题" />
                    </span>
                    <span class="text-[9pt] text-gray-600 shrink-0 flex items-center gap-1 whitespace-nowrap">
                      <EditableDateField v-model="item.startDate" placeholder="开始" />
                      <span class="mx-1">–</span>
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
                  <div v-if="item.subtitle" class="text-[10pt] text-gray-700 italic">
                    <EditableField v-model="item.subtitle" placeholder="副标题" />
                  </div>
                  <div class="mt-1 text-[10pt] text-gray-800 leading-relaxed">
                    <RichTextEditor v-model="item.description" placeholder="描述" />
                  </div>
                </template>
              </div>
              <button class="item-delete-btn no-print" @click="confirmDelete(() => removeCustomItem(sectionKey, item.id))" title="删除">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </VueDraggable>
          <button v-if="!data.customSections[sectionKey]?.length" class="empty-add-btn no-print" @click="addCustomItem(sectionKey)">+ 添加条目</button>
        </template>
      </div>
    </VueDraggable>

    <!-- Add section / Restore -->
    <div class="mt-4 flex items-center gap-2 no-print opacity-0 hover:opacity-100 transition-opacity">
      <button class="btn btn-ghost btn-xs text-base-content/30" @click="addCustomSection()">+ 添加板块</button>
      <template v-for="sec in getRemovedBuiltinSections()" :key="sec.key">
        <button class="btn btn-ghost btn-xs text-base-content/30" @click="restoreBuiltinSection(sec.key)">+ {{ sec.name }}</button>
      </template>
    </div>

    <!-- Contact Manager Dialog -->
    <dialog class="modal" :class="{ 'modal-open': showContactManager }">
      <div class="modal-box max-w-md">
        <h3 class="font-bold text-lg mb-4">管理联系方式</h3>
        <VueDraggable v-model="data.personal.contactFields" handle=".contact-handle" :animation="200" ghost-class="drag-ghost" class="space-y-2 max-h-60 overflow-y-auto">
          <div v-for="field in data.personal.contactFields" :key="field.id" class="flex items-center gap-2">
            <span class="contact-handle cursor-grab active:cursor-grabbing text-base-content/30 hover:text-base-content/60">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/></svg>
            </span>
            <input type="checkbox" :checked="field.visible" @change="toggleContactField(field.id)" class="checkbox checkbox-xs" />
            <input v-model="field.label" class="input input-ghost input-xs flex-1" placeholder="标签" />
            <input v-model="field.value" class="input input-ghost input-xs flex-1" placeholder="值" />
            <button class="btn btn-ghost btn-xs btn-square text-error" @click="removeContactField(field.id)">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </VueDraggable>
        <div class="flex flex-wrap gap-2 mt-3">
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
          <button class="btn btn-sm" @click="showContactManager = false">完成</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button>close</button></form>
    </dialog>

    <!-- Section Designer -->
    <SectionDesigner
      v-if="designerTarget"
      :section="designerTarget"
      :data="data"
      @close="designerTarget = null"
    />
  </div>
</template>

<style scoped>
.ats-template {
  font-family: 'Arial', 'Calibri', 'Helvetica Neue', sans-serif;
  color: #1f2937;
  line-height: 1.4;
  font-size: 10.5pt;
}
</style>
