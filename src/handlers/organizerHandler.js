const Organizer = require('../models/Organizer');
const District = require('../models/District');
const wa = require('../services/whatsapp');
const { trackAction } = require('../services/leadTracker');

async function handleOrganizer(user, text, lang) {
  const t = lang;
  const num = user.whatsappNumber;

  switch (user.currentState) {
    case 'organizer_district': {
      const districts = await District.find().sort({ name: 1 }).lean();
      const idx = parseInt(text) - 1;

      if (isNaN(text) || idx < 0 || idx >= districts.length) {
        await wa.sendText(num, t.invalidInput);
        await wa.sendButtons(num, 'Navigate:', [
          { id: '0', title: 'Back' },
          { id: '9', title: 'Main Menu' }
        ]);
        return;
      }

      const selected = districts[idx];
      user.tempData.selectedDistrict = selected.name;
      user.currentState = 'organizer_assembly';
      await user.save();

      let msg = t.selectAssembly;
      selected.assemblies.forEach((a, i) => {
        msg += `${i + 1}. ${a.name}\n`;
      });
      msg += `\n0. Back`;

      await wa.sendText(num, msg);
      await wa.sendButtons(num, 'Navigate:', [
        { id: '0', title: 'Back' },
        { id: '9', title: 'Main Menu' }
      ]);
      await trackAction(num, 'organizer_assembly', 'select_district', text, { district: selected.name });
      break;
    }

    case 'organizer_assembly': {
      const district = await District.findOne({ name: user.tempData.selectedDistrict }).lean();
      if (!district) {
        await wa.sendText(num, t.error);
        return;
      }

      const idx = parseInt(text) - 1;
      if (isNaN(text) || idx < 0 || idx >= district.assemblies.length) {
        await wa.sendText(num, t.invalidInput);
        await wa.sendButtons(num, 'Navigate:', [
          { id: '0', title: 'Back' },
          { id: '9', title: 'Main Menu' }
        ]);
        return;
      }

      const selectedAssembly = district.assemblies[idx].name;
      user.tempData.selectedAssembly = selectedAssembly;
      user.currentState = 'organizer_list';
      await user.save();

      const organizers = await Organizer.find({
        district: user.tempData.selectedDistrict,
        assembly: selectedAssembly
      }).lean();

      if (organizers.length === 0) {
        await wa.sendText(num, t.noResults);
        await wa.sendButtons(num, 'Navigate:', [
          { id: '0', title: 'Back' },
          { id: '9', title: 'Main Menu' }
        ]);
        return;
      }

      let msg = t.organizerListTitle
        .replace('{district}', user.tempData.selectedDistrict)
        .replace('{assembly}', selectedAssembly);

      organizers.forEach((o, i) => {
        msg += `${i + 1}. *${o.name}*\n   ${o.position || 'Organizer'} | ${o.contact || 'N/A'}\n\n`;
      });
      msg += `\n0. Back`;

      await wa.sendText(num, msg);
      await wa.sendButtons(num, 'Navigate:', [
        { id: '0', title: 'Back' },
        { id: '9', title: 'Main Menu' }
      ]);
      await trackAction(num, 'organizer_list', 'view_list', text, {
        district: user.tempData.selectedDistrict,
        assembly: selectedAssembly
      });
      break;
    }

    case 'organizer_list': {
      // If user types a number, show organizer details
      const organizers = await Organizer.find({
        district: user.tempData.selectedDistrict,
        assembly: user.tempData.selectedAssembly
      }).lean();

      const idx = parseInt(text) - 1;
      if (!isNaN(text) && idx >= 0 && idx < organizers.length) {
        const org = organizers[idx];
        let msg = `*${org.name}*\n`;
        msg += `Position: ${org.position || 'Organizer'}\n`;
        msg += `District: ${org.district}\n`;
        msg += `Assembly: ${org.assembly}\n`;
        msg += `Contact: ${org.contact || 'N/A'}\n`;

        if (org.photoUrl) {
          await wa.sendImage(num, org.photoUrl, msg);
        } else {
          await wa.sendText(num, msg);
        }
        await wa.sendButtons(num, 'Navigate:', [
          { id: '0', title: 'Back' },
          { id: '9', title: 'Main Menu' }
        ]);
        await trackAction(num, 'organizer_list', 'view_detail', text, { organizer: org.name });
      } else {
        await wa.sendText(num, t.invalidInput);
        await wa.sendButtons(num, 'Navigate:', [
          { id: '0', title: 'Back' },
          { id: '9', title: 'Main Menu' }
        ]);
      }
      break;
    }
  }
}

async function startOrganizerFlow(user, lang) {
  user.currentState = 'organizer_district';
  user.tempData = {};
  user.selectedService = 'organizer_list';
  await user.save();

  const districts = await District.find().sort({ name: 1 }).lean();
  let msg = lang.selectDistrict;
  districts.forEach((d, i) => {
    msg += `${i + 1}. ${d.name}\n`;
  });
  msg += `\n0. Back`;

  await wa.sendText(user.whatsappNumber, msg);
  await wa.sendButtons(user.whatsappNumber, 'Navigate:', [
    { id: '0', title: 'Back' },
    { id: '9', title: 'Main Menu' }
  ]);
  await trackAction(user.whatsappNumber, 'organizer_district', 'started', '', {});
}

module.exports = { handleOrganizer, startOrganizerFlow };
