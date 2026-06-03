import { ref, watch, computed } from 'vue'
import type { TemplateId, TemplateInfo, TemplateConfig } from '../types/resume'

const TEMPLATE_KEY = 'resume-template'
const CUSTOM_TEMPLATES_KEY = 'resume-custom-templates'

export const builtinTemplates: TemplateInfo[] = [
  {
    id: 'classic',
    name: '经典',
    description: '传统单栏布局，适合大多数求职场景',
    accentColor: '#1f2937',
  },
  {
    id: 'modern',
    name: '现代',
    description: '蓝色强调色搭配时间线设计',
    accentColor: '#2563eb',
  },
  {
    id: 'minimalist',
    name: '简约',
    description: '大量留白与细线分隔，干净优雅',
    accentColor: '#059669',
  },
  {
    id: 'ats',
    name: 'ATS专业',
    description: '大厂风格，ATS兼容，内容密度最大化',
    accentColor: '#111827',
  },
]

function createDefaultConfig(base: 'classic' | 'modern' | 'minimalist' | 'ats' = 'classic'): TemplateConfig {
  const presets: Record<string, Partial<TemplateConfig['colors']>> = {
    classic: { accent: '#1f2937', headerBg: '#ffffff', headerText: '#111827', text: '#374151', subtext: '#6b7280', background: '#ffffff' },
    modern: { accent: '#2563eb', headerBg: '#2563eb', headerText: '#ffffff', text: '#374151', subtext: '#6b7280', background: '#ffffff' },
    minimalist: { accent: '#059669', headerBg: '#ffffff', headerText: '#111827', text: '#374151', subtext: '#9ca3af', background: '#ffffff' },
    ats: { accent: '#111827', headerBg: '#ffffff', headerText: '#111827', text: '#1f2937', subtext: '#4b5563', background: '#ffffff' },
  }
  const colors = presets[base] || presets.classic
  return {
    id: `custom-${Date.now()}`,
    name: '自定义模板',
    baseTemplate: base,
    colors: colors as TemplateConfig['colors'],
    fonts: { heading: 'system-ui, sans-serif', body: 'system-ui, sans-serif' },
    fontSize: { name: 30, sectionTitle: 11, body: 14 },
    spacing: { pagePadding: 32, sectionGap: 24 },
  }
}

function loadCustomTemplates(): TemplateConfig[] {
  try {
    const raw = localStorage.getItem(CUSTOM_TEMPLATES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function loadTemplate(): TemplateId {
  try {
    const saved = localStorage.getItem(TEMPLATE_KEY)
    if (saved) return saved as TemplateId
  } catch {}
  return 'classic'
}

const currentTemplate = ref<TemplateId>(loadTemplate())
const customTemplates = ref<TemplateConfig[]>(loadCustomTemplates())

watch(currentTemplate, (val) => {
  localStorage.setItem(TEMPLATE_KEY, val)
})

watch(customTemplates, (val) => {
  localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(val))
}, { deep: true })

export function useTemplate() {
  const allTemplates = computed<TemplateInfo[]>(() => {
    const custom = customTemplates.value.map((c) => ({
      id: c.id,
      name: c.name,
      description: `基于${builtinTemplates.find((b) => b.id === c.baseTemplate)?.name || '经典'}模板的自定义版本`,
      accentColor: c.colors.accent,
    }))
    return [...builtinTemplates, ...custom]
  })

  const activeConfig = computed<TemplateConfig | null>(() => {
    return customTemplates.value.find((c) => c.id === currentTemplate.value) || null
  })

  const baseTemplateId = computed<'classic' | 'modern' | 'minimalist' | 'ats'>(() => {
    const custom = customTemplates.value.find((c) => c.id === currentTemplate.value)
    if (custom) return custom.baseTemplate
    const id = currentTemplate.value
    if (id === 'classic' || id === 'modern' || id === 'minimalist' || id === 'ats') return id
    return 'classic'
  })

  function setTemplate(id: TemplateId) {
    currentTemplate.value = id
  }

  function addCustomTemplate(base: 'classic' | 'modern' | 'minimalist' | 'ats' = 'classic'): TemplateConfig {
    const config = createDefaultConfig(base)
    customTemplates.value.push(config)
    currentTemplate.value = config.id
    return config
  }

  function updateCustomTemplate(id: string, updates: Partial<TemplateConfig>) {
    const idx = customTemplates.value.findIndex((c) => c.id === id)
    if (idx !== -1) {
      Object.assign(customTemplates.value[idx], updates)
    }
  }

  function removeCustomTemplate(id: string) {
    const idx = customTemplates.value.findIndex((c) => c.id === id)
    if (idx !== -1) {
      customTemplates.value.splice(idx, 1)
      if (currentTemplate.value === id) {
        currentTemplate.value = 'classic'
      }
    }
  }

  function getConfigCSSVars(config: TemplateConfig): Record<string, string> {
    return {
      '--tmpl-accent': config.colors.accent,
      '--tmpl-header-bg': config.colors.headerBg,
      '--tmpl-header-text': config.colors.headerText,
      '--tmpl-text': config.colors.text,
      '--tmpl-subtext': config.colors.subtext,
      '--tmpl-bg': config.colors.background,
      '--tmpl-heading-font': config.fonts.heading,
      '--tmpl-body-font': config.fonts.body,
      '--tmpl-name-size': `${config.fontSize.name}px`,
      '--tmpl-section-title-size': `${config.fontSize.sectionTitle}px`,
      '--tmpl-body-size': `${config.fontSize.body}px`,
      '--tmpl-page-padding': `${config.spacing.pagePadding}px`,
      '--tmpl-section-gap': `${config.spacing.sectionGap}px`,
    }
  }

  return {
    currentTemplate,
    templates: allTemplates,
    builtinTemplates,
    customTemplates,
    activeConfig,
    baseTemplateId,
    setTemplate,
    addCustomTemplate,
    updateCustomTemplate,
    removeCustomTemplate,
    getConfigCSSVars,
  }
}
