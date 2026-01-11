// Maps common reusable items to local assets under public/assets
// Add entries as you cache more images.

function slugify(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const ASSET_MAP = {
  food: {
    'vada-pav': '/assets/food/vada-pav.jpg',
    'pani-puri': '/assets/food/pani-puri.jpg',
    'kolhapuri-chicken': '/assets/food/kolhapuri-chicken.jpg',
    'khandeshi-mutton-curry': '/assets/food/khandeshi-mutton-curry.jpg',
    'malvani-fish-thali': '/assets/food/malvani-fish-thali.jpg'
  },
  destination: {
    // Add destination/city-level assets here, e.g.:
    // 'mumbai': '/assets/destinations/mumbai.jpg'
  }
};

function getAssetUrl(category, name) {
  const key = slugify(name);
  const group = ASSET_MAP[category];
  return group ? group[key] || null : null;
}

export { ASSET_MAP, slugify, getAssetUrl };
