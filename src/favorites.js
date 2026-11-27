const key = 'carsmotion:favorites'

function loadFavorites() {
  try {
    const items = JSON.parse(localStorage.getItem(key) || '[]')
    return new Set(Array.isArray(items) ? items.filter(id => typeof id === 'string') : [])
  } catch {
    return new Set()
  }
}

let saved = loadFavorites()

export const isFavorite = id => saved.has(id)

export function toggleFavorite(id) {
  if (saved.has(id)) saved.delete(id)
  else saved.add(id)
  try {
    localStorage.setItem(key, JSON.stringify([...saved]))
  } catch { /* Keep this session usable when browser storage is unavailable. */ }
  window.dispatchEvent(new Event('carsmotion:favorites'))
  return saved.has(id)
}

window.addEventListener('storage', event => {
  if (event.key === key || event.key === null) {
    saved = loadFavorites()
    window.dispatchEvent(new Event('carsmotion:favorites'))
  }
})
