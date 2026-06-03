export interface PersonalInfo {
  name: string
  title: string
  email: string
  phone: string
  location: string
  summary: string
  avatar?: string
}

export type ContactFieldType = 'email' | 'phone' | 'location' | 'link' | 'custom' | 'wechat' | 'website' | 'github' | 'linkedin' | 'birthday' | 'gender' | 'experience_years' | 'education_level' | 'job_status'

export interface ContactField {
  id: string
  type: ContactFieldType
  label: string
  value: string
  visible: boolean
}

export interface Experience {
  id: string
  company: string
  position: string
  startDate: string
  endDate: string
  description: string
}

export interface Education {
  id: string
  school: string
  degree: string
  major: string
  startDate: string
  endDate: string
}

export interface Skill {
  id: string
  name: string
  level: number // 1-5
}

export interface Project {
  id: string
  name: string
  role: string
  description: string
  startDate: string
  endDate: string
}

export type CustomFieldType = 'text' | 'textarea' | 'date' | 'daterange' | 'richtext'

export interface FieldStyle {
  fontSize?: string
  fontWeight?: string
  color?: string
  textAlign?: string
  width?: string
}

export interface CustomSectionFieldDef {
  id: string
  type: CustomFieldType
  label: string
  placeholder?: string
  row?: 'title' | 'subtitle' | 'body'
  style?: FieldStyle
}

export interface CustomSectionItem {
  id: string
  title: string
  subtitle: string
  startDate: string
  endDate: string
  description: string
  fields?: Record<string, string>
}

export type BuiltinSectionKey = 'experiences' | 'projects' | 'education' | 'skills'

export type SectionKey = string

export const BUILTIN_SECTIONS: BuiltinSectionKey[] = ['experiences', 'projects', 'education', 'skills']

export const DEFAULT_SECTION_NAMES: Record<BuiltinSectionKey, string> = {
  experiences: '工作经历',
  projects: '项目经历',
  education: '教育背景',
  skills: '专业技能',
}

export function isBuiltinSection(key: string): key is BuiltinSectionKey {
  return BUILTIN_SECTIONS.includes(key as BuiltinSectionKey)
}

export interface ResumeData {
  personal: PersonalInfo
  contactFields: ContactField[]
  experiences: Experience[]
  education: Education[]
  skills: Skill[]
  skillsText: string
  projects: Project[]
  sectionOrder: SectionKey[]
  customSections: Record<string, CustomSectionItem[]>
  customSectionSchemas?: Record<string, CustomSectionFieldDef[]>
  sectionNames: Record<string, string>
}

export type TemplateId = 'classic' | 'modern' | 'minimalist' | 'ats' | string

export interface TemplateInfo {
  id: TemplateId
  name: string
  description: string
  accentColor: string
}

export interface TemplateConfig {
  id: string
  name: string
  baseTemplate: 'classic' | 'modern' | 'minimalist' | 'ats'
  colors: {
    accent: string
    headerBg: string
    headerText: string
    text: string
    subtext: string
    background: string
  }
  fonts: {
    heading: string
    body: string
  }
  fontSize: {
    name: number
    sectionTitle: number
    body: number
  }
  spacing: {
    pagePadding: number
    sectionGap: number
  }
}
