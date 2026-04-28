const express = require('express');
const router = express.Router();
const { handleMessage } = require('../handlers/messageRouter');

// Webhook verification for Facebook/WhatsApp Cloud API
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log('WEBHOOK_VERIFIED');
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// Receive messages from WhatsApp Cloud API
router.post('/', async (req, res) => {
  try {
    const body = req.body;
    if (!body.object) return res.sendStatus(404);

    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const message = change?.value?.messages?.[0];

    if (!message) return res.sendStatus(200);

    const from = message.from;
    let text = '';

    if (message.type === 'text') {
      text = message.text.body.trim();
    } else if (message.type === 'interactive') {
      if (message.interactive.type === 'list_reply') {
        text = message.interactive.list_reply.id;
      } else if (message.interactive.type === 'button_reply') {
        text = message.interactive.button_reply.id;
      }
    } else if (message.type === 'image') {
      text = 'image_received';
    } else if (message.type === 'location') {
      text = 'location_received';
    }

    if (!text) return res.sendStatus(200);

    await handleMessage({ from, text, message });
    return res.sendStatus(200);
  } catch (err) {
    console.error('Webhook error:', err);
    return res.sendStatus(200);
  }
});

module.exports = router;
