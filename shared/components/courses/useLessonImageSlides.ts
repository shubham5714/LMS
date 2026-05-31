import { useMemo } from "react"

type SectionWithImage = {
  imageSrc?: string
  premiumPreviewSrc?: string
}

export function useLessonImageSlides(
  sections: readonly SectionWithImage[]
): { src: string }[] {
  return useMemo(() => {
    const urls: string[] = []
    for (const section of sections) {
      if (section.imageSrc) urls.push(section.imageSrc)
      if (section.premiumPreviewSrc) urls.push(section.premiumPreviewSrc)
    }
    return urls.map((src) => ({ src }))
  }, [sections])
}
