const COVER_PALETTES: Array<[string, string, string]> = [
  ['#0f172a', '#1e293b', '#334155'],
  ['#1f2937', '#334155', '#475569'],
  ['#1e3a5f', '#2a4b73', '#3a638a'],
  ['#3b2f4a', '#57406b', '#705287'],
  ['#3d2f2f', '#5b4343', '#7a5a5a'],
  ['#1f3d3a', '#2a5954', '#37756d'],
]

const HIGHLIGHT_POINTS = ['16% 18%', '22% 22%', '28% 20%', '20% 28%', '30% 24%']
const SHADOW_POINTS = ['78% 72%', '72% 68%', '82% 66%', '76% 78%', '68% 74%']
const ANGLES = [120, 130, 140, 150, 160]

const hashString = (input: string): number => {
  let hash = 0
  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) - hash) + input.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

export const getGeneratedCoverBackground = (seed: string): string => {
  const hash = hashString(seed || 'blog-fallback')
  const palette = COVER_PALETTES[hash % COVER_PALETTES.length]
  const angle = ANGLES[hash % ANGLES.length]
  const highlight = HIGHLIGHT_POINTS[hash % HIGHLIGHT_POINTS.length]
  const shadow = SHADOW_POINTS[hash % SHADOW_POINTS.length]

  return [
    `radial-gradient(circle at ${highlight}, rgba(255,255,255,0.24), rgba(255,255,255,0) 48%)`,
    `radial-gradient(circle at ${shadow}, rgba(15,23,42,0.26), rgba(15,23,42,0) 52%)`,
    `linear-gradient(${angle}deg, ${palette[0]} 0%, ${palette[1]} 55%, ${palette[2]} 100%)`,
  ].join(',')
}
