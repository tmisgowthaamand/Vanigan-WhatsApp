const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Business = require('../models/Business');
const Organizer = require('../models/Organizer');
const Member = require('../models/Member');
const District = require('../models/District');
const Lead = require('../models/Lead');
const Payment = require('../models/Payment');

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

// ── Districts ──
router.get('/districts', async (req, res) => {
  try {
    const districts = await District.find().sort({ name: 1 }).lean();
    res.json(districts);
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

module.exports = router;
