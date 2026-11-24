// The path of the visit, for the lab's Abyme page (see src/shared/trail.ts, same storage, same format): the pages seen,
// in order, kept for the time of the tab (sessionStorage: nothing is sent). Here a page is the home page, a project
// page (?p=id) or the lab (?labo): they change the address and the title without reloading, so the title is watched.
// Shown at the bottom of Abyme, in an iframe: not a page of the visit, and its links open in the whole window.
;(() => {
  if (window !== window.top) {
    document.head.append(Object.assign(document.createElement('base'), { target: '_top' }))
    return
  }
  const KEY = 'gw-trail'
  const read = () => { try { return JSON.parse(sessionStorage.getItem(KEY) || '[]') } catch { return [] } }
  function add() {
    // (only what makes a page: ?p=id or ?labo; not ?hour=… nor tracking parameters)
    const q = new URLSearchParams(location.search), id = q.get('p')
    const step = { path: id ? `/?p=${id}` : q.has('labo') ? '/?labo' : '/', title: document.title }
    const steps = read(), last = steps.at(-1)
    if (last?.path === step.path) steps.pop()   // the same page, again: once
    steps.push(step)
    try { sessionStorage.setItem(KEY, JSON.stringify(steps.slice(-40))) } catch {}
  }
  add()
  new MutationObserver(() => setTimeout(add)).observe(document.querySelector('title'), { childList: true, characterData: true, subtree: true })
})()
