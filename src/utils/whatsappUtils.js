const wa = require('../services/whatsapp');

async function sendDistrictList(num, lang, districts) {
  const sections = [];
  let currentSection = { title: 'Districts 1-10', rows: [] };
  
  districts.forEach((d, i) => {
    if (currentSection.rows.length >= 10) {
      sections.push(currentSection);
      const start = i + 1;
      const end = Math.min(i + 10, districts.length);
      currentSection = { title: `Districts ${start}-${end}`, rows: [] };
    }
    // WhatsApp list row title has a limit of 24 characters. District names are safe.
    currentSection.rows.push({ id: `dist_${d.name}`, title: d.name });
  });
  if (currentSection.rows.length > 0) {
    sections.push(currentSection);
  }

  // WhatsApp list headers cannot contain markdown or newlines (max 60 chars)
  const safeHeader = lang.selectDistrict ? lang.selectDistrict.replace(/\*/g, '').split('\n')[0].substring(0, 60) : 'Select District';

  await wa.sendList(num, safeHeader, 'Choose a district from the list below:', 'View Districts', sections);
  
  // Also send navigation buttons
  await wa.sendButtons(num, 'Navigate:', [
    { id: '0', title: 'Back' },
    { id: '9', title: 'Main Menu' }
  ]);
}

async function sendAssemblyList(num, lang, district) {
  const sections = [];
  let currentSection = { title: 'Assemblies', rows: [] };
  
  district.assemblies.forEach((a, i) => {
    if (currentSection.rows.length >= 10) {
      sections.push(currentSection);
      currentSection = { title: `Assemblies Part ${sections.length + 1}`, rows: [] };
    }
    // assembly names can be used as IDs or prefixed
    currentSection.rows.push({ id: `asm_${a.name}`, title: a.name });
  });
  if (currentSection.rows.length > 0) {
    sections.push(currentSection);
  }

  const safeHeader = lang.selectAssembly ? lang.selectAssembly.replace(/\*/g, '').split('\n')[0].substring(0, 60) : 'Select Assembly';

  await wa.sendList(num, safeHeader, `Choose an assembly in ${district.name}:`, 'View Assemblies', sections);
  
  await wa.sendButtons(num, 'Navigate:', [
    { id: '0', title: 'Back' },
    { id: '9', title: 'Main Menu' }
  ]);
}

module.exports = { sendDistrictList, sendAssemblyList };
