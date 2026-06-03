import { nextTick } from 'vue'

/**
 * FLIP animation for programmatic list reordering (up/down button moves).
 * Records element positions before a move, then animates from old → new position.
 */
export function useMoveAnimation() {
  function animateMove(
    containerEl: HTMLElement | null | undefined,
    moveFn: () => void,
    duration = 280
  ) {
    if (!containerEl) {
      moveFn()
      return
    }

    const children = Array.from(containerEl.children) as HTMLElement[]
    const rects = new Map<HTMLElement, DOMRect>()
    children.forEach(el => rects.set(el, el.getBoundingClientRect()))

    moveFn()

    nextTick(() => {
      const updatedChildren = Array.from(containerEl.children) as HTMLElement[]
      updatedChildren.forEach(el => {
        const oldRect = rects.get(el)
        if (!oldRect) return

        const newRect = el.getBoundingClientRect()
        const dx = oldRect.left - newRect.left
        const dy = oldRect.top - newRect.top

        if (dx === 0 && dy === 0) return

        el.style.transform = `translate(${dx}px, ${dy}px)`
        el.style.transition = 'none'

        void el.offsetHeight

        el.style.transition = `transform ${duration}ms cubic-bezier(0.22, 1, 0.36, 1)`
        el.style.transform = ''

        el.classList.add('move-flash')

        const cleanup = () => {
          el.style.transition = ''
          el.style.transform = ''
          setTimeout(() => el.classList.remove('move-flash'), 300)
        }
        el.addEventListener('transitionend', cleanup, { once: true })
        setTimeout(cleanup, duration + 50)
      })
    })
  }

  return { animateMove }
}
