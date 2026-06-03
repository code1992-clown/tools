import { reactive } from 'vue'
import type { ResumeData, CustomSectionItem, BuiltinSectionKey, ContactFieldType } from '../types/resume'
import { DEFAULT_SECTION_NAMES, isBuiltinSection } from '../types/resume'

const RESUME_DATA_KEY = Symbol('resume-data')

const DEFAULT_SECTION_ORDER: string[] = ['experiences', 'projects', 'education', 'skills']

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

function createDefaultContactFields() {
  return [
    { id: 'email', type: 'email' as const, label: '邮箱', value: '', visible: true },
    { id: 'phone', type: 'phone' as const, label: '电话', value: '', visible: true },
    { id: 'location', type: 'location' as const, label: '城市', value: '', visible: true },
  ]
}

function createDefaultData(): ResumeData {
  return {
    personal: {
      name: '',
      title: '',
      email: '',
      phone: '',
      location: '',
      summary: '',
    },
    contactFields: createDefaultContactFields(),
    experiences: [],
    education: [],
    skills: [],
    skillsText: '',
    projects: [],
    sectionOrder: [...DEFAULT_SECTION_ORDER],
    customSections: {},
    sectionNames: { ...DEFAULT_SECTION_NAMES },
  }
}

let currentResumeData: ResumeData | null = null

export function provideResumeData(data: ResumeData) {
  currentResumeData = data
}

export function useResume() {
  const resumeData = currentResumeData || reactive<ResumeData>(createDefaultData())

  function addExperience() {
    resumeData.experiences.push({
      id: generateId(),
      company: '',
      position: '',
      startDate: '',
      endDate: '',
      description: '',
    })
  }

  function removeExperience(id: string) {
    const idx = resumeData.experiences.findIndex((e) => e.id === id)
    if (idx !== -1) resumeData.experiences.splice(idx, 1)
  }

  function addEducation() {
    resumeData.education.push({
      id: generateId(),
      school: '',
      degree: '',
      major: '',
      startDate: '',
      endDate: '',
    })
  }

  function removeEducation(id: string) {
    const idx = resumeData.education.findIndex((e) => e.id === id)
    if (idx !== -1) resumeData.education.splice(idx, 1)
  }

  function addSkill() {
    resumeData.skills.push({
      id: generateId(),
      name: '',
      level: 3,
    })
  }

  function removeSkill(id: string) {
    const idx = resumeData.skills.findIndex((s) => s.id === id)
    if (idx !== -1) resumeData.skills.splice(idx, 1)
  }

  function addProject() {
    resumeData.projects.push({
      id: generateId(),
      name: '',
      role: '',
      description: '',
      startDate: '',
      endDate: '',
    })
  }

  function removeProject(id: string) {
    const idx = resumeData.projects.findIndex((p) => p.id === id)
    if (idx !== -1) resumeData.projects.splice(idx, 1)
  }

  function addCustomSection(name?: string): string {
    const sectionId = 'custom_' + generateId()
    const displayName = name || '自定义板块'
    resumeData.customSections[sectionId] = []
    resumeData.sectionNames[sectionId] = displayName
    resumeData.sectionOrder.push(sectionId)
    return sectionId
  }

  function removeSection(sectionKey: string) {
    const idx = resumeData.sectionOrder.indexOf(sectionKey)
    if (idx !== -1) {
      resumeData.sectionOrder.splice(idx, 1)
    }
    if (!isBuiltinSection(sectionKey)) {
      delete resumeData.customSections[sectionKey]
      delete resumeData.sectionNames[sectionKey]
    }
  }

  function restoreBuiltinSection(key: BuiltinSectionKey) {
    if (!resumeData.sectionOrder.includes(key)) {
      resumeData.sectionOrder.push(key)
      if (!resumeData.sectionNames[key]) {
        resumeData.sectionNames[key] = DEFAULT_SECTION_NAMES[key]
      }
    }
  }

  function addCustomItem(sectionKey: string) {
    if (!resumeData.customSections[sectionKey]) {
      resumeData.customSections[sectionKey] = []
    }
    resumeData.customSections[sectionKey].push({
      id: generateId(),
      title: '',
      subtitle: '',
      startDate: '',
      endDate: '',
      description: '',
    })
  }

  function removeCustomItem(sectionKey: string, itemId: string) {
    const items = resumeData.customSections[sectionKey]
    if (!items) return
    const idx = items.findIndex((item: CustomSectionItem) => item.id === itemId)
    if (idx !== -1) items.splice(idx, 1)
  }

  function getSectionName(key: string): string {
    return resumeData.sectionNames[key] || key
  }

  function setSectionName(key: string, name: string) {
    resumeData.sectionNames[key] = name
  }

  function getRemovedBuiltinSections(): BuiltinSectionKey[] {
    return (['experiences', 'projects', 'education', 'skills'] as BuiltinSectionKey[])
      .filter(k => !resumeData.sectionOrder.includes(k))
  }

  const CONTACT_LABELS: Partial<Record<ContactFieldType, string>> = {
    email: '邮箱',
    phone: '电话',
    location: '城市',
    link: '链接',
    wechat: '微信',
    website: '个人网站',
    github: 'GitHub',
    linkedin: 'LinkedIn',
    birthday: '出生年月',
    gender: '性别',
    experience_years: '工作年限',
    education_level: '最高学历',
    job_status: '求职状态',
  }

  function addContactField(type: ContactFieldType = 'custom', label = '') {
    const id = generateId()
    resumeData.contactFields.push({
      id,
      type,
      label: label || CONTACT_LABELS[type] || '自定义',
      value: '',
      visible: true,
    })
    return id
  }

  function removeContactField(id: string) {
    const idx = resumeData.contactFields.findIndex(f => f.id === id)
    if (idx !== -1) resumeData.contactFields.splice(idx, 1)
  }

  function toggleContactField(id: string) {
    const field = resumeData.contactFields.find(f => f.id === id)
    if (field) field.visible = !field.visible
  }

  function resetAll() {
    Object.assign(resumeData, createDefaultData())
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify(resumeData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${resumeData.personal.name || '简历'}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function importJSON(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result as string) as ResumeData
          Object.assign(resumeData, data)
          resolve()
        } catch (e) {
          reject(e)
        }
      }
      reader.readAsText(file)
    })
  }

  return {
    resumeData,
    addExperience,
    removeExperience,
    addEducation,
    removeEducation,
    addSkill,
    removeSkill,
    addProject,
    removeProject,
    addContactField,
    removeContactField,
    toggleContactField,
    addCustomSection,
    removeSection,
    restoreBuiltinSection,
    addCustomItem,
    removeCustomItem,
    getSectionName,
    setSectionName,
    getRemovedBuiltinSections,
    resetAll,
    exportJSON,
    importJSON,
  }
}
