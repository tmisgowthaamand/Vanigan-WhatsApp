require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const connectDB = require('./src/config/db');
const Business = require('./src/models/Business');
const wa = require('./src/services/whatsapp');

const webhookRoutes = require('./src/routes/webhook');
const razorpayRoutes = require('./src/routes/razorpayWebhook');
const adminRoutes = require('./src/routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: [
    'https://vanigan-whats-app.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files and public static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/webhook', webhookRoutes);
app.use('/razorpay', razorpayRoutes);
app.use('/api/admin', adminRoutes);

// Web Form Submission
app.post('/api/business/submit-form', async (req, res) => {
  try {
    const { whatsappNumber, businessName, address, district, assembly, contact, category } = req.body;
    
    const newBiz = new Business({
      businessName,
      address,
      district,
      assembly,
      contact,
      ownerWhatsapp: whatsappNumber || 'unknown',
      category,
      status: 'pending' // Admin approval required
    });
    
    await newBiz.save();
    
    // Send confirmation message to the user on WhatsApp
    if (whatsappNumber && whatsappNumber !== 'unknown') {
      const msg = `*Your business has been submitted successfully!*\n\nBusiness Name: ${businessName}\nDistrict: ${district}\nCategory: ${category}\n\nOur team will review and publish it shortly.\n\nReply 9 for Main Menu.`;
      await wa.sendText(whatsappNumber, msg);
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('Error submitting web form:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'Online',
    message: 'Vanigan WhatsApp Bot API is active',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend static files in production
const frontendDist = path.join(__dirname, 'vanigan-frontend', 'dist');
app.use(express.static(frontendDist));
app.use((req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/webhook') || req.path.startsWith('/razorpay')) {
    return next();
  }
  const indexFile = path.join(frontendDist, 'index.html');
  if (!fs.existsSync(indexFile)) {
    return res.json({
      status: 'Online',
      message: 'Vanigan WhatsApp Bot API is active. Frontend is hosted separately.',
      frontendUrl: process.env.FRONTEND_URL || 'https://vanigan-whats-app.vercel.app/'
    });
  }
  return res.sendFile(path.join(frontendDist, 'index.html'));
});

// Start server
async function start() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Vanigan Bot Server running on port ${PORT}`);
      console.log(`Admin API: http://localhost:${PORT}/api/admin/dashboard`);
      console.log(`Webhook: http://localhost:${PORT}/webhook`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
