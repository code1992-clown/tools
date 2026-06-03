<script setup lang="ts">
import type { CustomSectionFieldDef } from '../types/resume'
import EditableField from './EditableField.vue'
import EditableDateField from './EditableDateField.vue'
import RichTextEditor from './RichTextEditor.vue'

const props = defineProps<{
  fields: CustomSectionFieldDef[]
  item: Record<string, any>
}>()

function getFieldValue(fieldId: string): string {
  if (fieldId in props.item && typeof props.item[fieldId] === 'string') {
    return props.item[fieldId]
  }
  return props.item.fields?.[fieldId] || ''
}

function setFieldValue(fieldId: string, value: string) {
  if (fieldId in props.item && fieldId !== 'fields' && fieldId !== 'id') {
    props.item[fieldId] = value
    return
  }
  if (!props.item.fields) {
    props.item.fields = {}
  }
  props.item.fields[fieldId] = value
}

function fieldStyle(field: CustomSectionFieldDef) {
  if (!field.style) return {}
  return {
    fontSize: field.style.fontSize,
    fontWeight: field.style.fontWeight,
    color: field.style.color,
    textAlign: field.style.textAlign,
  }
}

function fieldWrapperStyle(field: CustomSectionFieldDef) {
  if (!field.style?.width || field.style.width === '100%') return {}
  return {
    display: 'inline-block',
    width: field.style.width,
    verticalAlign: 'top',
  }
}
</script>

<template>
  <div class="flex flex-wrap gap-y-1">
    <template v-for="field in fields" :key="field.id">
      <!-- Text input -->
      <div v-if="field.type === 'text'" :style="{ ...fieldWrapperStyle(field), ...fieldStyle(field) }">
        <EditableField
          :modelValue="getFieldValue(field.id)"
          @update:modelValue="setFieldValue(field.id, $event)"
          :placeholder="field.placeholder || field.label"
        />
      </div>

      <!-- Textarea -->
      <div v-else-if="field.type === 'textarea'" :style="{ ...fieldWrapperStyle(field), ...fieldStyle(field) }">
        <EditableField
          :modelValue="getFieldValue(field.id)"
          @update:modelValue="setFieldValue(field.id, $event)"
          :placeholder="field.placeholder || field.label"
          :multiline="true"
        />
      </div>

      <!-- Date picker -->
      <div v-else-if="field.type === 'date'" :style="{ ...fieldWrapperStyle(field), ...fieldStyle(field) }">
        <EditableDateField
          :modelValue="getFieldValue(field.id)"
          @update:modelValue="setFieldValue(field.id, $event)"
          :placeholder="field.placeholder || field.label"
        />
      </div>

      <!-- Date range -->
      <div v-else-if="field.type === 'daterange'" class="flex items-center gap-1" :style="{ ...fieldWrapperStyle(field), ...fieldStyle(field) }">
        <EditableDateField
          :modelValue="getFieldValue(field.id + '_start') || getFieldValue('startDate')"
          @update:modelValue="setFieldValue(field.id === 'dates' ? 'startDate' : field.id + '_start', $event)"
          :placeholder="field.placeholder || '开始'"
        />
        <span class="text-gray-400">—</span>
        <EditableDateField
          :modelValue="getFieldValue(field.id + '_end') || getFieldValue('endDate')"
          @update:modelValue="setFieldValue(field.id === 'dates' ? 'endDate' : field.id + '_end', $event)"
          placeholder="结束"
          emptyText="至今"
          :min="getFieldValue(field.id + '_start') || getFieldValue('startDate')"
        />
      </div>

      <!-- Rich text -->
      <div v-else-if="field.type === 'richtext'" :style="{ ...fieldWrapperStyle(field), ...fieldStyle(field) }" class="w-full">
        <RichTextEditor
          :modelValue="getFieldValue(field.id)"
          @update:modelValue="setFieldValue(field.id, $event)"
          :placeholder="field.placeholder || field.label"
        />
      </div>
    </template>
  </div>
</template>
