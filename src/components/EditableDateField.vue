<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  modelValue: string
  placeholder?: string
  emptyText?: string
  min?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const editing = ref(false)

const displayText = computed(() => {
  if (!props.modelValue) return ''
  return props.modelValue.replace(/-/g, '/')
})

function onInput(e: Event) {
  const val = (e.target as HTMLInputElement).value
  if (props.min && val && val < props.min) return
  emit('update:modelValue', val)
}

function enterEdit() {
  editing.value = true
}

function leaveEdit() {
  if (document.activeElement === inputRef.value) return
  editing.value = false
}

function onBlur() {
  editing.value = false
}

function focusInput() {
  inputRef.value?.showPicker?.()
  inputRef.value?.focus()
}
</script>

<template>
  <span
    class="edf-wrap"
    :class="{ 'edf-empty': !modelValue && emptyText }"
    @mouseenter="enterEdit"
    @mouseleave="leaveEdit"
  >
    <input
      v-show="editing || (!modelValue && !emptyText)"
      ref="inputRef"
      type="date"
      :value="modelValue"
      :placeholder="placeholder"
      :min="min"
      class="input input-ghost edf"
      :class="{ 'edf-has-empty-text': !modelValue && emptyText && !editing }"
      @input="onInput"
      @click="focusInput"
      @blur="onBlur"
    />
    <span
      v-if="!editing && modelValue"
      class="edf-display"
      @click="enterEdit"
    >{{ displayText }}</span>
    <span
      v-if="!editing && !modelValue && emptyText"
      class="edf-fallback"
      @click="enterEdit"
    >{{ emptyText }}</span>
  </span>
</template>

<style scoped>
.edf-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
}
.edf {
  font: inherit;
  color: inherit;
  letter-spacing: inherit;
  line-height: inherit;
  font-weight: inherit;
  font-size: inherit;
  height: auto;
  min-height: 0;
  padding: 2px 5px;
  margin: 0;
  border-radius: 5px;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  width: auto;
  min-width: 7em;
}
.edf-has-empty-text {
  width: 0;
  min-width: 0;
  max-width: 0;
  padding: 0;
  margin: 0;
  opacity: 0;
  position: absolute;
}
.edf-display {
  white-space: nowrap;
  cursor: pointer;
}
.edf-fallback {
  cursor: pointer;
  white-space: nowrap;
}
.edf:hover {
  border-color: color-mix(in srgb, var(--color-primary) 25%, transparent);
  background-color: color-mix(in srgb, var(--color-primary) 2%, transparent);
}
.edf:focus {
  border-color: color-mix(in srgb, var(--color-primary) 40%, transparent);
  background-color: transparent;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 6%, transparent);
  outline: none;
}
.edf::-webkit-calendar-picker-indicator {
  display: none;
}
@media print {
  .edf {
    display: none !important;
  }
  .edf-display {
    display: inline !important;
  }
  .edf-fallback {
    display: none !important;
  }
}
</style>
