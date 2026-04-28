const Business = require('../models/Business');
const District = require('../models/District');
const wa = require('../services/whatsapp');
const { trackAction } = require('../services/leadTracker');
const { downloadMedia } = require('../services/whatsapp');
const fs = require('fs');
const path = require('path');

async function handleAddBusiness(user, text, lang, message) {
  const t = lang;
  const num = user.whatsappNumber;

  switch (user.currentState) {
    case 'add_business_name': {
      if (!text || text.length < 2) {
        await wa.sendText(num, t.invalidInput + '\n\n' + t.addBusinessName);
        return;
      }
      user.tempData.businessName = text;
      user.currentState = 'add_business_address';
      await user.save();
      await wa.sendText(num, t.addBusinessAddress + t.backToMenu);
      await trackAction(num, 'add_business_address', 'enter_name', text, { businessName: text });
      break;
    }

    case 'add_business_address': {
      if (!text || text.length < 5) {
        await wa.sendText(num, t.invalidInput + '\n\n' + t.addBusinessAddress);
        return;
      }
      user.tempData.address = text;
      user.currentState = 'add_business_district';
      await user.save();

      const districts = await District.find().sort({ name: 1 }).lean();
      let msg = t.addBusinessDistrict;
      districts.forEach((d, i) => {
        msg += `${i + 1}. ${d.name}\n`;
      });
      msg += t.backToMenu;
      await wa.sendText(num, msg);
      await trackAction(num, 'add_business_district', 'enter_address', text, {});
      break;
    }

    case 'add_business_district': {
      const districts = await District.find().sort({ name: 1 }).lean();
      const idx = parseInt(text) - 1;

      if (isNaN(text) || idx < 0 || idx >= districts.length) {
        await wa.sendText(num, t.invalidInput + t.backToMenu);
        return;
      }

      const selected = districts[idx];
      user.tempData.district = selected.name;
      user.currentState = 'add_business_assembly';
      await user.save();

      let msg = t.addBusinessAssembly;
      selected.assemblies.forEach((a, i) => {
        msg += `${i + 1}. ${a.name}\n`;
      });
      msg += t.backToMenu;
      await wa.sendText(num, msg);
      await trackAction(num, 'add_business_assembly', 'select_district', text, { district: selected.name });
      break;
    }

    case 'add_business_assembly': {
      const district = await District.findOne({ name: user.tempData.district }).lean();
      if (!district) {
        await wa.sendText(num, t.error);
        return;
      }

      const idx = parseInt(text) - 1;
      if (isNaN(text) || idx < 0 || idx >= district.assemblies.length) {
        await wa.sendText(num, t.invalidInput + t.backToMenu);
        return;
      }

      user.tempData.assembly = district.assemblies[idx].name;
      user.currentState = 'add_business_contact';
      await user.save();
      await wa.sendText(num, t.addBusinessContact + t.backToMenu);
      await trackAction(num, 'add_business_contact', 'select_assembly', text, { assembly: user.tempData.assembly });
      break;
    }

    case 'add_business_contact': {
      const cleaned = text.replace(/[^0-9+]/g, '');
      if (cleaned.length < 10) {
        await wa.sendText(num, t.invalidInput + '\n\n' + t.addBusinessContact);
        return;
      }
      user.tempData.contact = cleaned;
      user.currentState = 'add_business_photo';
      await user.save();
      await wa.sendText(num, t.addBusinessPhoto + t.backToMenu);
      await trackAction(num, 'add_business_photo', 'enter_contact', cleaned, {});
      break;
    }

    case 'add_business_photo': {
      let photoUrl = '';

      // Handle photo upload or skip
      if (message && message.type === 'image' && message.image) {
        try {
          const mediaId = message.image.id;
          const media = await downloadMedia(mediaId);
          if (media) {
            const uploadDir = path.join(__dirname, '../../uploads');
            if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

            const ext = media.mimeType.includes('png') ? 'png' : 'jpg';
            const fileName = `biz_${num}_${Date.now()}.${ext}`;
            const filePath = path.join(uploadDir, fileName);
            fs.writeFileSync(filePath, media.buffer);
            photoUrl = `/uploads/${fileName}`;
          }
        } catch (err) {
          console.error('Photo upload error:', err.message);
        }
      } else if (text.toLowerCase() === 'skip') {
        photoUrl = '';
      } else if (text !== 'image_received') {
        await wa.sendText(num, `Please send an image or type *skip* to continue.\n${t.addBusinessPhoto}`);
        return;
      }

      // Save business to DB
      const business = new Business({
        businessName: user.tempData.businessName,
        address: user.tempData.address,
        district: user.tempData.district,
        assembly: user.tempData.assembly,
        contact: user.tempData.contact,
        ownerWhatsapp: num,
        photoUrl: photoUrl,
        status: 'pending'
      });
      await business.save();

      // Update user businessProfile
      user.businessProfile = {
        businessId: business._id,
        businessName: business.businessName
      };
      user.currentState = 'choose_service';
      user.tempData = {};
      await user.save();

      const successMsg = t.addBusinessSuccess
        .replace('{businessName}', business.businessName)
        .replace('{district}', business.district)
        .replace('{assembly}', business.assembly);

      await wa.sendText(num, successMsg);
      await trackAction(num, 'choose_service', 'business_added', '', {
        businessId: business._id.toString(),
        businessName: business.businessName
      });
      break;
    }
  }
}

async function startAddBusinessFlow(user, lang) {
  user.currentState = 'add_business_name';
  user.tempData = {};
  user.selectedService = 'add_business';
  await user.save();

  await wa.sendText(user.whatsappNumber, lang.addBusinessName + lang.backToMenu);
  await trackAction(user.whatsappNumber, 'add_business_name', 'started', '', {});
}

module.exports = { handleAddBusiness, startAddBusinessFlow };
