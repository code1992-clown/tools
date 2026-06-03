import type { ResumeData } from '../types/resume'
import { isBuiltinSection, DEFAULT_SECTION_NAMES } from '../types/resume'
import { useTemplate } from './useTemplate'
import type { PDFFont, PDFPage, PDFDocument, Color } from 'pdf-lib'

const FONT_API_HOSTS = [
  'fonts.googleapis.com',
  'fonts.loli.net',
  'fonts.font.im',
]

const FONT_FAMILY_MAP: Record<string, string> = {
  'system-ui, sans-serif': 'Noto+Sans+SC',
  '"Microsoft YaHei", sans-serif': 'Noto+Sans+SC',
  '"SimHei", sans-serif': 'Noto+Sans+SC',
  '"SimSun", serif': 'Noto+Serif+SC',
  '"Noto Sans SC", sans-serif': 'Noto+Sans+SC',
  '"Inter", system-ui, sans-serif': 'Inter',
  'Georgia, serif': 'Noto+Serif+SC',
  '"Courier New", monospace': 'Noto+Sans+Mono',
}

const A4_WIDTH = 595.28
const A4_HEIGHT = 841.89
const MARGIN_X = 50
const MARGIN_TOP = 45
const MARGIN_BOTTOM = 45
const CONTENT_WIDTH = A4_WIDTH - MARGIN_X * 2

const SIZES = {
  name: 22,
  title: 13,
  contact: 9,
  contactIcon: 9,
  sectionTitle: 10.5,
  itemTitle: 11,
  itemDate: 9,
  itemSubtitle: 10,
  body: 10,
  skill: 10,
}

const LINE_HEIGHT = 1.5
const SECTION_GAP = 14
const ITEM_GAP = 10
const AVATAR_SIZE = 52

interface TextSegment {
  text: string
  bold: boolean
}

function htmlToText(html: string): string {
  if (!html) return ''
  const div = document.createElement('div')
  div.innerHTML = html
  div.querySelectorAll('br').forEach((br) => {
    br.replaceWith(document.createTextNode('\n'))
  })
  div.querySelectorAll('li').forEach((li) => {
    const text = li.textContent || ''
    li.replaceWith(document.createTextNode(`• ${text}\n`))
  })
  div.querySelectorAll('p').forEach((p, i) => {
    if (i > 0) p.insertBefore(document.createTextNode('\n'), p.firstChild)
  })
  return (div.textContent || '').trim()
}

function htmlToSegments(html: string): TextSegment[] {
  if (!html) return []
  const div = document.createElement('div')
  div.innerHTML = html

  const segments: TextSegment[] = []

  function isBoldContext(node: Node): boolean {
    let el: Node | null = node
    while (el && el !== div) {
      if (el instanceof HTMLElement) {
        const tag = el.tagName.toLowerCase()
        if (tag === 'strong' || tag === 'b') return true
        const fw = el.style.fontWeight
        if (fw === 'bold' || fw === '700' || fw === '800' || fw === '900') return true
      }
      el = el.parentNode
    }
    return false
  }

  function walk(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || ''
      if (text) {
        segments.push({ text, bold: isBoldContext(node) })
      }
      return
    }
    if (node instanceof HTMLElement) {
      const tag = node.tagName.toLowerCase()
      if (tag === 'br') {
        segments.push({ text: '\n', bold: false })
        return
      }
      if (tag === 'li') {
        segments.push({ text: '• ', bold: false })
        node.childNodes.forEach(walk)
        segments.push({ text: '\n', bold: false })
        return
      }
      if (tag === 'p' && segments.length > 0) {
        const last = segments[segments.length - 1]
        if (last && !last.text.endsWith('\n')) {
          segments.push({ text: '\n', bold: false })
        }
      }
      node.childNodes.forEach(walk)
    }
  }

  walk(div)

  const merged: TextSegment[] = []
  for (const seg of segments) {
    const last = merged[merged.length - 1]
    if (last && last.bold === seg.bold) {
      last.text += seg.text
    } else {
      merged.push({ ...seg })
    }
  }
  return merged
}

function collectAllText(data: ResumeData): string {
  const parts: string[] = []

  parts.push(
    data.personal.name, data.personal.title,
    data.personal.email, data.personal.phone,
    data.personal.location, data.personal.summary,
  )

  data.contactFields?.forEach((f) => parts.push(f.label, f.value))
  data.experiences.forEach((e) => parts.push(e.company, e.position, htmlToText(e.description), e.startDate, e.endDate))
  data.projects.forEach((p) => parts.push(p.name, p.role, htmlToText(p.description), p.startDate, p.endDate))
  data.education.forEach((e) => parts.push(e.school, e.degree, e.major, e.startDate, e.endDate))
  data.skills.forEach((s) => parts.push(s.name))

  Object.values(data.sectionNames || {}).forEach((n) => parts.push(n))
  Object.values(DEFAULT_SECTION_NAMES).forEach((n) => parts.push(n))

  for (const items of Object.values(data.customSections || {})) {
    items.forEach((item) => {
      parts.push(item.title, item.subtitle, htmlToText(item.description), item.startDate, item.endDate)
      if (item.fields) Object.values(item.fields).forEach((v) => parts.push(v))
    })
  }

  parts.push('入门', '初级', '中级', '熟练', '精通', '至今', '个人简介')
  parts.push('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789')
  parts.push(' /-—|:,.;!?@#%&()（）「」《》·、。，；：！？')

  return [...new Set(parts.join(''))].join('')
}

async function loadFontWeight(host: string, text: string, weight: number, fontFamily: string): Promise<ArrayBuffer | null> {
  const encoded = encodeURIComponent(text)
  const urls = [
    `https://${host}/css2?family=${fontFamily}:wght@${weight}&text=${encoded}&display=swap`,
    `https://${host}/css2?family=${fontFamily}:wght@${weight}&display=swap`,
  ]

  for (const cssUrl of urls) {
    try {
      const cssResp = await fetch(cssUrl, { signal: AbortSignal.timeout(8000) })
      if (!cssResp.ok) continue

      const css = await cssResp.text()
      const urlMatch = css.match(/src:\s*url\(([^)]+)\)/)
      if (!urlMatch) continue
      const url = urlMatch[1].replace(/['"]/g, '')

      const fontResp = await fetch(url, { signal: AbortSignal.timeout(15000) })
      if (!fontResp.ok) continue
      const buf = await fontResp.arrayBuffer()
      if (buf.byteLength > 500) return buf
    } catch {
      continue
    }
  }
  return null
}

function resolveGoogleFont(cssFont: string): string {
  if (FONT_FAMILY_MAP[cssFont]) return FONT_FAMILY_MAP[cssFont]
  for (const [key, val] of Object.entries(FONT_FAMILY_MAP)) {
    if (cssFont.includes(key.replace(/"/g, ''))) return val
  }
  return 'Noto+Sans+SC'
}

async function loadFonts(text: string, fontFamily = 'Noto+Sans+SC'): Promise<{ regular: ArrayBuffer; bold: ArrayBuffer }> {
  for (const host of FONT_API_HOSTS) {
    try {
      const [regular, bold] = await Promise.all([
        loadFontWeight(host, text, 400, fontFamily),
        loadFontWeight(host, text, 700, fontFamily),
      ])
      if (regular && bold && regular.byteLength !== bold.byteLength) {
        return { regular, bold }
      }
      if (regular && bold) {
        return { regular, bold }
      }
    } catch {
      continue
    }
  }

  if (fontFamily !== 'Noto+Sans+SC') {
    for (const host of FONT_API_HOSTS) {
      try {
        const [regular, bold] = await Promise.all([
          loadFontWeight(host, text, 400, 'Noto+Sans+SC'),
          loadFontWeight(host, text, 700, 'Noto+Sans+SC'),
        ])
        if (regular && bold) return { regular, bold }
      } catch {
        continue
      }
    }
  }

  throw new Error('无法加载中文字体，请检查网络连接')
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  if (!text) return []
  const lines: string[] = []
  const paragraphs = text.split('\n')

  for (const para of paragraphs) {
    if (!para.trim()) {
      lines.push('')
      continue
    }

    let remaining = para
    while (remaining.length > 0) {
      let width: number
      try {
        width = font.widthOfTextAtSize(remaining, size)
      } catch {
        lines.push(remaining)
        break
      }

      if (width <= maxWidth) {
        lines.push(remaining)
        break
      }

      let lo = 1
      let hi = remaining.length
      while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2)
        try {
          const w = font.widthOfTextAtSize(remaining.substring(0, mid), size)
          if (w <= maxWidth) lo = mid
          else hi = mid - 1
        } catch {
          hi = mid - 1
        }
      }

      if (lo === 0) lo = 1
      lines.push(remaining.substring(0, lo))
      remaining = remaining.substring(lo)
    }
  }

  return lines
}

function getSectionTitle(data: ResumeData, key: string): string {
  if (data.sectionNames?.[key]) return data.sectionNames[key]
  if (isBuiltinSection(key)) return DEFAULT_SECTION_NAMES[key]
  return key
}

async function makeCircularAvatar(dataUrl: string, size = 200): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
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

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('toBlob failed'))
          blob.arrayBuffer().then((buf) => resolve(new Uint8Array(buf))).catch(reject)
        },
        'image/png',
      )
    }
    img.onerror = reject
    img.src = dataUrl
  })
}

async function embedAvatar(doc: PDFDocument, avatarDataUrl: string) {
  try {
    const pngBytes = await makeCircularAvatar(avatarDataUrl, 256)
    return await doc.embedPng(pngBytes)
  } catch (e) {
    console.warn('Avatar embed failed:', e)
    return null
  }
}

function drawContactIcon(page: PDFPage, type: string, x: number, y: number, size: number, color: Color) {
  const s = size
  const cx = x + s / 2
  const cy = y + s / 2

  page.drawCircle({ x: cx, y: cy, size: s * 0.45, borderWidth: 0.6, borderColor: color, color: undefined })

  const iconScale = s * 0.25
  if (type === 'email') {
    page.drawLine({ start: { x: cx - iconScale, y: cy + iconScale * 0.4 }, end: { x: cx, y: cy - iconScale * 0.2 }, thickness: 0.5, color })
    page.drawLine({ start: { x: cx, y: cy - iconScale * 0.2 }, end: { x: cx + iconScale, y: cy + iconScale * 0.4 }, thickness: 0.5, color })
  } else if (type === 'phone') {
    page.drawLine({ start: { x: cx - iconScale * 0.3, y: cy + iconScale }, end: { x: cx + iconScale * 0.3, y: cy - iconScale }, thickness: 0.6, color })
  } else if (type === 'location') {
    page.drawCircle({ x: cx, y: cy + iconScale * 0.2, size: iconScale * 0.3, borderWidth: 0.5, borderColor: color, color: undefined })
  } else {
    page.drawCircle({ x: cx, y: cy, size: iconScale * 0.3, color, borderWidth: 0 })
  }
}

export async function exportVectorPDF(data: ResumeData, name?: string) {
  const { PDFDocument: PDFDoc, rgb } = await import('pdf-lib')
  const fontkit = (await import('@pdf-lib/fontkit')).default

  const pdfDoc = PDFDoc.create()
  ;(await pdfDoc).registerFontkit(fontkit)
  const doc = await pdfDoc

  const { activeConfig } = useTemplate()
  const bodyFontCSS = activeConfig.value?.fonts.body || 'system-ui, sans-serif'
  const googleFontFamily = resolveGoogleFont(bodyFontCSS)

  const allText = collectAllText(data)
  const fonts = await loadFonts(allText, googleFontFamily)
  const regular = await doc.embedFont(fonts.regular)
  const bold = await doc.embedFont(fonts.bold)

  const avatarImage = data.personal.avatar ? await embedAvatar(doc, data.personal.avatar) : null

  const black = rgb(0.067, 0.094, 0.153)
  const dark = rgb(0.2, 0.2, 0.2)
  const gray = rgb(0.4, 0.4, 0.4)
  const lightGray = rgb(0.6, 0.6, 0.6)
  const separator = rgb(0.78, 0.8, 0.82)

  let page = doc.addPage([A4_WIDTH, A4_HEIGHT])
  let y = A4_HEIGHT - MARGIN_TOP

  function ensureSpace(needed: number): void {
    if (y - needed < MARGIN_BOTTOM) {
      page = doc.addPage([A4_WIDTH, A4_HEIGHT])
      y = A4_HEIGHT - MARGIN_TOP
    }
  }

  function drawTextBlock(
    text: string, font: PDFFont, size: number,
    color: Color, x = MARGIN_X, maxW = CONTENT_WIDTH,
  ): void {
    const lines = wrapText(text, font, size, maxW - (x - MARGIN_X))
    const lineH = size * LINE_HEIGHT
    for (const line of lines) {
      if (!line && lines.length > 1) {
        y -= lineH * 0.5
        continue
      }
      ensureSpace(lineH)
      try {
        page.drawText(line, { x, y: y - size, font, size, color })
      } catch { /* skip chars not in font */ }
      y -= lineH
    }
  }

  function drawRichTextBlock(
    segments: TextSegment[], size: number,
    color: Color, startX = MARGIN_X, maxW = CONTENT_WIDTH,
  ): void {
    if (!segments.length) return
    const lineH = size * LINE_HEIGHT
    const availW = maxW - (startX - MARGIN_X)

    interface CharInfo { ch: string; bold: boolean }
    const chars: CharInfo[] = []
    for (const seg of segments) {
      for (const ch of seg.text) {
        chars.push({ ch, bold: seg.bold })
      }
    }

    let pos = 0
    while (pos < chars.length) {
      if (chars[pos].ch === '\n') {
        y -= lineH * 0.5
        pos++
        continue
      }

      let lineEnd = pos
      while (lineEnd < chars.length && chars[lineEnd].ch !== '\n') lineEnd++

      const lineChars = chars.slice(pos, lineEnd)
      if (!lineChars.length) { pos = lineEnd + 1; continue }

      const lineText = lineChars.map((c) => c.ch).join('')
      let fitLen = lineText.length
      try {
        const fullW = regular.widthOfTextAtSize(lineText, size)
        if (fullW > availW) {
          let lo = 1, hi = fitLen
          while (lo < hi) {
            const mid = Math.ceil((lo + hi) / 2)
            try {
              const w = regular.widthOfTextAtSize(lineText.substring(0, mid), size)
              if (w <= availW) lo = mid
              else hi = mid - 1
            } catch { hi = mid - 1 }
          }
          fitLen = lo
        }
      } catch { fitLen = Math.min(fitLen, 20) }

      ensureSpace(lineH)
      let drawX = startX
      let i = 0
      while (i < fitLen) {
        const currentBold = lineChars[i].bold
        let runEnd = i
        while (runEnd < fitLen && lineChars[runEnd].bold === currentBold) runEnd++

        const runText = lineChars.slice(i, runEnd).map((c) => c.ch).join('')
        const useFont = currentBold ? bold : regular
        try {
          page.drawText(runText, { x: drawX, y: y - size, font: useFont, size, color })
          drawX += useFont.widthOfTextAtSize(runText, size)
        } catch {
          drawX += runText.length * size * 0.5
        }
        i = runEnd
      }

      y -= lineH
      pos += fitLen
    }
  }

  function drawLine(): void {
    ensureSpace(8)
    page.drawLine({
      start: { x: MARGIN_X, y },
      end: { x: A4_WIDTH - MARGIN_X, y },
      thickness: 0.5,
      color: separator,
    })
    y -= 6
  }

  function drawSectionHeader(title: string): void {
    ensureSpace(SIZES.sectionTitle * LINE_HEIGHT + 10)
    y -= SECTION_GAP * 0.3

    try {
      const titleUpper = title.toUpperCase()
      page.drawText(titleUpper, {
        x: MARGIN_X, y: y - SIZES.sectionTitle,
        font: bold, size: SIZES.sectionTitle, color: dark,
        // letterSpacing not in pdf-lib, use tracking via manual spacing
      })
    } catch { /* skip */ }
    y -= SIZES.sectionTitle * LINE_HEIGHT + 2
    drawLine()
  }

  function drawItemHeader(title: string, dateRange: string): void {
    ensureSpace(SIZES.itemTitle * LINE_HEIGHT + SIZES.itemDate * LINE_HEIGHT)

    const dateW = dateRange ? safeTextWidth(dateRange, regular, SIZES.itemDate) : 0
    const maxTitleW = CONTENT_WIDTH - dateW - 20

    if (title) {
      const titleLines = wrapText(title, bold, SIZES.itemTitle, maxTitleW)
      const firstLine = titleLines[0] || ''
      try {
        page.drawText(firstLine, {
          x: MARGIN_X, y: y - SIZES.itemTitle,
          font: bold, size: SIZES.itemTitle, color: black,
        })
      } catch { /* skip */ }

      if (dateRange) {
        try {
          page.drawText(dateRange, {
            x: A4_WIDTH - MARGIN_X - dateW,
            y: y - SIZES.itemDate - 1,
            font: regular, size: SIZES.itemDate, color: lightGray,
          })
        } catch { /* skip */ }
      }

      y -= SIZES.itemTitle * LINE_HEIGHT

      for (let i = 1; i < titleLines.length; i++) {
        ensureSpace(SIZES.itemTitle * LINE_HEIGHT)
        try {
          page.drawText(titleLines[i], {
            x: MARGIN_X, y: y - SIZES.itemTitle,
            font: bold, size: SIZES.itemTitle, color: black,
          })
        } catch { /* skip */ }
        y -= SIZES.itemTitle * LINE_HEIGHT
      }
    }
  }

  function safeTextWidth(text: string, font: PDFFont, size: number): number {
    try { return font.widthOfTextAtSize(text, size) } catch { return text.length * size * 0.6 }
  }

  // ======= RENDER RESUME =======

  // Avatar + Name block
  const headerStartY = y
  let textStartX = MARGIN_X

  if (avatarImage) {
    const drawSize = AVATAR_SIZE
    page.drawImage(avatarImage, {
      x: MARGIN_X,
      y: y - drawSize,
      width: drawSize,
      height: drawSize,
    })

    page.drawCircle({
      x: MARGIN_X + drawSize / 2,
      y: y - drawSize / 2,
      size: drawSize / 2,
      borderWidth: 1.5,
      borderColor: separator,
      color: undefined,
    })

    textStartX = MARGIN_X + AVATAR_SIZE + 12
  }

  // Name
  if (data.personal.name) {
    ensureSpace(SIZES.name * LINE_HEIGHT)
    try {
      page.drawText(data.personal.name, {
        x: textStartX, y: y - SIZES.name,
        font: bold, size: SIZES.name, color: black,
      })
    } catch { /* skip */ }
    y -= SIZES.name * LINE_HEIGHT + 2
  }

  // Title
  if (data.personal.title) {
    ensureSpace(SIZES.title * LINE_HEIGHT)
    try {
      page.drawText(data.personal.title, {
        x: textStartX, y: y - SIZES.title,
        font: regular, size: SIZES.title, color: gray,
      })
    } catch { /* skip */ }
    y -= SIZES.title * LINE_HEIGHT + 2
  }

  // Ensure y is below avatar if avatar was drawn
  if (avatarImage) {
    const avatarBottom = headerStartY - AVATAR_SIZE
    if (y > avatarBottom) y = avatarBottom
  }

  // Contact info with icons
  const contactItems: { type: string; value: string }[] = []
  if (data.contactFields?.length) {
    data.contactFields
      .filter((f) => f.visible && f.value)
      .forEach((f) => contactItems.push({ type: f.type, value: f.value }))
  } else {
    if (data.personal.email) contactItems.push({ type: 'email', value: data.personal.email })
    if (data.personal.phone) contactItems.push({ type: 'phone', value: data.personal.phone })
    if (data.personal.location) contactItems.push({ type: 'location', value: data.personal.location })
  }

  if (contactItems.length) {
    y -= 4
    const iconSize = SIZES.contactIcon
    const itemGap = 16
    let cx = MARGIN_X

    for (const item of contactItems) {
      drawContactIcon(page, item.type, cx, y - iconSize, iconSize, lightGray)
      cx += iconSize + 4
      try {
        page.drawText(item.value, {
          x: cx, y: y - SIZES.contact,
          font: regular, size: SIZES.contact, color: lightGray,
        })
        cx += safeTextWidth(item.value, regular, SIZES.contact) + itemGap
      } catch {
        cx += item.value.length * SIZES.contact * 0.5 + itemGap
      }
    }
    y -= iconSize * LINE_HEIGHT + 6
  }

  // Summary
  if (data.personal.summary) {
    drawSectionHeader('个人简介')
    drawTextBlock(data.personal.summary, regular, SIZES.body, dark)
  }

  // Sections in order
  const levelLabels = ['入门', '初级', '中级', '熟练', '精通']

  for (const sectionKey of data.sectionOrder) {
    const title = getSectionTitle(data, sectionKey)

    if (sectionKey === 'experiences' && data.experiences.length) {
      drawSectionHeader(title)
      data.experiences.forEach((exp, i) => {
        if (i > 0) y -= ITEM_GAP
        drawItemHeader(exp.company, `${exp.startDate || ''} — ${exp.endDate || '至今'}`)
        if (exp.position) {
          drawTextBlock(exp.position, regular, SIZES.itemSubtitle, gray)
        }
        if (exp.description) {
          const segments = htmlToSegments(exp.description)
          if (segments.length) {
            y -= 2
            drawRichTextBlock(segments, SIZES.body, dark)
          }
        }
      })
    } else if (sectionKey === 'projects' && data.projects.length) {
      drawSectionHeader(title)
      data.projects.forEach((proj, i) => {
        if (i > 0) y -= ITEM_GAP
        drawItemHeader(proj.name, `${proj.startDate || ''} — ${proj.endDate || '至今'}`)
        if (proj.role) {
          drawTextBlock(proj.role, regular, SIZES.itemSubtitle, gray)
        }
        if (proj.description) {
          const segments = htmlToSegments(proj.description)
          if (segments.length) {
            y -= 2
            drawRichTextBlock(segments, SIZES.body, dark)
          }
        }
      })
    } else if (sectionKey === 'education' && data.education.length) {
      drawSectionHeader(title)
      data.education.forEach((edu, i) => {
        if (i > 0) y -= ITEM_GAP
        drawItemHeader(edu.school, `${edu.startDate || ''} — ${edu.endDate || '至今'}`)
        const detail = [edu.degree, edu.major].filter(Boolean).join(' / ')
        if (detail) {
          drawTextBlock(detail, regular, SIZES.itemSubtitle, gray)
        }
      })
    } else if (sectionKey === 'skills' && data.skills.length) {
      drawSectionHeader(title)
      const skillTexts = data.skills
        .filter((s) => s.name)
        .map((s) => `${s.name}（${levelLabels[s.level - 1]}）`)
      if (skillTexts.length) {
        drawTextBlock(skillTexts.join('    '), regular, SIZES.skill, dark)
      }
    } else if (data.customSections?.[sectionKey]?.length) {
      drawSectionHeader(title)
      const items = data.customSections[sectionKey]
      items.forEach((item, i) => {
        if (i > 0) y -= ITEM_GAP
        const dateRange = [item.startDate, item.endDate].filter(Boolean).join(' — ')
        drawItemHeader(item.title, dateRange)
        if (item.subtitle) {
          drawTextBlock(item.subtitle, regular, SIZES.itemSubtitle, gray)
        }
        if (item.description) {
          const segments = htmlToSegments(item.description)
          if (segments.length) {
            y -= 2
            drawRichTextBlock(segments, SIZES.body, dark)
          }
        }
      })
    }
  }

  const pdfBytes = await doc.save()
  const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${name || '简历'}.pdf`
  a.click()
  URL.revokeObjectURL(url)
}
