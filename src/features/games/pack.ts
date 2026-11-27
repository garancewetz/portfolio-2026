// The order of the mosaic: by year, but a big game may move a few places up or down so that the grid ends square
// (no empty cell at its end, nor inside). The grid fills its cells the way CSS does it (grid-auto-flow: dense): each
// game in the first place where it fits, row after row. Tried here on a map of the cells, as many orders as needed.

type Item = { big: boolean }

// the cells a sequence of games leaves empty, in `cols` columns (and a half more if a big game is in the last row
// beside them: the small ones can stretch over the empty cells of the last row, not a big one; main.ts)
function emptyCells(items: Item[], cols: number) {
  let bigBottom = -1
  const taken: boolean[][] = []
  const free = (r: number, c: number) => !taken[r]?.[c]
  const take = (r: number, c: number) => { (taken[r] ??= [])[c] = true }
  let cells = 0
  for (const item of items) {
    const span = item.big ? Math.min(2, cols) : 1
    cells += span * span
    for (let r = 0, placed = false; !placed; r++) {
      for (let c = 0; c + span <= cols && !placed; c++) {
        let fits = true
        for (let dr = 0; dr < span && fits; dr++) for (let dc = 0; dc < span && fits; dc++) fits = free(r + dr, c + dc)
        if (!fits) continue
        for (let dr = 0; dr < span; dr++) for (let dc = 0; dc < span; dc++) take(r + dr, c + dc)
        if (item.big) bigBottom = Math.max(bigBottom, r + span - 1)
        placed = true
      }
    }
  }
  const empty = taken.length * cols - cells
  return empty + (empty && bigBottom === taken.length - 1 ? 0.5 : 0)
}

// the order (indices into `items`) leaving the fewest empty cells, each big game moving at most `reach` places from
// its year, and none before `first`; then the one that moves them least
export function bestOrder(items: Item[], cols: number, reach = 3, first = 0) {
  let order = items.map((_, i) => i)
  const cost = (o: number[]) => emptyCells(o.map((i) => items[i]), cols)
  const moved = (o: number[]) => o.reduce((sum, item, at) => sum + Math.abs(item - at), 0)
  let best = cost(order)
  // each big game in turn, tried a few places up and down; twice over (one move may open another)
  for (let pass = 0; pass < 2 && best > 0; pass++) {
    for (const big of items.map((it, i) => (it.big ? i : -1)).filter((i) => i >= 0)) {
      const from = order.indexOf(big)
      for (let shift = -reach; shift <= reach; shift++) {
        const to = from + shift
        if (!shift || to < first || to >= order.length) continue
        const tried = order.filter((i) => i !== big)
        tried.splice(to, 0, big)
        const c = cost(tried)
        if (c < best || (c === best && moved(tried) < moved(order))) { best = c; order = tried }
      }
    }
  }
  return { order, empty: Math.floor(best) }
}
