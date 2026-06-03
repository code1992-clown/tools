<script setup lang="ts">
import { useRouter } from 'vue-router'
import { onMounted, onBeforeUnmount, ref } from 'vue'
import gsap from 'gsap'
import ThemeSwitcher from '../components/ThemeSwitcher.vue'
import bgSvg from '../assets/bg.svg'

const router = useRouter()
const headerRef = ref<HTMLElement | null>(null)
const cardsRef = ref<HTMLElement | null>(null)
const bgRef = ref<HTMLElement | null>(null)
const subtitleRef = ref<HTMLElement | null>(null)
const subtitleText = '高效的在线生产力工具'
const displayedText = ref('')

function typeText() {
  let i = 0
  const timer = setInterval(() => {
    if (i < subtitleText.length) {
      displayedText.value += subtitleText[i]
      i++
    } else {
      clearInterval(timer)
      if (subtitleRef.value) subtitleRef.value.classList.add('typing-done')
    }
  }, 80)
}

const tools = [
  {
    id: 'resume',
    name: '简历工具',
    description: '在线编辑简历，支持多种模板和导出格式',
    route: 'dashboard',
  },
]

function goToTool(route: string) {
  router.push({ name: route })
}

const multiple = 15
let cardElements: HTMLElement[] = []

function handleMouseMove(e: MouseEvent, card: HTMLElement) {
  const box = card.getBoundingClientRect()
  const calcX = -(e.clientY - box.y - box.height / 2) / multiple
  const calcY = (e.clientX - box.x - box.width / 2) / multiple
  const percentage = ((e.clientX - box.x) / box.width) * 100

  card.style.transform = `perspective(800px) rotateX(${calcX}deg) rotateY(${calcY}deg) scale3d(1.02, 1.02, 1.02)`
  card.style.setProperty('--per', `${percentage}%`)
}

function handleMouseLeave(card: HTMLElement) {
  card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) scale3d(1, 1, 1)'
}

function setupCard(card: HTMLElement) {
  const onMove = (e: MouseEvent) => handleMouseMove(e, card)
  const onLeave = () => handleMouseLeave(card)
  card.addEventListener('mousemove', onMove)
  card.addEventListener('mouseleave', onLeave)
  ;(card as any)._listeners = { onMove, onLeave }
}

function cleanupCards() {
  cardElements.forEach(card => {
    const { onMove, onLeave } = (card as any)._listeners || {}
    if (onMove) card.removeEventListener('mousemove', onMove)
    if (onLeave) card.removeEventListener('mouseleave', onLeave)
  })
}

onMounted(() => {
  typeText()

  if (headerRef.value) {
    gsap.fromTo(headerRef.value,
      { y: -20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }
    )
  }

  if (cardsRef.value) {
    gsap.fromTo(cardsRef.value.children,
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out', delay: 0.2 }
    )

    cardElements = Array.from(cardsRef.value.querySelectorAll('.tool-card'))
    cardElements.forEach(setupCard)
  }

  if (bgRef.value) {
    gsap.to(bgRef.value, {
      x: 30,
      y: -20,
      scale: 1.05,
      duration: 12,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    })
  }
})

onBeforeUnmount(cleanupCards)
</script>

<template>
  <div class="min-h-screen bg-base-200 relative overflow-hidden">
    <img ref="bgRef" :src="bgSvg" class="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-30" alt="" />
    <header ref="headerRef" class="sticky top-0 z-50 bg-base-100 border-b border-base-300">
      <div class="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-base-content tracking-tight">工具集</h1>
          <p ref="subtitleRef" class="typing-text text-xs text-base-content/40 mt-0.5">{{ displayedText }}</p>
        </div>
        <ThemeSwitcher />
      </div>
    </header>

    <main class="max-w-5xl mx-auto px-6 py-10 relative">
      <div ref="cardsRef" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" style="perspective: 800px;">
        <div
          v-for="tool in tools"
          :key="tool.id"
          class="tool-card"
          @click="goToTool(tool.route)"
        >
          <div class="tool-card-inner card bg-base-100 border border-base-300/60 cursor-pointer group overflow-hidden relative">
            <div class="tool-card-gloss"></div>
            <div class="card-body p-6 relative z-10">
              <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/15 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
                </svg>
              </div>
              <h2 class="card-title text-base">{{ tool.name }}</h2>
              <p class="text-sm text-base-content/50">{{ tool.description }}</p>
              <div class="card-actions justify-end mt-3">
                <button class="btn btn-primary btn-sm gap-1">
                  进入
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.tool-card {
  --per: 50%;
  transition: transform 0.2s ease;
  transform-style: preserve-3d;
}

.tool-card-inner {
  transition: box-shadow 0.3s ease, border-color 0.3s ease;
}

.tool-card:hover .tool-card-inner {
  border-color: color-mix(in srgb, var(--color-primary) 40%, transparent);
  box-shadow:
    0 20px 40px color-mix(in srgb, var(--color-primary) 10%, transparent),
    0 8px 16px color-mix(in srgb, var(--color-primary) 5%, transparent);
}

.tool-card-gloss {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 0.3s ease;
  background: linear-gradient(
    115deg,
    transparent 0%,
    rgba(255, 255, 255, 0.4) var(--per),
    rgba(0, 0, 0, 0.2) calc(var(--per) + 25%),
    rgba(255, 255, 255, 0.3) calc(var(--per) + 50%),
    transparent 100%
  );
  mix-blend-mode: overlay;
  border-radius: inherit;
  pointer-events: none;
  z-index: 5;
}

.tool-card:hover .tool-card-gloss {
  opacity: 1;
}

.typing-text {
  border-right: 1.5px solid currentColor;
  padding-right: 2px;
  animation: cursorBlink 0.8s step-end infinite;
}

.typing-text.typing-done {
  animation: cursorFade 0.8s step-end 3;
  animation-fill-mode: forwards;
}

@keyframes cursorBlink {
  0%, 50% { border-color: currentColor; }
  51%, 100% { border-color: transparent; }
}

@keyframes cursorFade {
  0%, 50% { border-color: currentColor; }
  51%, 100% { border-color: transparent; }
}
</style>
