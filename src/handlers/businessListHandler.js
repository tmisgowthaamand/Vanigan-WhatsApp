const Business = require('../models/Business');
const District = require('../models/District');
const wa = require('../services/whatsapp');
const { trackAction } = require('../services/leadTracker');

const PAGE_SIZE = 5;

async function handleBusinessList(user, text, lang) {
  const t = lang;
  const num = user.whatsappNumber;

  switch (user.currentState) {
    case 'business_list': {
      // Show paginated approved businesses
      const page = user.tempData.page || 1;
      let query = { status: 'approved' };
      if (user.tempData.selectedDistrict) query.district = user.tempData.selectedDistrict;
      if (user.tempData.selectedAssembly) query.assembly = user.tempData.selectedAssembly;

      // Calculate total pages first for validation
      const totalForNav = await Business.countDocuments(query);
      const totalPagesForNav = Math.ceil(totalForNav / PAGE_SIZE) || 1;

      // Handle page navigation commands (button replies like "page_2", "page_3", etc.)
      const pageMatch = text.match(/^page_(\d+)$/);
      if (pageMatch) {
        const requestedPage = parseInt(pageMatch[1]);
        if (requestedPage >= 1 && requestedPage <= totalPagesForNav) {
          user.tempData.page = requestedPage;
        }
      } else if (!isNaN(text) && parseInt(text) > 0 && parseInt(text) <= PAGE_SIZE) {
        // User selected a business by number (1-5)
        const businesses = await Business.find(query).skip(((user.tempData.page || 1) - 1) * PAGE_SIZE).limit(PAGE_SIZE).lean();
        const idx = parseInt(text) - 1;
        if (idx >= 0 && idx < businesses.length) {
          user.tempData.selectedBusinessId = businesses[idx]._id.toString();
          user.currentState = 'business_details';
          await user.save();
          await trackAction(num, 'business_details', 'view_business', text, { businessId: businesses[idx]._id });
          return showBusinessDetails(user, businesses[idx], t);
        }
      }

      const currentPage = user.tempData.page || 1;
      const total = await Business.countDocuments(query);
      const totalPages = Math.ceil(total / PAGE_SIZE) || 1;
      const businesses = await Business.find(query)
        .skip((currentPage - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE)
        .lean();

      if (businesses.length === 0) {
        await wa.sendText(num, t.noResults + t.backToMenu);
        return;
      }

      let msg = t.businessListTitle
        .replace('{district}', user.tempData.selectedDistrict || 'All')
        .replace('{assembly}', user.tempData.selectedAssembly || 'All');

      businesses.forEach((b, i) => {
        msg += `${i + 1}. *${b.businessName}*\n   ${b.district} | ${b.contact || 'N/A'}\n\n`;
      });

      msg += `${t.pageInfo.replace('{current}', currentPage).replace('{total}', totalPages)}`;
      msg += t.backToMenu;

      user.tempData.page = currentPage;
      await user.save();
      await wa.sendText(num, msg);

      // Send page navigation buttons (WhatsApp allows max 3 buttons)
      if (totalPages > 1) {
        const pageButtons = [];
        for (let p = 1; p <= totalPages && pageButtons.length < 3; p++) {
          if (p !== currentPage) {
            pageButtons.push({ id: `page_${p}`, title: `📄 Page ${p}` });
          }
        }
        // If we have room and skipped pages, add them
        if (pageButtons.length < 3) {
          for (let p = totalPages; p >= 1 && pageButtons.length < 3; p--) {
            if (p !== currentPage && !pageButtons.find(b => b.id === `page_${p}`)) {
              pageButtons.push({ id: `page_${p}`, title: `📄 Page ${p}` });
            }
          }
        }
        await wa.sendButtons(num, `${t.pagesLabel || 'Pages:'} ${currentPage} / ${totalPages}`, pageButtons);
      }

      await trackAction(num, 'business_list', 'view_list', text, { page: currentPage });
      break;
    }

    case 'business_details': {
      // Already showing details, handle back
      user.currentState = 'business_list';
      user.tempData.selectedBusinessId = null;
      await user.save();
      return handleBusinessList(user, '1', lang);
    }
  }
}

async function showBusinessDetails(user, business, t) {
  const num = user.whatsappNumber;
  let msg = t.businessDetailsTitle;
  msg += `*${business.businessName}*\n`;
  msg += `Address: ${business.address || 'N/A'}\n`;
  msg += `District: ${business.district}\n`;
  msg += `Assembly: ${business.assembly}\n`;
  msg += `Contact: ${business.contact || 'N/A'}\n`;
  msg += `Status: ${business.status}\n`;
  if (business.mapLink) msg += `Map: ${business.mapLink}\n`;
  msg += t.backToMenu;

  if (business.photoUrl) {
    await wa.sendImage(num, business.photoUrl, msg);
  } else {
    await wa.sendText(num, msg);
  }
}

// Entry point: user chose "1. Business List" from menu
async function startBusinessListFlow(user, lang) {
  user.currentState = 'business_list';
  user.tempData = { page: 1 };
  user.selectedService = 'business_list';
  await user.save();

  const businesses = await Business.find({ status: 'approved' }).limit(PAGE_SIZE).lean();
  const total = await Business.countDocuments({ status: 'approved' });
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

  if (businesses.length === 0) {
    await wa.sendText(user.whatsappNumber, lang.noResults + lang.backToMenu);
    return;
  }

  let msg = `*Business Directory*\n\n`;
  businesses.forEach((b, i) => {
    msg += `${i + 1}. *${b.businessName}*\n   ${b.district} | ${b.contact || 'N/A'}\n\n`;
  });
  msg += `${lang.pageInfo.replace('{current}', 1).replace('{total}', totalPages)}`;
  msg += lang.backToMenu;

  await wa.sendText(user.whatsappNumber, msg);

  // Send page navigation buttons (WhatsApp allows max 3 buttons)
  if (totalPages > 1) {
    const pageButtons = [];
    for (let p = 2; p <= totalPages && pageButtons.length < 3; p++) {
      pageButtons.push({ id: `page_${p}`, title: `📄 Page ${p}` });
    }
    await wa.sendButtons(user.whatsappNumber, `${lang.pagesLabel || 'Pages:'} 1 / ${totalPages}`, pageButtons);
  }

  await trackAction(user.whatsappNumber, 'business_list', 'started', '', {});
}

module.exports = { handleBusinessList, startBusinessListFlow };
