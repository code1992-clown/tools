import { toCanvas } from 'html-to-image'
import {
  Document, Packer, Paragraph, TextRun, ImageRun,
  AlignmentType, BorderStyle, TabStopPosition, TabStopType,
} from 'docx'
import type { ResumeData } from '../types/resume'
import { isBuiltinSection, DEFAULT_SECTION_NAMES } from '../types/resume'

function getPrintArea(): HTMLElement {
  const el = document.querySelector('.print-area') as HTMLElement
  if (!el) throw new Error('Cannot find .print-area element')
  return el
}

interface RestoreEntry {
  el: HTMLElement
  prop: string
  value: string
}

function prepareForCapture(el: HTMLElement): () => void {
  const restores: RestoreEntry[] = []

  function save(htmlEl: HTMLElement, prop: string) {
    restores.push({ el: htmlEl, prop, value: (htmlEl.style as any)[prop] })
  }

  function hide(htmlEl: HTMLElement) {
    save(htmlEl, 'display')
    htmlEl.style.display = 'none'
  }

  for (const p of ['borderRadius', 'boxShadow', 'outline'] as const) {
    save(el, p)
  }
  el.style.borderRadius = '0'
  el.style.boxShadow = 'none'
  el.style.outline = 'none'

  const hideSelectors = [
    '.no-print', '.ef-clear', '.empty-add-btn',
    '.section-handle', '.section-add-btn', '.section-remove-btn',
    '.item-handle', '.item-delete-btn', '.item-delete-btn-inline',
    '.tiptap-toolbar', '.contact-manager-btn',
  ]
  el.querySelectorAll(hideSelectors.join(', ')).forEach((e) => hide(e as HTMLElement))

  el.querySelectorAll('.ef, .edf').forEach((e) => {
    const h = e as HTMLElement
    for (const p of ['border', 'background', 'padding', 'margin', 'boxShadow'] as const) {
      save(h, p)
    }
    save(h, 'webkitAppearance')
    h.style.border = 'none'
    h.style.background = 'none'
    h.style.padding = '0'
    h.style.margin = '0'
    h.style.boxShadow = 'none'
    ;(h.style as any).webkitAppearance = 'none'
  })

  el.querySelectorAll('.ef-wrap').forEach((e) => {
    const h = e as HTMLElement
    save(h, 'display')
    h.style.display = 'inline'
  })

  el.querySelectorAll('.edf').forEach((e) => {
    const input = e as HTMLInputElement
    const text = input.value || ''
    if (!text) return
    const span = document.createElement('span')
    span.textContent = text
    span.className = 'edf-export-text'
    const style = window.getComputedStyle(input)
    span.style.font = style.font
    span.style.color = style.color
    span.style.letterSpacing = style.letterSpacing
    span.style.lineHeight = style.lineHeight
    span.style.whiteSpace = 'nowrap'
    input.style.display = 'none'
    input.parentElement?.insertBefore(span, input.nextSibling)
    restores.push({ el: input, prop: 'display', value: '' })
  })

  el.querySelectorAll('.resume-section').forEach((e) => {
    const h = e as HTMLElement
    for (const p of ['border', 'background', 'boxShadow', 'padding', 'margin'] as const) {
      save(h, p)
    }
    h.style.border = 'none'
    h.style.background = 'none'
    h.style.boxShadow = 'none'
    h.style.padding = '0'
    h.style.margin = '0 0 1.5rem 0'
  })

  el.querySelectorAll('.item-wrapper').forEach((e) => {
    const h = e as HTMLElement
    save(h, 'position')
    h.style.position = 'static'
  })

  return () => {
    el.querySelectorAll('.edf-export-text').forEach((s) => s.remove())
    for (let i = restores.length - 1; i >= 0; i--) {
      const { el: e, prop, value } = restores[i]
      ;(e.style as any)[prop] = value
    }
  }
}

function injectCaptureStyle(): HTMLStyleElement {
  const style = document.createElement('style')
  style.id = 'export-capture-css'
  style.textContent = `
    .print-area .edf::-webkit-calendar-picker-indicator { display: none !important; }
    .print-area .ef:hover, .print-area .ef:focus { border-color: transparent !important; background: none !important; box-shadow: none !important; }
    .print-area .print-only { display: inline !important; }
    .print-area {
      border-radius: 0 !important;
      box-shadow: none !important;
      outline: none !important;
      --tw-ring-shadow: 0 0 #0000 !important;
      --tw-shadow: 0 0 #0000 !important;
      --tw-ring-offset-shadow: 0 0 #0000 !important;
    }
  `
  document.head.appendChild(style)
  return style
}

const CAPTURE_PIXEL_RATIO = 8

async function captureAsCanvas(el: HTMLElement): Promise<HTMLCanvasElement> {
  return toCanvas(el, {
    pixelRatio: CAPTURE_PIXEL_RATIO,
    backgroundColor: '#ffffff',
    width: el.scrollWidth,
    height: el.scrollHeight,
    style: { margin: '0', transform: 'none' },
  })
}

function findPageBreaks(el: HTMLElement, firstPagePixels: number, pixelRatio: number, subsequentPagePixels?: number): number[] {
  const elRect = el.getBoundingClientRect()
  const breakPoints: number[] = []
  const nextPagePixels = subsequentPagePixels || firstPagePixels

  const breakSelectors = '.resume-section, .item-wrapper, header, h1, h2, p, li'
  const elements = el.querySelectorAll(breakSelectors)

  const candidates: number[] = []
  elements.forEach((child) => {
    const rect = child.getBoundingClientRect()
    const relativeTop = (rect.top - elRect.top) * pixelRatio
    const relativeBottom = (rect.bottom - elRect.top) * pixelRatio
    candidates.push(relativeTop, relativeBottom)
  })
  candidates.sort((a, b) => a - b)

  let currentPageEnd = firstPagePixels
  const totalHeight = el.scrollHeight * pixelRatio

  while (currentPageEnd < totalHeight) {
    let bestBreak = currentPageEnd
    const margin = nextPagePixels * 0.15

    for (let i = candidates.length - 1; i >= 0; i--) {
      const pos = candidates[i]
      if (pos <= currentPageEnd && pos >= currentPageEnd - margin) {
        bestBreak = pos
        break
      }
    }

    if (bestBreak <= (breakPoints.length ? breakPoints[breakPoints.length - 1] : 0)) {
      bestBreak = currentPageEnd
    }

    breakPoints.push(bestBreak)
    currentPageEnd = bestBreak + nextPagePixels
  }

  return breakPoints
}

function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Canvas toBlob failed'))
    }, 'image/png')
  })
}

function encodeSliceInWorker(imageData: ImageData, width: number, height: number): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const workerCode = `
      self.onmessage = function(e) {
        const { imageData, width, height } = e.data;
        const canvas = new OffscreenCanvas(width, height);
        const ctx = canvas.getContext('2d');
        ctx.putImageData(imageData, 0, 0);
        canvas.convertToBlob({ type: 'image/png' }).then(blob => {
          blob.arrayBuffer().then(buf => {
            self.postMessage(buf, [buf]);
          });
        }).catch(err => {
          self.postMessage({ error: err.message });
        });
      };
    `
    const blob = new Blob([workerCode], { type: 'application/javascript' })
    const url = URL.createObjectURL(blob)
    const worker = new Worker(url)

    worker.onmessage = (e) => {
      URL.revokeObjectURL(url)
      worker.terminate()
      if (e.data?.error) reject(new Error(e.data.error))
      else resolve(e.data as ArrayBuffer)
    }
    worker.onerror = (err) => {
      URL.revokeObjectURL(url)
      worker.terminate()
      reject(err)
    }

    worker.postMessage({ imageData, width, height }, [imageData.data.buffer])
  })
}

async function encodePageSlice(
  fullCanvas: HTMLCanvasElement,
  srcY: number,
  srcH: number,
  useWorker: boolean,
): Promise<string | ArrayBuffer> {
  const pageCanvas = document.createElement('canvas')
  pageCanvas.width = fullCanvas.width
  pageCanvas.height = srcH
  const ctx = pageCanvas.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height)
  ctx.drawImage(fullCanvas, 0, srcY, fullCanvas.width, srcH, 0, 0, fullCanvas.width, srcH)

  if (useWorker && typeof OffscreenCanvas !== 'undefined') {
    try {
      const imageData = ctx.getImageData(0, 0, pageCanvas.width, pageCanvas.height)
      return await encodeSliceInWorker(imageData, pageCanvas.width, pageCanvas.height)
    } catch {
      // Fallback to main thread
    }
  }

  const blob = await canvasToPngBlob(pageCanvas)
  return await blob.arrayBuffer()
}

export async function exportPDF(name?: string) {
  const el = getPrintArea()
  const restore = prepareForCapture(el)
  const style = injectCaptureStyle()

  await new Promise((r) => setTimeout(r, 50))

  try {
    const { jsPDF } = await import('jspdf')
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pdfW = pdf.internal.pageSize.getWidth()
    const pdfH = pdf.internal.pageSize.getHeight()

    const PAGE_MARGIN_TOP = 10

    const scale = pdfW / (el.scrollWidth * CAPTURE_PIXEL_RATIO)
    const usableH = pdfH - PAGE_MARGIN_TOP
    const pixelsPerPage = Math.floor(usableH / scale)
    const firstPagePixels = Math.floor(pdfH / scale)

    const pageBreaks = findPageBreaks(el, firstPagePixels, CAPTURE_PIXEL_RATIO, pixelsPerPage)

    const fullCanvas = await captureAsCanvas(el)

    const slicePoints = [0, ...pageBreaks, fullCanvas.height]
    const totalPages = slicePoints.length - 1

    const useWorker = typeof OffscreenCanvas !== 'undefined' && typeof Worker !== 'undefined'

    const pageSlices: { srcY: number; srcH: number }[] = []
    for (let page = 0; page < totalPages; page++) {
      const srcY = Math.round(slicePoints[page])
      const srcH = Math.round(slicePoints[page + 1] - slicePoints[page])
      if (srcH <= 0) break
      pageSlices.push({ srcY, srcH })
    }

    const maxConcurrent = Math.min(navigator.hardwareConcurrency || 4, pageSlices.length)
    const encodedPages: (string | ArrayBuffer)[] = new Array(pageSlices.length)

    for (let batch = 0; batch < pageSlices.length; batch += maxConcurrent) {
      const batchSlices = pageSlices.slice(batch, batch + maxConcurrent)
      const promises = batchSlices.map((slice, idx) =>
        encodePageSlice(fullCanvas, slice.srcY, slice.srcH, useWorker).then((result) => {
          encodedPages[batch + idx] = result
        }),
      )
      await Promise.all(promises)
    }

    for (let page = 0; page < encodedPages.length; page++) {
      if (page > 0) pdf.addPage()

      const srcH = pageSlices[page].srcH
      const drawH = srcH * scale
      const offsetY = page === 0 ? 0 : PAGE_MARGIN_TOP
      const imgData = encodedPages[page]

      if (imgData instanceof ArrayBuffer) {
        const dataUrl = `data:image/png;base64,${arrayBufferToBase64(imgData)}`
        pdf.addImage(dataUrl, 'PNG', 0, offsetY, pdfW, drawH)
      } else {
        pdf.addImage(imgData, 'PNG', 0, offsetY, pdfW, drawH)
      }
    }

    pdf.save(`${name || '简历'}.pdf`)
  } finally {
    style.remove()
    restore()
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunkSize = 8192
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize)
    binary += String.fromCharCode(...chunk)
  }
  return btoa(binary)
}

export async function exportImage(name?: string) {
  const el = getPrintArea()
  const restore = prepareForCapture(el)
  const style = injectCaptureStyle()

  try {
    const canvas = await captureAsCanvas(el)
    const dataUrl = canvas.toDataURL('image/png')

    const link = document.createElement('a')
    link.download = `${name || '简历'}.png`
    link.href = dataUrl
    link.click()
  } finally {
    style.remove()
    restore()
  }
}

function htmlToDocxParagraphs(html: string): Paragraph[] {
  if (!html) return []
  const div = document.createElement('div')
  div.innerHTML = html
  const paragraphs: Paragraph[] = []

  function getTextRuns(node: Node, inheritBold = false): TextRun[] {
    const runs: TextRun[] = []
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || ''
      if (text) {
        runs.push(new TextRun({ text, bold: inheritBold, size: 20, font: 'Microsoft YaHei' }))
      }
      return runs
    }
    if (node instanceof HTMLElement) {
      const tag = node.tagName.toLowerCase()
      const isBold = inheritBold || tag === 'strong' || tag === 'b'
      for (const child of Array.from(node.childNodes)) {
        runs.push(...getTextRuns(child, isBold))
      }
    }
    return runs
  }

  function processNode(node: Node) {
    if (node instanceof HTMLElement) {
      const tag = node.tagName.toLowerCase()
      if (tag === 'ul' || tag === 'ol') {
        for (const li of Array.from(node.children)) {
          const runs = getTextRuns(li)
          if (runs.length) {
            paragraphs.push(new Paragraph({
              children: [new TextRun({ text: '• ', size: 20, font: 'Microsoft YaHei' }), ...runs],
              spacing: { after: 40 },
              indent: { left: 360 },
            }))
          }
        }
        return
      }
      if (tag === 'p' || tag === 'div') {
        const runs = getTextRuns(node)
        if (runs.length) {
          paragraphs.push(new Paragraph({ children: runs, spacing: { after: 80 } }))
        }
        return
      }
      if (tag === 'br') {
        paragraphs.push(new Paragraph({ children: [], spacing: { after: 40 } }))
        return
      }
    }
    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node.textContent || '').trim()
      if (text) {
        paragraphs.push(new Paragraph({
          children: [new TextRun({ text, size: 20, font: 'Microsoft YaHei' })],
          spacing: { after: 80 },
        }))
      }
      return
    }
    for (const child of Array.from(node.childNodes)) {
      processNode(child)
    }
  }

  for (const child of Array.from(div.childNodes)) {
    processNode(child)
  }

  if (!paragraphs.length) {
    const text = div.textContent?.trim()
    if (text) {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text, size: 20, font: 'Microsoft YaHei' })],
        spacing: { after: 80 },
      }))
    }
  }

  return paragraphs
}

function base64ToArrayBuffer(dataUrl: string): ArrayBuffer | null {
  try {
    const base64 = dataUrl.split(',')[1]
    if (!base64) return null
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return bytes.buffer
  } catch {
    return null
  }
}

async function makeCircularAvatarForDocx(dataUrl: string, size = 120): Promise<ArrayBuffer | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, size, size)
      ctx.beginPath()
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
      ctx.closePath()
      ctx.clip()
      const srcSize = Math.min(img.width, img.height)
      const sx = (img.width - srcSize) / 2
      const sy = (img.height - srcSize) / 2
      ctx.drawImage(img, sx, sy, srcSize, srcSize, 0, 0, size, size)
      canvas.toBlob((blob) => {
        if (!blob) return resolve(null)
        blob.arrayBuffer().then((buf) => resolve(buf)).catch(() => resolve(null))
      }, 'image/png')
    }
    img.onerror = () => resolve(null)
    img.src = dataUrl
  })
}

export async function exportDocx(data: ResumeData, name?: string) {
  function getSectionTitle(key: string): string {
    if (data.sectionNames?.[key]) return data.sectionNames[key]
    if (isBuiltinSection(key)) return DEFAULT_SECTION_NAMES[key]
    return key
  }

  const children: Paragraph[] = []

  if (data.personal.avatar) {
    const circularImg = await makeCircularAvatarForDocx(data.personal.avatar, 120)
    if (circularImg) {
      children.push(new Paragraph({
        children: [new ImageRun({
          data: circularImg,
          transformation: { width: 50, height: 50 },
          type: 'png',
        })],
        spacing: { after: 120 },
      }))
    }
  }

  if (data.personal.name) {
    children.push(new Paragraph({
      children: [new TextRun({ text: data.personal.name, bold: true, size: 36, font: 'Microsoft YaHei' })],
      alignment: AlignmentType.LEFT,
      spacing: { after: 80 },
    }))
  }

  if (data.personal.title) {
    children.push(new Paragraph({
      children: [new TextRun({ text: data.personal.title, size: 24, color: '666666', font: 'Microsoft YaHei' })],
      spacing: { after: 120 },
    }))
  }

  const contactParts: string[] = []
  if (data.contactFields?.length) {
    data.contactFields
      .filter((f) => f.visible && f.value)
      .forEach((f) => contactParts.push(`${f.label}: ${f.value}`))
  } else {
    if (data.personal.email) contactParts.push(data.personal.email)
    if (data.personal.phone) contactParts.push(data.personal.phone)
    if (data.personal.location) contactParts.push(data.personal.location)
  }
  if (contactParts.length) {
    children.push(new Paragraph({
      children: [new TextRun({ text: contactParts.join('  |  '), size: 18, color: '888888', font: 'Microsoft YaHei' })],
      spacing: { after: 200 },
    }))
  }

  if (data.personal.summary) {
    children.push(createSectionHeading('个人简介'))
    children.push(new Paragraph({
      children: [new TextRun({ text: data.personal.summary, size: 20, font: 'Microsoft YaHei' })],
      spacing: { after: 200 },
    }))
  }

  for (const sectionKey of data.sectionOrder) {
    const title = getSectionTitle(sectionKey)

    if (sectionKey === 'experiences' && data.experiences.length) {
      children.push(createSectionHeading(title))
      for (const exp of data.experiences) {
        children.push(createItemHeader(exp.company, `${exp.startDate || ''} — ${exp.endDate || '至今'}`))
        if (exp.position) {
          children.push(new Paragraph({
            children: [new TextRun({ text: exp.position, size: 20, color: '555555', font: 'Microsoft YaHei' })],
            spacing: { after: 60 },
          }))
        }
        if (exp.description) {
          children.push(...htmlToDocxParagraphs(exp.description))
        }
      }
    } else if (sectionKey === 'projects' && data.projects.length) {
      children.push(createSectionHeading(title))
      for (const proj of data.projects) {
        children.push(createItemHeader(proj.name, `${proj.startDate || ''} — ${proj.endDate || '至今'}`))
        if (proj.role) {
          children.push(new Paragraph({
            children: [new TextRun({ text: proj.role, size: 20, color: '555555', font: 'Microsoft YaHei' })],
            spacing: { after: 60 },
          }))
        }
        if (proj.description) {
          children.push(...htmlToDocxParagraphs(proj.description))
        }
      }
    } else if (sectionKey === 'education' && data.education.length) {
      children.push(createSectionHeading(title))
      for (const edu of data.education) {
        children.push(createItemHeader(edu.school, `${edu.startDate || ''} — ${edu.endDate || '至今'}`))
        const detail = [edu.degree, edu.major].filter(Boolean).join(' / ')
        if (detail) {
          children.push(new Paragraph({
            children: [new TextRun({ text: detail, size: 20, color: '555555', font: 'Microsoft YaHei' })],
            spacing: { after: 120 },
          }))
        }
      }
    } else if (sectionKey === 'skills' && data.skills.length) {
      const levelLabels = ['入门', '初级', '中级', '熟练', '精通']
      children.push(createSectionHeading(title))
      const skillTexts = data.skills
        .filter((s) => s.name)
        .map((s) => `${s.name}（${levelLabels[s.level - 1]}）`)
      if (skillTexts.length) {
        children.push(new Paragraph({
          children: [new TextRun({ text: skillTexts.join('    '), size: 20, font: 'Microsoft YaHei' })],
          spacing: { after: 160 },
        }))
      }
    } else if (data.customSections?.[sectionKey]?.length) {
      children.push(createSectionHeading(title))
      for (const item of data.customSections[sectionKey]) {
        children.push(createItemHeader(item.title, `${item.startDate || ''} — ${item.endDate || ''}`))
        if (item.subtitle) {
          children.push(new Paragraph({
            children: [new TextRun({ text: item.subtitle, size: 20, color: '555555', font: 'Microsoft YaHei' })],
            spacing: { after: 60 },
          }))
        }
        if (item.description) {
          children.push(...htmlToDocxParagraphs(item.description))
        }
      }
    }
  }

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 720, right: 720, bottom: 720, left: 720 },
        },
      },
      children,
    }],
  })

  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${name || '简历'}.docx`
  a.click()
  URL.revokeObjectURL(url)
}

function createSectionHeading(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 22, font: 'Microsoft YaHei', color: '333333' })],
    spacing: { before: 240, after: 120 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
    },
  })
}

function createItemHeader(title: string, dateRange: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({ text: title || '', bold: true, size: 22, font: 'Microsoft YaHei' }),
      new TextRun({ text: `\t${dateRange}`, size: 18, color: '999999', font: 'Microsoft YaHei' }),
    ],
    tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
    spacing: { after: 40 },
  })
}
