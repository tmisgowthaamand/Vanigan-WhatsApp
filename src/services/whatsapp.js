const axios = require('axios');

const API_VERSION = 'v18.0';
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

function getHeaders() {
  return {
    'Authorization': `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
    'Content-Type': 'application/json'
  };
}

function getMessagesUrl() {
  return `${BASE_URL}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
}

async function sendText(to, text) {
  try {
    await axios.post(getMessagesUrl(), {
      messaging_product: 'whatsapp', to, type: 'text',
      text: { body: text }
    }, { headers: getHeaders() });
  } catch (err) {
    console.error('sendText error:', err.response?.data || err.message);
  }
}

async function sendImage(to, imageUrl, caption) {
  try {
    await axios.post(getMessagesUrl(), {
      messaging_product: 'whatsapp', to, type: 'image',
      image: { link: imageUrl, caption }
    }, { headers: getHeaders() });
  } catch (err) {
    console.error('sendImage error:', err.response?.data || err.message);
  }
}

async function sendList(to, title, body, buttonLabel, sections) {
  try {
    await axios.post(getMessagesUrl(), {
      messaging_product: 'whatsapp', to, type: 'interactive',
      interactive: {
        type: 'list',
        header: { type: 'text', text: title },
        body: { text: body },
        footer: { text: 'Select an option' },
        action: { button: buttonLabel, sections }
      }
    }, { headers: getHeaders() });
  } catch (err) {
    console.error('sendList error:', err.response?.data || err.message);
  }
}

async function sendButtons(to, body, buttons) {
  try {
    await axios.post(getMessagesUrl(), {
      messaging_product: 'whatsapp', to, type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: body },
        action: {
          buttons: buttons.map(b => ({
            type: 'reply',
            reply: { id: b.id, title: b.title }
          }))
        }
      }
    }, { headers: getHeaders() });
  } catch (err) {
    console.error('sendButtons error:', err.response?.data || err.message);
  }
}

async function downloadMedia(mediaId) {
  try {
    const mediaRes = await axios.get(`${BASE_URL}/${mediaId}`, { headers: getHeaders() });
    const mediaUrl = mediaRes.data.url;
    const fileRes = await axios.get(mediaUrl, {
      headers: { 'Authorization': `Bearer ${process.env.WHATSAPP_API_TOKEN}` },
      responseType: 'arraybuffer'
    });
    return { buffer: fileRes.data, mimeType: mediaRes.data.mime_type };
  } catch (err) {
    console.error('downloadMedia error:', err.response?.data || err.message);
    return null;
  }
}

module.exports = { sendText, sendImage, sendList, sendButtons, downloadMedia };
