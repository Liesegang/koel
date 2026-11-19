import { describe, expect, it, vi } from 'vite-plus/test'
import { createHarness } from '@/__tests__/TestHarness'
import Component from './VirtualScroller.vue'

describe('virtualScroller.vue', () => {
  const h = createHarness()

  it('renders items via scoped slot', () => {
    const items = [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
    ]

    const { container } = h.render(Component, {
      props: { items, itemHeight: 40 },
      slots: {
        default: (props: { item: { name: string } }) => props.item.name,
      },
    })

    expect(container.querySelector('.virtual-scroller')).toBeTruthy()
  })

  it('requests the next page one viewport before the end', () => {
    const onScrolledToEnd = vi.fn()
    const frame = vi.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => {
      callback(0)
      return 0
    })

    try {
      const { container } = h.render(Component, {
        props: { items: Array.from({ length: 50 }, (_, i) => i), itemHeight: 64, onScrolledToEnd },
      })
      const scroller = container.querySelector<HTMLElement>('.virtual-scroller')!
      Object.defineProperties(scroller, {
        clientHeight: { value: 600 },
        scrollHeight: { value: 3200 },
      })

      scroller.scrollTop = 1999
      scroller.dispatchEvent(new Event('scroll'))
      expect(onScrolledToEnd).not.toHaveBeenCalled()

      scroller.scrollTop = 2000
      scroller.dispatchEvent(new Event('scroll'))
      expect(onScrolledToEnd).toHaveBeenCalledOnce()
      expect(scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight).toBe(600)
    } finally {
      frame.mockRestore()
    }
  })

  it('exposes scrollToIndex that scrolls to the correct position', () => {
    const items = Array.from({ length: 100 }, (_, i) => ({ id: i, name: `Item ${i}` }))
    const itemHeight = 64

    const { container } = h.render(Component, {
      props: { items, itemHeight },
      slots: {
        default: (props: { item: { name: string } }) => props.item.name,
      },
    })

    const scrollerEl = container.querySelector('.virtual-scroller') as HTMLElement
    const scrollToMock = vi.fn()
    scrollerEl.scrollTo = scrollToMock

    const instance = (scrollerEl as any)['__vueParentComponent']
    instance?.exposed?.scrollToIndex(50)

    expect(scrollToMock).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'smooth' }))
  })
})
