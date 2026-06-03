<script setup lang="ts">
import { ref } from 'vue'
import { exportPDF, exportImage, exportDocx } from '../composables/useExport'
import { exportVectorPDF } from '../composables/useVectorPdf'
import type { ResumeData } from '../types/resume'

const props = defineProps<{ open: boolean; data?: ResumeData }>()
const emit = defineEmits<{ close: [] }>()

const exporting = ref<string | null>(null)
const toast = ref<{ msg: string; type: 'success' | 'error' } | null>(null)
let toastTimer: ReturnType<typeof setTimeout> | null = null

function showToast(msg: string, type: 'success' | 'error' = 'success') {
  if (toastTimer) clearTimeout(toastTimer)
  toast.value = { msg, type }
  toastTimer = setTimeout(() => { toast.value = null }, 2500)
}

function getResumeData(): ResumeData {
  if (props.data) return props.data
  return { personal: { name: '', title: '', email: '', phone: '', location: '', summary: '' }, contactFields: [], experiences: [], education: [], skills: [], projects: [], sectionOrder: [], customSections: {}, sectionNames: {} }
}

function exportJSON(data: ResumeData) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${data.personal.name || '简历'}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function exportHTML(name: string) {
  const printArea = document.querySelector('.print-area') as HTMLElement
  if (!printArea) throw new Error('找不到简历内容')

  const clone = printArea.cloneNode(true) as HTMLElement
  clone.querySelectorAll('.no-print, .empty-add-btn, .section-handle, .section-add-btn, .section-remove-btn, .item-handle, .item-delete-btn, .item-delete-btn-inline').forEach(el => el.remove())
  clone.querySelectorAll('.print-only').forEach(el => (el as HTMLElement).style.display = 'inline')

  const styles = Array.from(document.styleSheets)
    .map(sheet => {
      try {
        return Array.from(sheet.cssRules).map(rule => rule.cssText).join('\n')
      } catch { return '' }
    })
    .join('\n')

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name} - 简历</title>
  <style>${styles}</style>
</head>
<body style="margin:0;padding:20px;background:#f5f5f5;display:flex;justify-content:center;">
  ${clone.outerHTML}
</body>
</html>`

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${name}.html`
  a.click()
  URL.revokeObjectURL(url)
}

const formatLabels: Record<string, string> = { pdf: 'PDF', 'pdf-img': 'PDF', docx: 'Word', png: 'PNG', html: 'HTML', json: 'JSON' }

async function handleExport(format: string) {
  if (exporting.value) return
  exporting.value = format
  const data = getResumeData()
  const name = data.personal.name || '简历'
  try {
    switch (format) {
      case 'json':
        exportJSON(data)
        break
      case 'pdf':
        await exportVectorPDF(data, name)
        break
      case 'pdf-img':
        await exportPDF(name)
        break
      case 'docx':
        await exportDocx(data, name)
        break
      case 'png':
        await exportImage(name)
        break
      case 'html':
        exportHTML(name)
        break
    }
    showToast(`${formatLabels[format]} 导出成功`, 'success')
  } catch (e: any) {
    console.error(`Export ${format} failed:`, e)
    const msg = e?.message?.includes('字体') ? e.message : `${formatLabels[format]} 导出失败，请重试`
    showToast(msg, 'error')
  } finally {
    exporting.value = null
  }
}

const formats = [
  { id: 'pdf', label: 'PDF', desc: '矢量文字，清晰可选', icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
  { id: 'pdf-img', label: 'PDF 截图', desc: '保留模板原始样式', icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
  { id: 'docx', label: 'Word', desc: '可编辑的 Word 文档', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { id: 'png', label: 'PNG', desc: '高清图片', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { id: 'html', label: 'HTML', desc: '网页文件', icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' },
  { id: 'json', label: 'JSON', desc: '数据备份', icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4' },
]
</script>

<template>
  <dialog class="modal" :class="{ 'modal-open': open }">
    <div class="modal-box max-w-sm rounded-lg bg-base-100 border border-base-300">
      <h3 class="text-base font-bold text-base-content">导出简历</h3>
      <p class="text-xs text-base-content/40 mt-0.5 mb-4">选择一种格式导出</p>

      <!-- Toast -->
      <div v-if="toast" class="mb-3 animate-fade-in">
        <div class="alert py-2 text-xs" :class="toast.type === 'success' ? 'alert-success' : 'alert-error'">
          <svg v-if="toast.type === 'success'" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          <span>{{ toast.msg }}</span>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-2">
        <button
          v-for="fmt in formats"
          :key="fmt.id"
          class="btn btn-outline btn-sm h-auto py-3 flex-col gap-1 font-normal transition-all"
          :class="{ 'btn-disabled opacity-50': exporting && exporting !== fmt.id, 'btn-primary': exporting === fmt.id }"
          @click="handleExport(fmt.id)"
        >
          <span v-if="exporting === fmt.id" class="loading loading-spinner loading-xs"></span>
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path :d="fmt.icon"/></svg>
          <span class="text-xs font-bold" :class="exporting === fmt.id ? 'text-primary-content' : 'text-base-content'">{{ fmt.label }}</span>
          <span class="text-[10px]" :class="exporting === fmt.id ? 'text-primary-content/60' : 'text-base-content/40'">{{ fmt.desc }}</span>
        </button>
      </div>
      <div class="modal-action mt-4">
        <button class="btn btn-ghost btn-sm" @click="emit('close')" :disabled="!!exporting">关闭</button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop bg-black/30" @click="!exporting && emit('close')">
      <button>close</button>
    </form>
  </dialog>
</template>
