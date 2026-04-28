const wa = require('../services/whatsapp');

async function sendDistrictList(num, lang, districts, page = 1) {
  const ITEMS_PER_PAGE = page === 1 ? 9 : 8;
  const startIndex = page === 1 ? 0 : 9 + (page - 2) * 8;
  const pageDistricts = districts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const hasMore = startIndex + ITEMS_PER_PAGE < districts.length;

  const rows = [];
  
  if (page > 1) {
    rows.push({ id: `distpage_${page - 1}`, title: '⬅️ Previous Page' });
  }

  pageDistricts.forEach((d) => {
    rows.push({ id: `dist_${d.name}`, title: d.name });
  });

  if (hasMore) {
    rows.push({ id: `distpage_${page + 1}`, title: 'Next Page ➡️' });
  }

  const sections = [{ title: `Districts (Page ${page})`, rows }];

  const safeHeader = lang.selectDistrict ? lang.selectDistrict.replace(/\*/g, '').split('\n')[0].substring(0, 60) : 'Select District';

  await wa.sendList(num, safeHeader, 'Choose from the list below:', 'View Districts', sections);
  
  await wa.sendButtons(num, 'Navigate:', [
    { id: '0', title: 'Back' },
    { id: '9', title: 'Main Menu' }
  ]);
}

async function sendAssemblyList(num, lang, district, page = 1) {
  const ITEMS_PER_PAGE = page === 1 ? 9 : 8;
  const startIndex = page === 1 ? 0 : 9 + (page - 2) * 8;
  const pageAssemblies = district.assemblies.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const hasMore = startIndex + ITEMS_PER_PAGE < district.assemblies.length;

  const rows = [];

  if (page > 1) {
    rows.push({ id: `asmpage_${page - 1}`, title: '⬅️ Previous Page' });
  }

  pageAssemblies.forEach((a) => {
    rows.push({ id: `asm_${a.name}`, title: a.name });
  });

  if (hasMore) {
    rows.push({ id: `asmpage_${page + 1}`, title: 'Next Page ➡️' });
  }

  const sections = [{ title: `Assemblies (Page ${page})`, rows }];

  const safeHeader = lang.selectAssembly ? lang.selectAssembly.replace(/\*/g, '').split('\n')[0].substring(0, 60) : 'Select Assembly';

  await wa.sendList(num, safeHeader, `Choose an assembly in ${district.name}:`, 'View Assemblies', sections);
  
  await wa.sendButtons(num, 'Navigate:', [
    { id: '0', title: 'Back' },
    { id: '9', title: 'Main Menu' }
  ]);
}

module.exports = { sendDistrictList, sendAssemblyList };
