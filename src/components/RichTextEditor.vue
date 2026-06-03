<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import { TextStyle } from '@tiptap/extension-text-style'
import { watch, ref, nextTick, onBeforeUnmount } from 'vue'

const props = defineProps<{
  modelValue: string
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const isFocused = ref(false)
const showLinkInput = ref(false)
const linkUrl = ref('')
const bubbleVisible = ref(false)
const bubbleStyle = ref<Record<string, string>>({})
const wrapperRef = ref<HTMLElement | null>(null)
const linkInputRef = ref<HTMLInputElement | null>(null)
const savedSelection = ref<{ from: number; to: number } | null>(null)

const editor = useEditor({
  content: props.modelValue || '',
  extensions: [
    StarterKit.configure({
      heading: false,
      codeBlock: false,
      blockquote: false,
      horizontalRule: false,
      code: false,
      link: false,
      underline: false,
    }),
    Underline,
    Link.configure({
      openOnClick: false,
      HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' },
    }),
    Placeholder.configure({
      placeholder: props.placeholder || '输入内容...',
    }),
    TextAlign.configure({
      types: ['paragraph'],
    }),
    Highlight.configure({
      multicolor: true,
    }),
    TextStyle,
  ],
  editorProps: {
    attributes: {
      class: 'rte-content outline-none min-h-[2em] text-sm text-gray-600 leading-relaxed',
    },
    handleClick(view, pos, event) {
      if (event.metaKey || event.ctrlKey) {
        const link = (event.target as HTMLElement).closest('a')
        if (link?.href) {
          window.open(link.href, '_blank', 'noopener')
          return true
        }
      }
      return false
    },
  },
  onUpdate({ editor: ed }) {
    const html = ed.getHTML()
    emit('update:modelValue', html === '<p></p>' ? '' : html)
  },
  onFocus() { isFocused.value = true },
  onBlur() {
    setTimeout(() => {
      if (!wrapperRef.value?.contains(document.activeElement)) {
        isFocused.value = false
        bubbleVisible.value = false
        if (showLinkInput.value) {
          showLinkInput.value = false
          savedSelection.value = null
        }
      }
    }, 0)
  },
  onSelectionUpdate({ editor: ed }) {
    updateBubble(ed)
  },
  onTransaction({ editor: ed }) {
    updateBubble(ed)
  },
})

function updateBubble(ed: any) {
  const { from, to, empty } = ed.state.selection
  if (empty || from === to) {
    bubbleVisible.value = false
    return
  }
  nextTick(() => {
    const wrapper = wrapperRef.value
    if (!wrapper) return
    const view = ed.view
    const start = view.coordsAtPos(from)
    const end = view.coordsAtPos(to)
    const wrapperRect = wrapper.getBoundingClientRect()
    const left = (start.left + end.left) / 2 - wrapperRect.left
    const bubbleHeight = 36
    const gap = 8
    const toolbarHeight = isFocused.value ? 37 : 0
    const spaceAbove = start.top - wrapperRect.top - toolbarHeight
    let top: number
    if (spaceAbove >= bubbleHeight + gap) {
      top = start.top - wrapperRect.top - bubbleHeight - gap
    } else {
      top = end.bottom - wrapperRect.top + gap
    }
    bubbleStyle.value = {
      left: `${Math.max(0, left)}px`,
      top: `${top}px`,
      transform: 'translateX(-50%)',
    }
    bubbleVisible.value = true
  })
}

watch(() => props.modelValue, (val) => {
  if (editor.value && editor.value.getHTML() !== val) {
    editor.value.commands.setContent(val || '', false)
  }
})

function toggleBold() { editor.value?.chain().focus().toggleBold().run() }
function toggleItalic() { editor.value?.chain().focus().toggleItalic().run() }
function toggleUnderline() { editor.value?.chain().focus().toggleUnderline().run() }
function toggleStrike() { editor.value?.chain().focus().toggleStrike().run() }
function toggleBulletList() { editor.value?.chain().focus().toggleBulletList().run() }
function toggleOrderedList() { editor.value?.chain().focus().toggleOrderedList().run() }
function toggleHighlight() { editor.value?.chain().focus().toggleHighlight({ color: '#fef08a' }).run() }

function toggleLink() {
  if (editor.value?.isActive('link')) {
    editor.value.chain().focus().unsetLink().run()
    return
  }
  const { from, to } = editor.value!.state.selection
  if (from === to) return
  savedSelection.value = { from, to }
  linkUrl.value = 'https://'
  showLinkInput.value = true
  nextTick(() => {
    linkInputRef.value?.focus()
    linkInputRef.value?.select()
  })
}

function applyLink() {
  const url = linkUrl.value.trim()
  if (url && url !== 'https://') {
    const chain = editor.value!.chain().focus()
    if (savedSelection.value) {
      chain.setTextSelection(savedSelection.value).setLink({ href: url, target: '_blank' }).run()
    } else {
      chain.setLink({ href: url, target: '_blank' }).run()
    }
  }
  showLinkInput.value = false
  savedSelection.value = null
}

function cancelLink() {
  showLinkInput.value = false
  savedSelection.value = null
  editor.value?.chain().focus().run()
}

function onLinkInputBlur(e: FocusEvent) {
  setTimeout(() => {
    if (!wrapperRef.value?.contains(document.activeElement)) {
      showLinkInput.value = false
      savedSelection.value = null
    }
  }, 0)
}
</script>

<template>
  <div ref="wrapperRef" class="rte-wrapper" :class="{ 'rte-focused': isFocused }">
    <!-- Bubble Menu (floating on selection) -->
    <Transition name="bubble">
      <div
        v-if="bubbleVisible && isFocused"
        class="rte-bubble no-print"
        :style="bubbleStyle"
      >
        <button
          type="button"
          class="rte-bubble-btn"
          :class="{ active: editor?.isActive('bold') }"
          @mousedown.prevent="toggleBold"
          title="加粗"
        ><strong>B</strong></button>
        <button
          type="button"
          class="rte-bubble-btn"
          :class="{ active: editor?.isActive('italic') }"
          @mousedown.prevent="toggleItalic"
          title="斜体"
        ><em>I</em></button>
        <button
          type="button"
          class="rte-bubble-btn"
          :class="{ active: editor?.isActive('underline') }"
          @mousedown.prevent="toggleUnderline"
          title="下划线"
        ><u>U</u></button>
        <button
          type="button"
          class="rte-bubble-btn"
          :class="{ active: editor?.isActive('strike') }"
          @mousedown.prevent="toggleStrike"
          title="删除线"
        ><s>S</s></button>
        <span class="rte-bubble-sep"></span>
        <button
          type="button"
          class="rte-bubble-btn"
          :class="{ active: editor?.isActive('highlight') }"
          @mousedown.prevent="toggleHighlight"
          title="高亮"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 11-6 6v3h9l3-3"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/></svg>
        </button>
        <button
          type="button"
          class="rte-bubble-btn"
          :class="{ active: editor?.isActive('link') }"
          @mousedown.prevent="toggleLink"
          title="链接"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
        </button>
      </div>
    </Transition>

    <!-- Static toolbar on focus -->
    <div v-show="isFocused" class="rte-toolbar no-print">
      <button
        type="button"
        class="btn btn-ghost btn-xs btn-square min-h-0 h-6 w-6 text-xs font-semibold"
        :class="{ 'btn-active': editor?.isActive('bold') }"
        @mousedown.prevent="toggleBold"
        title="加粗"
      >B</button>
      <button
        type="button"
        class="btn btn-ghost btn-xs btn-square min-h-0 h-6 w-6 text-xs"
        :class="{ 'btn-active': editor?.isActive('italic') }"
        @mousedown.prevent="toggleItalic"
        title="斜体"
      ><em>I</em></button>
      <button
        type="button"
        class="btn btn-ghost btn-xs btn-square min-h-0 h-6 w-6 text-xs"
        :class="{ 'btn-active': editor?.isActive('underline') }"
        @mousedown.prevent="toggleUnderline"
        title="下划线"
      ><u>U</u></button>
      <button
        type="button"
        class="btn btn-ghost btn-xs btn-square min-h-0 h-6 w-6 text-xs"
        :class="{ 'btn-active': editor?.isActive('strike') }"
        @mousedown.prevent="toggleStrike"
        title="删除线"
      ><s>S</s></button>
      <div class="divider divider-horizontal mx-0.5 h-4"></div>
      <button
        type="button"
        class="btn btn-ghost btn-xs btn-square min-h-0 h-6 w-6"
        :class="{ 'btn-active': editor?.isActive('bulletList') }"
        @mousedown.prevent="toggleBulletList"
        title="无序列表"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3" cy="6" r="1" fill="currentColor"/><circle cx="3" cy="12" r="1" fill="currentColor"/><circle cx="3" cy="18" r="1" fill="currentColor"/></svg>
      </button>
      <button
        type="button"
        class="btn btn-ghost btn-xs btn-square min-h-0 h-6 w-6"
        :class="{ 'btn-active': editor?.isActive('orderedList') }"
        @mousedown.prevent="toggleOrderedList"
        title="有序列表"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><text x="2" y="7" font-size="6" fill="currentColor" stroke="none">1</text><text x="2" y="13" font-size="6" fill="currentColor" stroke="none">2</text><text x="2" y="19" font-size="6" fill="currentColor" stroke="none">3</text></svg>
      </button>
      <div class="divider divider-horizontal mx-0.5 h-4"></div>
      <button
        type="button"
        class="btn btn-ghost btn-xs btn-square min-h-0 h-6 w-6"
        :class="{ 'btn-active': editor?.isActive('highlight') }"
        @mousedown.prevent="toggleHighlight"
        title="高亮"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 11-6 6v3h9l3-3"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/></svg>
      </button>
      <button
        type="button"
        class="btn btn-ghost btn-xs btn-square min-h-0 h-6 w-6"
        :class="{ 'btn-active': editor?.isActive('link') }"
        @mousedown.prevent="toggleLink"
        title="插入/移除链接 (Ctrl+Click 打开)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
      </button>
    </div>

    <!-- Link URL input -->
    <div v-if="showLinkInput" class="rte-link-bar no-print">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 shrink-0 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
      <input
        ref="linkInputRef"
        v-model="linkUrl"
        class="rte-link-input"
        placeholder="https://example.com"
        @keydown.enter.prevent="applyLink"
        @keydown.escape.prevent="cancelLink"
        @blur="onLinkInputBlur"
      />
      <button class="btn btn-ghost btn-xs min-h-0 h-5 px-1.5 text-primary" @mousedown.prevent="applyLink">确定</button>
      <button class="btn btn-ghost btn-xs min-h-0 h-5 px-1.5 text-gray-400" @mousedown.prevent="cancelLink">取消</button>
    </div>

    <EditorContent :editor="editor" />
  </div>
</template>

<style scoped>
.rte-wrapper {
  position: relative;
  border: 1px solid transparent;
  border-radius: 6px;
  padding: 3px 6px;
  margin: -3px -6px;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.rte-wrapper:hover {
  border-color: color-mix(in srgb, var(--color-primary) 25%, transparent);
  background-color: color-mix(in srgb, var(--color-primary) 2%, transparent);
}
.rte-focused {
  border-color: color-mix(in srgb, var(--color-primary) 40%, transparent);
  background-color: var(--tmpl-bg, #ffffff);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 6%, transparent);
}
.rte-toolbar {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px 3px;
  margin-bottom: 4px;
  border-bottom: 1px solid color-mix(in srgb, var(--color-primary) 8%, transparent);
  position: relative;
  z-index: 5;
}

/* Bubble Menu */
.rte-bubble {
  position: absolute;
  z-index: 50;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px 6px;
  background: var(--color-neutral);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  pointer-events: auto;
}
.rte-bubble-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  font-size: 13px;
  color: var(--color-neutral-content);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background 0.15s;
}
.rte-bubble-btn:hover {
  background: color-mix(in srgb, var(--color-neutral-content) 15%, transparent);
}
.rte-bubble-btn.active {
  background: var(--color-primary);
  color: var(--color-primary-content);
}
.rte-bubble-sep {
  width: 1px;
  height: 18px;
  background: color-mix(in srgb, var(--color-neutral-content) 20%, transparent);
  margin: 0 2px;
}

.bubble-enter-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.bubble-leave-active {
  transition: opacity 0.1s ease;
}
.bubble-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(4px);
}
.bubble-leave-to {
  opacity: 0;
}

:deep(.tiptap p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  float: left;
  color: color-mix(in srgb, var(--color-base-content) 30%, transparent);
  font-style: italic;
  pointer-events: none;
  height: 0;
}

:deep(.rte-content) {
  white-space: pre-wrap;
  word-wrap: break-word;
}
:deep(.rte-content p) {
  margin: 0;
}
:deep(.rte-content ul) {
  padding-left: 1.5em;
  margin: 0.25em 0;
  list-style-type: disc;
}
:deep(.rte-content ol) {
  padding-left: 1.5em;
  margin: 0.25em 0;
  list-style-type: decimal;
}
:deep(.rte-content li) {
  margin: 0.1em 0;
  display: list-item;
}
:deep(.rte-content li p) {
  margin: 0;
}
:deep(.rte-content strong) {
  font-weight: 600;
}
:deep(.rte-content a) {
  color: #2563eb;
  text-decoration: underline;
  text-underline-offset: 2px;
  cursor: text;
}
:deep(.rte-content a:hover) {
  color: #1d4ed8;
}
:deep(.rte-content mark) {
  border-radius: 2px;
  padding: 0 2px;
}
:deep(.rte-content s) {
  text-decoration: line-through;
}
.rte-link-bar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 4px;
  margin-bottom: 4px;
  border-bottom: 1px solid color-mix(in srgb, var(--color-primary) 8%, transparent);
  background: var(--tmpl-bg, #ffffff);
  z-index: 5;
}
.rte-link-input {
  flex: 1;
  font-size: 12px;
  padding: 2px 6px;
  border: 1px solid color-mix(in srgb, var(--color-primary) 20%, transparent);
  border-radius: 4px;
  outline: none;
  background: transparent;
  color: inherit;
  min-width: 0;
}
.rte-link-input:focus {
  border-color: color-mix(in srgb, var(--color-primary) 50%, transparent);
}

@media print {
  .rte-wrapper {
    padding: 0 !important;
    margin: 0 !important;
    border: none !important;
    background: none !important;
    box-shadow: none !important;
  }
}
</style>
