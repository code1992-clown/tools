import { ref, watch } from 'vue'

export type ThemeMode = 'light' | 'dark' | 'custom'

export interface CustomThemeConfig {
  primary: string
  base100: string
  base200: string
  base300: string
  baseContent: string
}

const DEFAULT_CUSTOM: CustomThemeConfig = {
  primary: '#2563eb',
  base100: '#ffffff',
  base200: '#f8f9fa',
  base300: '#e5e7eb',
  baseContent: '#111827',
}

const STORAGE_KEY = 'resume-theme-mode'
const CUSTOM_STORAGE_KEY = 'resume-theme-custom'

function loadMode(): ThemeMode {
  const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null
  return saved && ['light', 'dark', 'custom'].includes(saved) ? saved : 'dark'
}

function loadCustomConfig(): CustomThemeConfig {
  try {
    const saved = localStorage.getItem(CUSTOM_STORAGE_KEY)
    if (saved) return { ...DEFAULT_CUSTOM, ...JSON.parse(saved) }
  } catch { /* ignore */ }
  return { ...DEFAULT_CUSTOM }
}

const currentMode = ref<ThemeMode>(loadMode())
const customConfig = ref<CustomThemeConfig>(loadCustomConfig())

function applyTheme(mode: ThemeMode) {
  const html = document.documentElement
  const customStyleEl = document.getElementById('custom-theme-vars')

  if (mode === 'light') {
    html.setAttribute('data-theme', 'resume-light')
    if (customStyleEl) customStyleEl.textContent = ''
  } else if (mode === 'dark') {
    html.setAttribute('data-theme', 'resume-night')
    if (customStyleEl) customStyleEl.textContent = ''
  } else {
    html.setAttribute('data-theme', 'resume-custom')
    applyCustomVars()
  }
}

function applyCustomVars() {
  let styleEl = document.getElementById('custom-theme-vars')
  if (!styleEl) {
    styleEl = document.createElement('style')
    styleEl.id = 'custom-theme-vars'
    document.head.appendChild(styleEl)
  }
  const c = customConfig.value
  styleEl.textContent = `
    [data-theme="resume-custom"] {
      --color-base-100: ${c.base100};
      --color-base-200: ${c.base200};
      --color-base-300: ${c.base300};
      --color-base-content: ${c.baseContent};
      --color-primary: ${c.primary};
      --color-primary-content: #ffffff;
    }
  `
}

function initTheme() {
  let styleEl = document.getElementById('custom-theme-vars')
  if (!styleEl) {
    styleEl = document.createElement('style')
    styleEl.id = 'custom-theme-vars'
    document.head.appendChild(styleEl)
  }
  applyTheme(currentMode.value)
}

export function useTheme() {
  watch(currentMode, (mode) => {
    localStorage.setItem(STORAGE_KEY, mode)
    applyTheme(mode)
  })

  watch(customConfig, (config) => {
    localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(config))
    if (currentMode.value === 'custom') applyCustomVars()
  }, { deep: true })

  function setMode(mode: ThemeMode) {
    currentMode.value = mode
  }

  function updateCustomConfig(partial: Partial<CustomThemeConfig>) {
    Object.assign(customConfig.value, partial)
  }

  function resetCustomConfig() {
    Object.assign(customConfig.value, { ...DEFAULT_CUSTOM })
  }

  return {
    currentMode,
    customConfig,
    setMode,
    updateCustomConfig,
    resetCustomConfig,
    initTheme,
  }
}
