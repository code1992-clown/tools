<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue'

const props = withDefaults(defineProps<{
  modelValue: string
  placeholder?: string
  multiline?: boolean
  autoWidth?: boolean
}>(), {
  placeholder: '',
  multiline: false,
  autoWidth: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const textareaRef = ref<HTMLTextAreaElement>()

function autoResize() {
  const el = textareaRef.value
  if (!el) return
  el.style.height = '0'
  el.style.height = el.scrollHeight + 'px'
}

watch(() => props.modelValue, () => {
  if (props.multiline) nextTick(autoResize)
})

onMounted(() => {
  if (props.multiline) nextTick(autoResize)
})

function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLInputElement).value)
  if (props.multiline) nextTick(autoResize)
}

function clear() {
  emit('update:modelValue', '')
}
</script>

<template>
  <span class="ef-wrap" :class="{ 'ef-has-value': modelValue, 'ef-wrap-auto': autoWidth }">
    <textarea
      v-if="multiline"
      ref="textareaRef"
      :value="modelValue"
      :placeholder="placeholder"
      class="textarea textarea-ghost ef ef-multi"
      @input="onInput"
      rows="1"
    />
    <input
      v-else
      :value="modelValue"
      :placeholder="placeholder"
      class="input input-ghost ef"
      :class="{ 'ef-auto': autoWidth }"
      @input="onInput"
    />
    <button
      v-if="modelValue"
      class="btn btn-ghost btn-circle btn-xs ef-clear no-print"
      @click.stop="clear"
      title="清空"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  </span>
</template>

<style scoped>
.ef-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  width: 100%;
}
.ef {
  font: inherit;
  color: inherit;
  letter-spacing: inherit;
  line-height: inherit;
  text-transform: inherit;
  font-weight: inherit;
  width: 100%;
  height: auto;
  min-height: 0;
  padding: 2px 5px;
  margin: 0 -5px;
  border-radius: 5px;
  border: 1px solid transparent;
  background: transparent;
}
.ef:hover {
  border-color: color-mix(in srgb, var(--color-primary) 25%, transparent);
  background-color: color-mix(in srgb, var(--color-primary) 2%, transparent);
}
.ef:focus {
  border-color: color-mix(in srgb, var(--color-primary) 40%, transparent);
  background-color: transparent;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 6%, transparent);
  outline: none;
}
.ef::placeholder {
  color: color-mix(in srgb, var(--color-base-content) 30%, transparent);
  font-style: italic;
}
.ef-multi {
  resize: none;
  overflow: hidden;
  display: block;
  white-space: pre-wrap;
  word-wrap: break-word;
  field-sizing: content;
}
.ef-auto {
  field-sizing: content;
  width: auto;
  min-width: 3em;
}
.ef-wrap-auto {
  width: auto;
}
.ef-has-value .ef {
  padding-right: 28px;
}
.ef-clear {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0;
  min-height: 0;
  width: 16px;
  height: 16px;
  color: color-mix(in srgb, var(--color-base-content) 40%, transparent);
  z-index: 1;
  transition: opacity 0.15s;
}
.ef-wrap:hover .ef-clear,
.ef:focus ~ .ef-clear {
  opacity: 1;
}
.ef-clear:hover {
  color: color-mix(in srgb, var(--color-error) 70%, transparent);
  background: transparent;
}
@media print {
  .ef-wrap {
    display: inline;
  }
  .ef {
    padding: 0 !important;
    margin: 0 !important;
    border: none !important;
    background: none !important;
    box-shadow: none !important;
    overflow: visible !important;
  }
  .ef:placeholder-shown {
    display: none !important;
  }
  .ef-clear {
    display: none !important;
  }
}
</style>
