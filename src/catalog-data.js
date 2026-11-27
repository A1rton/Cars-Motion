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

export const vehicles = [
  [
    "porsche-911",
    "porsche",
    "911",
    "Coupé",
    "Plateado"
  ],
  [
    "audi-rs3",
    "audi",
    "RS 3",
    "Berlina",
    "Gris grafito"
  ],
  [
    "mercedes-a200",
    "mercedes-benz",
    "A 200",
    "Compacto",
    "Blanco"
  ],
  [
    "bmw-x2",
    "bmw",
    "X2",
    "SUV",
    "Azul"
  ],
  [
    "lexus-ls300h",
    "lexus",
    "LS 300h",
    "Berlina",
    "Gris"
  ],
  [
    "ford-mustang",
    "ford",
    "Mustang",
    "Coupé",
    "Azul"
  ],
  [
    "alfa-stelvio",
    "alfa-romeo",
    "Stelvio",
    "SUV",
    "Rojo"
  ],
  [
    "bmw-serie-1",
    "bmw",
    "Serie 1",
    "Compacto",
    "Azul oscuro"
  ],
  [
    "ds-4",
    "ds",
    "DS 4",
    "Compacto",
    "Gris"
  ],
  [
    "jeep-compass",
    "jeep",
    "Compass",
    "SUV",
    "Blanco"
  ]
].map(([id, brand, name, category, color]) => ({
  id, brand, name, category,
  description: '',
  facts: [{ label: 'Carrocería', value: category }, { label: 'Color de la imagen', value: color }],
  images: [{ src: imageUrl('catalog/studio/' + id + '-1600.webp'), small: imageUrl('catalog/studio/' + id + '-800.webp'),
    width: 1600, height: 800, alt: brands.find(item => item.id === brand).name + ' ' + name + ', vista de tres cuartos.' }],
}))
