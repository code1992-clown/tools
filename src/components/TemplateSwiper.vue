<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import type { TemplateId, TemplateInfo } from '../types/resume'

const props = defineProps<{
  templates: TemplateInfo[]
  current: TemplateId
  builtinIds?: string[]
}>()

const emit = defineEmits<{
  select: [id: TemplateId]
  customize: []
  edit: [id: TemplateId]
  delete: [id: TemplateId]
}>()

const builtinSet = computed(() => new Set(props.builtinIds || ['classic', 'modern', 'minimalist']))
function isCustom(id: string) {
  return !builtinSet.value.has(id)
}

const scrollContainer = ref<HTMLElement | null>(null)
const scrollIndex = ref(0)
const containerWidth = ref(320)

const VISIBLE_COUNT = computed(() => {
  if (containerWidth.value >= 280) return 4
  if (containerWidth.value >= 180) return 3
  return 2
})
const totalSlides = computed(() => props.templates.length + 1)
const maxIndex = computed(() => Math.max(0, totalSlides.value - VISIBLE_COUNT.value))

function updateWidth() {
  if (scrollContainer.value) {
    containerWidth.value = scrollContainer.value.clientWidth
  }
}

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  updateWidth()
  if (scrollContainer.value) {
    resizeObserver = new ResizeObserver(updateWidth)
    resizeObserver.observe(scrollContainer.value)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})

watch(maxIndex, (newMax) => {
  if (scrollIndex.value > newMax) scrollIndex.value = newMax
})

function scrollLeft() {
  if (scrollIndex.value > 0) scrollIndex.value--
}

function scrollRight() {
  if (scrollIndex.value < maxIndex.value) scrollIndex.value++
}

const templateColors: Record<string, string> = {
  classic: '#374151',
  modern: '#2563eb',
  minimalist: '#059669',
}

const isDragging = ref(false)
const dragStartX = ref(0)
const dragOffset = ref(0)
const hasDragged = ref(false)

function onMouseDown(e: MouseEvent) {
  if (e.button !== 0) return
  isDragging.value = true
  hasDragged.value = false
  dragStartX.value = e.clientX
  dragOffset.value = 0
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

function onMouseMove(e: MouseEvent) {
  if (!isDragging.value) return
  dragOffset.value = e.clientX - dragStartX.value
  if (Math.abs(dragOffset.value) > 5) hasDragged.value = true
}

function onMouseUp() {
  if (!isDragging.value) return
  isDragging.value = false
  const threshold = containerWidth.value / (VISIBLE_COUNT.value * 3)
  if (dragOffset.value < -threshold) scrollRight()
  else if (dragOffset.value > threshold) scrollLeft()
  dragOffset.value = 0
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
  if (hasDragged.value) setTimeout(() => { hasDragged.value = false }, 50)
}

function onCardClick(e: MouseEvent, id: TemplateId) {
  if (hasDragged.value) {
    e.stopPropagation()
    return
  }
  emit('select', id)
}

const trackStyle = computed(() => {
  const baseOffset = scrollIndex.value * (100 / VISIBLE_COUNT.value + 2.7)
  if (isDragging.value && dragOffset.value !== 0) {
    const pxOffset = (dragOffset.value / containerWidth.value) * 100
    return {
      transform: `translateX(calc(-${baseOffset}% + ${pxOffset}%))`,
      transition: 'none',
    }
  }
  return {
    transform: `translateX(-${baseOffset}%)`,
    transition: 'transform 300ms ease-out',
  }
})
</script>

<template>
  <div class="relative flex items-center gap-1">
    <!-- Left arrow -->
    <button
      v-show="scrollIndex > 0"
      @click="scrollLeft"
      class="btn btn-ghost btn-xs btn-circle shrink-0 z-10"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
    </button>

    <!-- Carousel container -->
    <div
      class="overflow-hidden flex-1 select-none"
      ref="scrollContainer"
      @mousedown="onMouseDown"
    >
      <div class="flex gap-2" :style="trackStyle">
        <!-- Template cards -->
        <div
          v-for="tmpl in templates"
          :key="tmpl.id"
          class="shrink-0 cursor-pointer group/card"
          :style="{ width: `calc(${100 / VISIBLE_COUNT}% - ${(VISIBLE_COUNT - 1) * 8 / VISIBLE_COUNT}px)` }"
          @click="onCardClick($event, tmpl.id)"
        >
          <div
            class="relative rounded-md px-2 py-1.5 h-[40px] flex flex-col justify-between transition-all duration-200 border"
            :class="current === tmpl.id
              ? 'bg-primary/5 border-primary/40 shadow-[inset_0_0_0_1px_rgba(37,99,235,0.15)]'
              : 'border-base-300 hover:border-base-content/20'"
          >
            <div class="flex items-center gap-1.5">
              <span
                class="w-1.5 h-1.5 rounded-full shrink-0"
                :style="{ backgroundColor: templateColors[tmpl.id] || tmpl.accentColor }"
              ></span>
              <span class="text-[11px] font-medium text-base-content truncate flex-1">{{ tmpl.name }}</span>
              <div v-if="isCustom(tmpl.id)" class="flex items-center gap-0.5 shrink-0 opacity-0 group-hover/card:opacity-100 transition-opacity">
                <button class="btn btn-ghost btn-xs p-0.5 min-h-0 h-auto" @click.stop="emit('edit', tmpl.id)" title="编辑">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button class="btn btn-ghost btn-xs p-0.5 min-h-0 h-auto text-error" @click.stop="emit('delete', tmpl.id)" title="删除">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>
            </div>
            <p class="text-[10px] text-base-content/40 leading-tight truncate">{{ tmpl.description }}</p>
          </div>
        </div>

        <!-- Add custom template card -->
        <div
          class="shrink-0 cursor-pointer group"
          :style="{ width: `calc(${100 / VISIBLE_COUNT}% - ${(VISIBLE_COUNT - 1) * 8 / VISIBLE_COUNT}px)` }"
          @click="emit('customize')"
        >
          <div class="rounded-md border border-dashed border-base-300 hover:border-primary/40 px-2 py-1.5 h-[40px] flex flex-col items-center justify-center gap-0.5 transition-colors group-hover:bg-primary/5">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-base-content/30 group-hover:text-primary transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span class="text-[10px] text-base-content/30 group-hover:text-primary font-medium transition-colors">自定义</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Right arrow -->
    <button
      v-show="scrollIndex < maxIndex"
      @click="scrollRight"
      class="btn btn-ghost btn-xs btn-circle shrink-0 z-10"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
    </button>
  </div>
</template>
