import { around } from './salvos'

// the stars: dots (one drop shadow each), more of them at the top of the sky; two groups, each twinkling at
// its own rhythm
export function starField(n: number): [string, string] {
  const one = () => {
    const x = (Math.random() * 100).toFixed(2)
    const y = (Math.random() ** 1.6 * 100).toFixed(2)
    const a = around(0.25, 0.9).toFixed(2)
    return `${x}vw ${y}vh 0 ${Math.random() < 0.12 ? 1 : 0}px rgb(238 234 226 / ${a})`
  }
  const list = Array.from({ length: n }, one)
  return [list.filter((_, i) => i % 2).join(','), list.filter((_, i) => !(i % 2)).join(',')]
}
