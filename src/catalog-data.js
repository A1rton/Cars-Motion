// Paths remain relative in both the HTTP preview and the portable offline copy.
export const imageUrl = path => `${import.meta.env.BASE_URL}media/${path}`

export const brands = [
  ['porsche', 'Porsche', 'porsche.svg'],
  ['lexus', 'Lexus', 'lexus.svg'],
  ['mercedes-benz', 'Mercedes-Benz', 'mercedes-benz.svg'],
  ['alfa-romeo', 'Alfa Romeo', 'alfa-romeo.png'],
  ['bmw', 'BMW', 'bmw.svg'],
  ['volvo', 'Volvo', 'volvo.png'],
  ['ds', 'DS Automobiles', 'ds.png'],
  ['audi', 'Audi', 'audi.svg'],
  ['jeep', 'Jeep', 'jeep.png'],
  ['ford', 'Ford', 'ford.svg'],
  ['volkswagen', 'Volkswagen', 'volkswagen.svg'],
].map(([id, name, logo]) => ({ id, name, logo: logo && imageUrl('brands/' + logo) }))

// These entries describe photographed models. A sale listing can additionally
// provide condition ('new' or 'used'), version, unit data and price + currency.
// For a used listing, images must belong to that particular unit. Optional
// configuratorUrl and actions.{consult,reserve,finance,visit} identify real,
// public destinations for this listing; omit any unpublished service.
export const vehicles = [
  ["porsche-911", "porsche", "911", "Coupé", "Plateado", "Carrera", null, 2],
  ["audi-rs3", "audi", "RS 3", "Berlina", "Gris grafito", "Sedán", "Automática S tronic", 4],
  ["mercedes-a200", "mercedes-benz", "A 200", "Compacto", "Blanco", "Hatchback", null, 5],
  ["bmw-x2", "bmw", "X2", "SUV", "Azul", "M Sport", null, 5],
  ["lexus-ls300h", "lexus", "LS 300h", "Berlina", "Gris", "Luxury", "Automática", 4],
  ["ford-mustang", "ford", "Mustang", "Coupé", "Azul", "GT 5.0", null, 2],
  ["alfa-stelvio", "alfa-romeo", "Stelvio", "SUV", "Rojo", "Veloce", "Automática", 5],
  ["bmw-serie-1", "bmw", "Serie 1", "Compacto", "Azul oscuro", "M Sport", null, 5],
  ["ds-4", "ds", "DS 4", "Compacto", "Gris", "Performance Line", null, 5],
  ["jeep-compass", "jeep", "Compass", "SUV", "Blanco", "Limited", null, 5]
].map(([id, brand, name, category, color, version, transmission, doors]) => ({
  id, brand, name, category, color, version, transmission, doors,
  images: [{ src: imageUrl('catalog/studio/' + id + '-1600.webp'), small: imageUrl('catalog/studio/' + id + '-800.webp'),
    width: 1600, height: 800, alt: brands.find(item => item.id === brand).name + ' ' + name + ', vista de tres cuartos.' }],
}))
