import Dexie, { type EntityTable } from 'dexie'
import type { ResumeData, TemplateId } from '../types/resume'

export interface ResumeRecord {
  id: string
  title: string
  templateId: TemplateId
  data: ResumeData
  createdAt: number
  updatedAt: number
}

const db = new Dexie('ResumeApp') as Dexie & {
  resumes: EntityTable<ResumeRecord, 'id'>
}

db.version(1).stores({
  resumes: 'id, updatedAt, createdAt',
})

export { db }

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}
