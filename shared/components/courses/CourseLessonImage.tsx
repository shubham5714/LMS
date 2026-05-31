"use client"

import { Lightboxcomponent } from "@/shared/@spk-reusable-components/reusable-plugins/spk-lightbox"
import React, { Fragment, useMemo, useState } from "react"
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen"
import Zoom from "yet-another-react-lightbox/plugins/zoom"

export type CourseLessonImageSlide = {
  src: string
}

type Props = {
  src: string
  alt: string
  className?: string
  /** All images on the page — enables prev/next in the lightbox */
  slides?: readonly CourseLessonImageSlide[]
}

export function CourseLessonImage({ src, alt, className = "", slides }: Props) {
  const [open, setOpen] = useState(false)

  const gallerySlides = useMemo(() => {
    const list = slides?.length ? [...slides] : [{ src }]
    const seen = new Set<string>()
    return list.filter((slide) => {
      if (!slide.src || seen.has(slide.src)) return false
      seen.add(slide.src)
      return true
    })
  }, [slides, src])

  const index = useMemo(
    () => Math.max(0, gallerySlides.findIndex((slide) => slide.src === src)),
    [gallerySlides, src]
  )

  return (
    <Fragment>
      <button
        type="button"
        className="course-lesson-image-trigger"
        onClick={() => setOpen(true)}
        aria-label={`View full size: ${alt}`}
      >
        <img src={src} alt={alt} className={className} decoding="async" />
      </button>
      <Lightboxcomponent
        open={open}
        close={() => setOpen(false)}
        slides={gallerySlides}
        index={index}
        plugins={[Fullscreen, Zoom]}
        Carousel={gallerySlides.length > 1}
        toolbar={gallerySlides.length > 1}
        zoom={{ maxZoomPixelRatio: 10, scrollToZoom: true }}
      />
    </Fragment>
  )
}
