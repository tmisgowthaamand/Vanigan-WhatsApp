const Member = require('../models/Member');
const District = require('../models/District');
const wa = require('../services/whatsapp');
const { trackAction } = require('../services/leadTracker');

async function handleMember(user, text, lang) {
  const t = lang;
  const num = user.whatsappNumber;

  switch (user.currentState) {
    case 'member_district': {
      const districts = await District.find().sort({ name: 1 }).lean();
      const idx = parseInt(text) - 1;

      if (isNaN(text) || idx < 0 || idx >= districts.length) {
        await wa.sendText(num, t.invalidInput + t.backToMenu);
        return;
      }

      const selected = districts[idx];
      user.tempData.selectedDistrict = selected.name;
      user.currentState = 'member_assembly';
      await user.save();

      let msg = t.selectAssembly;
      selected.assemblies.forEach((a, i) => {
        msg += `${i + 1}. ${a.name}\n`;
      });
      msg += t.backToMenu;

      await wa.sendText(num, msg);
      await trackAction(num, 'member_assembly', 'select_district', text, { district: selected.name });
      break;
    }

    case 'member_assembly': {
      const district = await District.findOne({ name: user.tempData.selectedDistrict }).lean();
      if (!district) {
        await wa.sendText(num, t.error);
        return;
      }

      const idx = parseInt(text) - 1;
      if (isNaN(text) || idx < 0 || idx >= district.assemblies.length) {
        await wa.sendText(num, t.invalidInput + t.backToMenu);
        return;
      }

      const selectedAssembly = district.assemblies[idx].name;
      user.tempData.selectedAssembly = selectedAssembly;
      user.currentState = 'member_list';
      await user.save();

      const members = await Member.find({
        district: user.tempData.selectedDistrict,
        assembly: selectedAssembly
      }).lean();

      if (members.length === 0) {
        await wa.sendText(num, t.noResults + t.backToMenu);
        return;
      }

      let msg = t.memberListTitle
        .replace('{district}', user.tempData.selectedDistrict)
        .replace('{assembly}', selectedAssembly);

      members.forEach((m, i) => {
        msg += `${i + 1}. *${m.name}*\n   ${m.position || m.businessName || 'Member'} | ${m.contact || 'N/A'}\n\n`;
      });
      msg += t.backToMenu;

      await wa.sendText(num, msg);
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
        msg += t.backToMenu;

        if (mem.photoUrl) {
          await wa.sendImage(num, mem.photoUrl, msg);
        } else {
          await wa.sendText(num, msg);
        }
        await trackAction(num, 'member_list', 'view_detail', text, { member: mem.name });
      } else {
        await wa.sendText(num, t.invalidInput + t.backToMenu);
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
  let msg = lang.selectDistrict;
  districts.forEach((d, i) => {
    msg += `${i + 1}. ${d.name}\n`;
  });
  msg += lang.backToMenu;

  await wa.sendText(user.whatsappNumber, msg);
  await trackAction(user.whatsappNumber, 'member_district', 'started', '', {});
}

module.exports = { handleMember, startMemberFlow };
