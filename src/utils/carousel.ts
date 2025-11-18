export const wrapIndex = (index: number, length: number) => {
  if (length === 0) return 0
  return ((index % length) + length) % length
}

export const getCarouselSlice = <T,>(items: readonly T[], centerIndex: number, visible = 3) => {
  if (items.length === 0) return []
  const half = Math.floor(visible / 2)
  const result: T[] = []
  for (let i = -half; i <= half; i += 1) {
    const idx = wrapIndex(centerIndex + i, items.length)
    result.push(items[idx])
  }
  return result
}

