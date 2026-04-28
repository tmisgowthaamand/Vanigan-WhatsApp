const wa = require('../services/whatsapp');

async function sendDistrictList(num, lang, districts) {
  let msg = lang.selectDistrict || 'Reply with the district number:\n\n';
  districts.forEach((d, i) => {
    msg += `${i + 1}. ${d.name}\n`;
  });
  msg += `\n0. Back`;

  await wa.sendText(num, msg);
  
  // Also send navigation buttons
  await wa.sendButtons(num, 'Navigate:', [
    { id: '0', title: 'Back' },
    { id: '9', title: 'Main Menu' }
  ]);
}

async function sendAssemblyList(num, lang, district) {
  let msg = lang.selectAssembly || `Reply with the assembly number in ${district.name}:\n\n`;
  district.assemblies.forEach((a, i) => {
    msg += `${i + 1}. ${a.name}\n`;
  });
  msg += `\n0. Back`;

  await wa.sendText(num, msg);
  
  await wa.sendButtons(num, 'Navigate:', [
    { id: '0', title: 'Back' },
    { id: '9', title: 'Main Menu' }
  ]);
}

module.exports = { sendDistrictList, sendAssemblyList };
