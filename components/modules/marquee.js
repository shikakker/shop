import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useInView } from 'react-cool-inview'

import Photo from '@components/photo'
import ProductCard from '@components/product-card'

const MarqueeTrack = ({ children, speed, reverse, pausable }) => {
  const itemRef = useRef(null)
  const [duration, setDuration] = useState(20)

  useEffect(() => {
    const item = itemRef.current
    if (!item) return undefined

    const updateDuration = () => {
      const width = item.getBoundingClientRect().width
      const pixelsPerSecond = Number(speed) > 0 ? Number(speed) : 40
      setDuration(Math.max(5, width / pixelsPerSecond))
    }

    updateDuration()

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateDuration)
      return () => window.removeEventListener('resize', updateDuration)
    }

    const observer = new ResizeObserver(updateDuration)
    observer.observe(item)
    return () => observer.disconnect()
  }, [speed])

  const contentStyle = useMemo(
    () => ({ animationDuration: `${duration}s` }),
    [duration]
  )

  return (
    <div
      data-marqy
      data-direction={reverse ? 'right' : 'left'}
      data-pause-on-hover={pausable ? '' : undefined}
      className="marquee"
    >
      <div data-marqy-inner>
        <div data-marqy-content style={contentStyle}>
          <div ref={itemRef} data-marqy-item>
            {children}
          </div>
        </div>
        <div
          data-marqy-content
          style={contentStyle}
          aria-hidden="true"
          inert=""
        >
          <div data-marqy-item>{children}</div>
        </div>
      </div>
    </div>
  )
}

const Marquee = ({ data = {} }) => {
  const { items, speed, reverse, pausable } = data
  const { observe, inView } = useInView({
    unobserveOnEnter: true,
    threshold: 0.1,
  })

  if (!items?.length) return null

  const content = items.map((item, key) => {
    switch (item._type) {
      case 'simple':
        return (
          <span key={key} className="marquee--text">
            {item.text}
          </span>
        )
      case 'photo':
        return (
          <div
            key={key}
            className="marquee--photo"
            style={{ flex: item.photo.aspectRatio }}
          >
            <Photo
              photo={item.photo}
              hasPlaceholder={false}
              forceLoad={inView}
            />
          </div>
        )
      case 'product':
        return (
          <div key={key} className="marquee--product">
            <ProductCard
              product={item.product}
              hasVisuals
              showThumbs
              showPrice
              showQuickAdd
            />
          </div>
        )
      default:
        return null
    }
  })

  return (
    <div ref={observe} className="marquee-section">
      <MarqueeTrack speed={speed} reverse={reverse} pausable={pausable}>
        <div className="marquee--item">{content}</div>
      </MarqueeTrack>
    </div>
  )
}

export default Marquee
