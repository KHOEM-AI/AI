// The KHOEM-AI Future Vehicle line-up (poster V99): one hero car and models S1-S15.
// image: a picture in public/vehicles/ (cut from the poster). glb: an optional 3D model in public/models/.

const MODELS = [
  ['s01', 'S1', 'Sport Coupe', 'sport-coupe'],
  ['s02', 'S2', 'Super Sport', 'super-sport'],
  ['s03', 'S3', 'Hyper Car', 'hyper-car'],
  ['s04', 'S4', 'Electric SUV', 'electric-suv'],
  ['s05', 'S5', 'Luxury Sedan', 'luxury-sedan'],
  ['s06', 'S6', 'Family MPV', 'family-mpv'],
  ['s07', 'S7', 'Off-Road SUV', 'off-road-suv'],
  ['s08', 'S8', 'Pickup Truck', 'pickup-truck'],
  ['s09', 'S9', 'Crossover', 'crossover'],
  ['s10', 'S10', 'City Car', 'city-car'],
  ['s11', 'S11', 'Racing Car', 'racing-car'],
  ['s12', 'S12', 'Police Car', 'police-car'],
  ['s13', 'S13', 'Ambulance', 'ambulance'],
  ['s14', 'S14', 'Fire Rescue', 'fire-rescue'],
  ['s15', 'S15', 'Military Vehicle', 'military-vehicle'],
];

export const VEHICLES = [
  { id: 'v99', name: 'KHOEM-AI V99', kind: 'Hero', image: '/vehicles/hero_khoem-ai-v99.png', glb: '/models/v99.glb' },
  ...MODELS.map(([id, short, kind, slug]) => ({
    id, name: `KHOEM-AI ${short}`, kind, image: `/vehicles/${id}_${slug}.png`, glb: `/models/${id}.glb`,
  })),
];

export const vehicleById = (id) => VEHICLES.find((v) => v.id === id) || null;
