import { useEffect, useState } from 'react'

export function useElementRect(ref, { observe = true } = {}) {
  const [rect, setRect] = useState(null)

  useEffect(() => {
    const element = ref?.current
    if (!element) return undefined

    const update = () => setRect(element.getBoundingClientRect())
    update()

    if (!observe || typeof ResizeObserver === 'undefined') {
      if (typeof window === 'undefined') return undefined
      window.addEventListener('resize', update)
      return () => window.removeEventListener('resize', update)
    }

    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref, observe])

  return rect
}
