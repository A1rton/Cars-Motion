// Only published attributes participate. Undefined, false and zero have distinct meanings.
export const fields = {
  condition: 'Condición', brand: 'Marca', name: 'Modelo', category: 'Carrocería', version: 'Versión',
  currency: 'Moneda', priceMin: 'Precio mínimo', priceMax: 'Precio máximo', year: 'Año',
  availability: 'Disponibilidad', location: 'Sucursal o ubicación', financing: 'Financiación',
  immediate: 'Entrega inmediata', fuel: 'Combustible', transmission: 'Transmisión', engine: 'Motor',
  drive: 'Tracción', power: 'Potencia (CV)', color: 'Color', doors: 'Puertas', seats: 'Plazas',
  mileageMin: 'Kilometraje mínimo', mileageMax: 'Kilometraje máximo', maintenance: 'Mantenimiento',
  serviceRecords: 'Services registrados', singleOwner: 'Único dueño', warranty: 'Garantía', unitState: 'Estado general',
}
export const usedFields = ['mileageMin', 'mileageMax', 'maintenance', 'serviceRecords', 'singleOwner', 'warranty', 'unitState']
export const ranges = {
  priceMin: 'price', priceMax: 'price', mileageMin: 'mileage', mileageMax: 'mileage',
}
export const conditionNames = { new: 'Nuevo (0 km)', used: 'Usado' }
export const collator = new Intl.Collator('es-AR', { numeric: true, sensitivity: 'base' })
export const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
export const known = value => value != null && value !== '' && (typeof value !== 'number' || Number.isFinite(value))
export const validPrice = item => ['ARS', 'USD'].includes(item.currency) && Number.isFinite(item.price) && item.price >= 0

export function labelFor(key, value, names) {
  if (key === 'brand') return names.get(value) || value
  if (key === 'condition') return conditionNames[value]
  if (value === 'true') return 'Sí'
  if (value === 'false') return 'No'
  if (key.startsWith('mileage')) return Number(value).toLocaleString('es-AR') + ' km'
  return String(value)
}

export function matchesFilters(item, filters) {
  return Object.entries(filters).every(([key, value]) => {
    if (key === 'currency') return validPrice(item) && item.currency === value
    const numericKey = ranges[key]
    if (numericKey) {
      if (numericKey === 'price' && (!validPrice(item) || item.currency !== filters.currency)) return false
      const amount = item[numericKey]
      return Number.isFinite(amount) && (key.endsWith('Min') ? amount >= Number(value) : amount <= Number(value))
    }
    return known(item[key]) && String(item[key]) === value
  })
}
