const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const User = require('../models/User');
const Business = require('../models/Business');
const Organizer = require('../models/Organizer');
const Member = require('../models/Member');
const District = require('../models/District');
const Lead = require('../models/Lead');
const Payment = require('../models/Payment');

// ── Admin Auth ──
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';
const ADMIN_TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET || 'vanigan-admin-secret-2024';

function generateToken(username) {
  const payload = `${username}:${Date.now()}`;
  const hmac = crypto.createHmac('sha256', ADMIN_TOKEN_SECRET).update(payload).digest('hex');
  return Buffer.from(`${payload}:${hmac}`).toString('base64');
}

function verifyToken(token) {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const parts = decoded.split(':');
    if (parts.length < 3) return false;
    const hmac = parts.pop();
    const payload = parts.join(':');
    const expected = crypto.createHmac('sha256', ADMIN_TOKEN_SECRET).update(payload).digest('hex');
    return hmac === expected;
  } catch { return false; }
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.split(' ')[1];
  if (!verifyToken(token)) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  next();
}

// Login (no auth required)
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = generateToken(username);
    return res.json({ success: true, token });
  }
  return res.status(401).json({ success: false, error: 'Invalid credentials' });
});

// Protect all routes below
router.use(authMiddleware);

// ── Dashboard Stats ──
router.get('/dashboard', async (req, res) => {
  try {
    const [totalUsers, totalBusinesses, pendingBusinesses, approvedBusinesses,
           totalOrganizers, totalMembers, totalLeads, totalPayments,
           activeSubscriptions] = await Promise.all([
      User.countDocuments(),
      Business.countDocuments(),
      Business.countDocuments({ status: 'pending' }),
      Business.countDocuments({ status: 'approved' }),
      Organizer.countDocuments(),
      Member.countDocuments(),
      Lead.countDocuments(),
      Payment.countDocuments({ status: 'paid' }),
      User.countDocuments({ 'subscription.status': 'active' })
    ]);

    const recentLeads = await Lead.find()
      .sort({ lastActivityAt: -1 })
      .limit(10)
      .lean();

    const recentPayments = await Payment.find({ status: 'paid' })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    res.json({
      stats: {
        totalUsers, totalBusinesses, pendingBusinesses, approvedBusinesses,
        totalOrganizers, totalMembers, totalLeads, totalPayments, activeSubscriptions
      },
      recentLeads,
      recentPayments
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Leads ──
router.get('/leads', async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = {};
    if (search) {
      query.$or = [
        { whatsappNumber: { $regex: search, $options: 'i' } },
        { lastState: { $regex: search, $options: 'i' } }
      ];
    }

    const leads = await Lead.find(query)
      .sort({ lastActivityAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await Lead.countDocuments(query);
    res.json({ leads, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/leads/:id', async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id).lean();
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    res.json(lead);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/leads/:id', async (req, res) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    res.json({ success: true, message: 'Lead deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Users ──
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = {};
    if (search) {
      query.$or = [
        { whatsappNumber: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await User.countDocuments(query);
    res.json({ users, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Businesses ──
router.get('/businesses', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { businessName: { $regex: search, $options: 'i' } },
        { district: { $regex: search, $options: 'i' } }
      ];
    }

    const businesses = await Business.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await Business.countDocuments(query);
    res.json({ businesses, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/businesses/:id', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const business = await Business.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!business) return res.status(404).json({ error: 'Business not found' });
    res.json(business);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/businesses/:id', async (req, res) => {
  try {
    const business = await Business.findByIdAndDelete(req.params.id);
    if (!business) return res.status(404).json({ error: 'Business not found' });
    res.json({ success: true, message: 'Business deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Organizers ──
router.get('/organizers', async (req, res) => {
  try {
    const { page = 1, limit = 20, district, search } = req.query;
    const query = {};
    if (district) query.district = district;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { district: { $regex: search, $options: 'i' } }
      ];
    }

    const organizers = await Organizer.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await Organizer.countDocuments(query);
    res.json({ organizers, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/organizers/:id', async (req, res) => {
  try {
    const organizer = await Organizer.findByIdAndDelete(req.params.id);
    if (!organizer) return res.status(404).json({ error: 'Organizer not found' });
    res.json({ success: true, message: 'Organizer deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Members ──
router.get('/members', async (req, res) => {
  try {
    const { page = 1, limit = 20, district, search } = req.query;
    const query = {};
    if (district) query.district = district;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { district: { $regex: search, $options: 'i' } }
      ];
    }

    const members = await Member.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await Member.countDocuments(query);
    res.json({ members, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/members/:id', async (req, res) => {
  try {
    const member = await Member.findByIdAndDelete(req.params.id);
    if (!member) return res.status(404).json({ error: 'Member not found' });
    res.json({ success: true, message: 'Member deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Districts ──
router.get('/districts', async (req, res) => {
  try {
    const districts = await District.find().sort({ name: 1 }).lean();
    res.json(districts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Reset User Subscription ──
router.post('/users/:id/reset-subscription', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.subscription = {
      plan: '',
      status: 'none',
      razorpayOrderId: undefined,
      razorpayPaymentId: undefined,
      razorpaySubscriptionId: undefined,
      startDate: undefined,
      endDate: undefined
    };
    user.currentState = 'choose_service';
    user.tempData = {};
    await user.save();

    // Also delete related payment records
    await Payment.deleteMany({ whatsappNumber: user.whatsappNumber });

    res.json({ success: true, message: `Subscription reset for ${user.whatsappNumber}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reset subscription by WhatsApp number
router.post('/reset-subscription/:phone', async (req, res) => {
  try {
    const phone = req.params.phone;
    const user = await User.findOne({ whatsappNumber: phone });
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.subscription = {
      plan: '',
      status: 'none',
      razorpayOrderId: undefined,
      razorpayPaymentId: undefined,
      razorpaySubscriptionId: undefined,
      startDate: undefined,
      endDate: undefined
    };
    user.currentState = 'choose_service';
    user.tempData = {};
    await user.save();

    await Payment.deleteMany({ whatsappNumber: phone });

    res.json({ success: true, message: `Subscription reset for ${phone}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Payments ──
router.get('/payments', async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = {};
    if (status) query.status = status;

    const payments = await Payment.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('userId', 'whatsappNumber name')
      .lean();

    const total = await Payment.countDocuments(query);
    res.json({ payments, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/payments/:id', async (req, res) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    res.json({ success: true, message: 'Payment deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
