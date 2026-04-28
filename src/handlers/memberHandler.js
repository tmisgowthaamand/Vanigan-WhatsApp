const Member = require('../models/Member');
const District = require('../models/District');
const wa = require('../services/whatsapp');
const { trackAction } = require('../services/leadTracker');
const { sendDistrictList, sendAssemblyList } = require('../utils/whatsappUtils');

async function handleMember(user, text, lang) {
  const t = lang;
  const num = user.whatsappNumber;

  switch (user.currentState) {
    case 'member_district': {
      const districts = await District.find().sort({ name: 1 }).lean();

      if (text.startsWith('distpage_')) {
        const page = parseInt(text.replace('distpage_', '')) || 1;
        await sendDistrictList(num, lang, districts, page);
        return;
      }

      let selected = null;
      
      if (text.startsWith('dist_')) {
        selected = districts.find(d => d.name === text.replace('dist_', ''));
      } else if (!isNaN(text)) {
        const idx = parseInt(text) - 1;
        if (idx >= 0 && idx < districts.length) selected = districts[idx];
      }

      if (!selected) {
        await wa.sendText(num, t.invalidInput);
        await wa.sendButtons(num, 'Navigate:', [
          { id: '0', title: 'Back' },
          { id: '9', title: 'Main Menu' }
        ]);
        return;
      }

      user.tempData.selectedDistrict = selected.name;
      user.currentState = 'member_assembly';
      await user.save();

      await sendAssemblyList(num, lang, selected);
      await trackAction(num, 'member_assembly', 'select_district', selected.name, { district: selected.name });
      break;
    }

    case 'member_assembly': {
      const district = await District.findOne({ name: user.tempData.selectedDistrict }).lean();
      if (!district) {
        await wa.sendText(num, t.error);
        return;
      }

      if (text.startsWith('asmpage_')) {
        const page = parseInt(text.replace('asmpage_', '')) || 1;
        await sendAssemblyList(num, lang, district, page);
        return;
      }

      let selectedAssembly = null;
      if (text.startsWith('asm_')) {
        const asmName = text.replace('asm_', '');
        if (district.assemblies.find(a => a.name === asmName)) {
          selectedAssembly = asmName;
        }
      } else if (!isNaN(text)) {
        const idx = parseInt(text) - 1;
        if (idx >= 0 && idx < district.assemblies.length) {
          selectedAssembly = district.assemblies[idx].name;
        }
      }

      if (!selectedAssembly) {
        await wa.sendText(num, t.invalidInput);
        await wa.sendButtons(num, 'Navigate:', [
          { id: '0', title: 'Back' },
          { id: '9', title: 'Main Menu' }
        ]);
        return;
      }

      user.tempData.selectedAssembly = selectedAssembly;
      user.currentState = 'member_list';
      await user.save();

      const members = await Member.find({
        district: user.tempData.selectedDistrict,
        assembly: selectedAssembly
      }).lean();

      if (members.length === 0) {
        await wa.sendText(num, t.noResults);
        await wa.sendButtons(num, 'Navigate:', [
          { id: '0', title: 'Back' },
          { id: '9', title: 'Main Menu' }
        ]);
        return;
      }

      let msg = t.memberListTitle
        .replace('{district}', user.tempData.selectedDistrict)
        .replace('{assembly}', selectedAssembly);

      members.forEach((m, i) => {
        msg += `${i + 1}. *${m.name}*\n   ${m.position || m.businessName || 'Member'} | ${m.contact || 'N/A'}\n\n`;
      });
      msg += `\n0. Back`;

      await wa.sendText(num, msg);
      await wa.sendButtons(num, 'Navigate:', [
        { id: '0', title: 'Back' },
        { id: '9', title: 'Main Menu' }
      ]);
      await trackAction(num, 'member_list', 'view_list', text, {
        district: user.tempData.selectedDistrict,
        assembly: selectedAssembly
      });
      break;
    }

    case 'member_list': {
      const members = await Member.find({
        district: user.tempData.selectedDistrict,
        assembly: user.tempData.selectedAssembly
      }).lean();

      const idx = parseInt(text) - 1;
      if (!isNaN(text) && idx >= 0 && idx < members.length) {
        const mem = members[idx];
        let msg = `*${mem.name}*\n`;
        msg += `Position: ${mem.position || 'Member'}\n`;
        if (mem.businessName) msg += `Business: ${mem.businessName}\n`;
        msg += `District: ${mem.district}\n`;
        msg += `Assembly: ${mem.assembly}\n`;
        msg += `Contact: ${mem.contact || 'N/A'}\n`;

        if (mem.photoUrl) {
          await wa.sendImage(num, mem.photoUrl, msg);
        } else {
          await wa.sendText(num, msg);
        }
        await wa.sendButtons(num, 'Navigate:', [
          { id: '0', title: 'Back' },
          { id: '9', title: 'Main Menu' }
        ]);
        await trackAction(num, 'member_list', 'view_detail', text, { member: mem.name });
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

async function startMemberFlow(user, lang) {
  user.currentState = 'member_district';
  user.tempData = {};
  user.selectedService = 'member_list';
  await user.save();

  const districts = await District.find().sort({ name: 1 }).lean();
  await sendDistrictList(user.whatsappNumber, lang, districts);
  await trackAction(user.whatsappNumber, 'member_district', 'started', '', {});
}

module.exports = { handleMember, startMemberFlow };
