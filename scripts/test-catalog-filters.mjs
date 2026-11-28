import assert from 'node:assert/strict'
import { fields, matchesFilters, validPrice } from '../src/catalog-filters.js'

// Test-only units exercise unpublished commercial fields without entering the catalogue.
const used = {
  condition: 'used', brand: 'test', name: 'A', category: 'Compacto', version: 'Base',
  price: 18000, currency: 'USD', year: 2022, availability: 'Disponible',
  location: 'Córdoba', financing: false, immediate: true, fuel: 'Nafta',
  transmission: 'Manual', engine: '2.0', tractionControl: true, steering: 'Eléctrica', power: 150,
  color: 'Azul', doors: 5, seats: 5, mileage: 32000, maintenance: 'Documentado',
  serviceRecords: true, singleOwner: false, warranty: false, unitState: 'Inspeccionado',
}
const newer = { ...used, condition: 'new', currency: 'ARS', price: 32000000, mileage: 0 }
const reference = { brand: 'test', name: 'A', category: 'Compacto' }
const selected = { ...used, yearMin: '2022', yearMax: '2022', priceMin: '18000', priceMax: '18000', mileageMin: '32000', mileageMax: '32000' }
const allFilters = {}
for (const key of Object.keys(fields)) {
  // Every selectable field must match a known value and reject a differing value.
  const filter = { [key]: String(selected[key]) }
  assert.ok(matchesFilters(used, filter, 'USD'), key)
  const wrong = key.endsWith('Min') ? '99999999' : key.endsWith('Max') ? '0' : 'otro'
  assert.equal(matchesFilters(used, { ...filter, [key]: wrong }, 'USD'), false, key)
  assert.equal(matchesFilters({}, filter), false, key)
  allFilters[key] = String(selected[key])
}
assert.ok(matchesFilters(used, allFilters, 'USD'))
assert.ok(matchesFilters(reference, {}))
assert.equal(matchesFilters(reference, { condition: 'new' }), false)
assert.ok(matchesFilters(newer, { condition: 'new', mileageMax: '0' }))
assert.equal(matchesFilters(reference, { mileageMax: '0' }), false)
assert.ok(matchesFilters(used, { tractionControl: 'true', steering: 'Eléctrica' }))
assert.equal(matchesFilters(used, { priceMin: '1000' }), false)
assert.equal(matchesFilters(newer, { priceMin: '1000' }, 'USD'), false)
assert.equal(validPrice({ currency: 'USD', price: null }), false)
assert.equal(validPrice({ currency: 'GBP', price: 100 }), false)
assert.equal(validPrice({ currency: 'ARS', price: -1 }), false)
assert.ok(validPrice({ currency: 'ARS', price: 0 }))
console.log('Filtros del catálogo, límites inclusivos, moneda y datos sin publicar: OK.')
