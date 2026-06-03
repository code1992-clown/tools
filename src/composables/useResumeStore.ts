import { ref, shallowRef } from 'vue'
import { db, generateId } from '../db'
import type { ResumeRecord } from '../db'
import type { ResumeData, TemplateId } from '../types/resume'
import { DEFAULT_SECTION_NAMES } from '../types/resume'

const DEFAULT_SECTION_ORDER: string[] = ['experiences', 'projects', 'education', 'skills']

function createDefaultData(): ResumeData {
  return {
    personal: {
      name: '陈志远',
      title: '高级前端工程师',
      email: 'zhiyuan.chen@email.com',
      phone: '138-0000-1234',
      location: '上海',
      summary: '7 年前端开发经验，专注于 Vue/React 技术栈和前端工程化。在字节跳动、蚂蚁集团等一线互联网公司积累了丰富的大型项目实战经验，擅长性能优化、架构设计和团队协作。主导过多个核心业务系统的技术升级和工程化改造，具备从 0 到 1 搭建完整技术体系的能力。热衷开源社区贡献，个人项目累计获得 2800+ GitHub Stars。',
    },
    contactFields: [
      { id: 'email', type: 'email', label: '邮箱', value: 'zhiyuan.chen@email.com', visible: true },
      { id: 'phone', type: 'phone', label: '电话', value: '138-0000-1234', visible: true },
      { id: 'location', type: 'location', label: '城市', value: '上海', visible: true },
      { id: 'github', type: 'link', label: 'GitHub', value: 'github.com/zhiyuanchen', visible: true },
    ],
    experiences: [
      {
        id: 'exp1',
        company: '字节跳动',
        position: '高级前端工程师',
        startDate: '2022-03-01',
        endDate: '',
        description: '<ul><li>负责抖音电商中台核心模块开发，使用 Vue 3 + TypeScript 构建高性能管理系统</li><li>主导前端工程化改造，引入 Monorepo 架构，搭建组件库和脚手架，提升团队研发效率 40%</li><li>优化首屏加载性能，通过代码拆分、懒加载和 SSR 方案将 LCP 从 3.2s 降至 1.1s</li><li>设计并实现低代码可视化搭建平台，支撑运营团队自助生成活动页面</li></ul>',
      },
      {
        id: 'exp2',
        company: '蚂蚁集团',
        position: '前端工程师',
        startDate: '2019-07-01',
        endDate: '2022-02-28',
        description: '<ul><li>参与支付宝小程序框架底层建设，优化渲染引擎使页面渲染速度提升 60%</li><li>开发基于 React 的 B 端中后台系统，独立完成权限管理、数据看板等核心模块</li><li>推动团队从 JavaScript 迁移至 TypeScript，编写迁移指南和 ESLint 规则集</li></ul>',
      },
      {
        id: 'exp3',
        company: '网易',
        position: '初级前端工程师',
        startDate: '2017-06-01',
        endDate: '2019-06-30',
        description: '<ul><li>负责网易云音乐 Web 端播放器模块开发和维护</li><li>使用 Canvas/WebGL 实现音频可视化效果，日活跃用户 200w+</li><li>参与前端监控 SDK 开发，覆盖错误捕获、性能指标采集和用户行为追踪</li></ul>',
      },
    ],
    education: [
      {
        id: 'edu1',
        school: '浙江大学',
        degree: '硕士',
        major: '计算机科学与技术',
        startDate: '2015-09-01',
        endDate: '2017-06-01',
      },
      {
        id: 'edu2',
        school: '华中科技大学',
        degree: '学士',
        major: '软件工程',
        startDate: '2011-09-01',
        endDate: '2015-06-01',
      },
    ],
    skills: [],
    skillsText: '<ul><li>精通 Vue 3 / React、TypeScript，熟悉框架原理与性能调优</li><li>精通 Webpack / Vite 构建工具链，熟练搭建前端工程化体系与 CI/CD 流程</li><li>熟练掌握 Node.js / Koa 服务端开发，具备全栈项目经验</li><li>熟悉 TailwindCSS / CSS3 响应式布局，注重用户体验与设计还原</li><li>擅长性能优化（首屏加载、渲染性能），熟悉微前端 / Monorepo 架构</li></ul>',
    projects: [
      {
        id: 'proj1',
        name: '低代码可视化搭建平台',
        role: '技术负责人',
        startDate: '2023-01-01',
        endDate: '2023-08-01',
        description: '<ul><li>从零设计并实现一套支持拖拽式页面搭建的低代码平台，覆盖 50+ 业务组件</li><li>基于 JSON Schema 设计组件描述协议，实现属性面板自动生成和实时预览</li><li>集成发布流水线，支持一键生成 H5/小程序/PC 三端页面，累计搭建页面 3000+</li></ul>',
      },
      {
        id: 'proj2',
        name: '前端监控与数据分析平台',
        role: '核心开发',
        startDate: '2021-05-01',
        endDate: '2022-01-01',
        description: '<ul><li>开发轻量级前端监控 SDK（<10KB gzip），支持错误监控、性能采集、用户行为录制</li><li>使用 ClickHouse + Grafana 搭建数据看板，实现秒级数据查询和告警</li><li>平台接入内部 200+ 应用，日均处理 5000w+ 数据上报</li></ul>',
      },
      {
        id: 'proj3',
        name: '开源组件库 ZhiUI',
        role: '发起人 & 维护者',
        startDate: '2020-03-01',
        endDate: '',
        description: '<ul><li>基于 Vue 3 + TypeScript 开发的企业级 UI 组件库，GitHub 2.8k stars</li><li>完善的文档站（VitePress）、单测覆盖率 92%、支持 Tree-shaking 按需加载</li><li>发布 npm 包，周下载量 5000+，被多个团队在生产环境使用</li></ul>',
      },
    ],
    sectionOrder: [...DEFAULT_SECTION_ORDER],
    customSections: {},
    sectionNames: { ...DEFAULT_SECTION_NAMES },
  }
}

const allResumes = ref<ResumeRecord[]>([])
const loading = ref(false)

async function loadAllResumes() {
  loading.value = true
  try {
    allResumes.value = await db.resumes.orderBy('updatedAt').reverse().toArray()
  } finally {
    loading.value = false
  }
}

async function createResume(title?: string, templateId: TemplateId = 'classic'): Promise<string> {
  const id = generateId()
  const now = Date.now()
  const record: ResumeRecord = {
    id,
    title: title || '前端工程师简历',
    templateId,
    data: createDefaultData(),
    createdAt: now,
    updatedAt: now,
  }
  await db.resumes.add(record)
  allResumes.value.unshift(record)
  return id
}

async function duplicateResume(sourceId: string): Promise<string | null> {
  const source = await db.resumes.get(sourceId)
  if (!source) return null
  const id = generateId()
  const now = Date.now()
  const record: ResumeRecord = {
    id,
    title: source.title + ' (副本)',
    templateId: source.templateId,
    data: JSON.parse(JSON.stringify(source.data)),
    createdAt: now,
    updatedAt: now,
  }
  await db.resumes.add(record)
  allResumes.value.unshift(record)
  return id
}

async function deleteResume(id: string) {
  await db.resumes.delete(id)
  const idx = allResumes.value.findIndex(r => r.id === id)
  if (idx !== -1) allResumes.value.splice(idx, 1)
}

async function updateResume(id: string, updates: Partial<ResumeRecord>) {
  updates.updatedAt = Date.now()
  await db.resumes.update(id, updates)
  const idx = allResumes.value.findIndex(r => r.id === id)
  if (idx !== -1) {
    Object.assign(allResumes.value[idx], updates)
  }
}

async function getResume(id: string): Promise<ResumeRecord | undefined> {
  return db.resumes.get(id)
}

export function useResumeStore() {
  return {
    allResumes,
    loading,
    loadAllResumes,
    createResume,
    duplicateResume,
    deleteResume,
    updateResume,
    getResume,
  }
}
