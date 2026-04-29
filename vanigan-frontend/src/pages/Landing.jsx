import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  Image as ImageIcon,
  MapPin,
  Menu,
  MessageCircle,
  Newspaper,
  PhoneCall,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const whatsappUrl = 'https://api.whatsapp.com/send?phone=15551596475&text=Hi';

const features = [
  {
    icon: BriefcaseBusiness,
    title: 'Verified business directory',
    desc: 'District-wise business listings with category, contact, address, maps, and image gallery support.',
  },
  {
    icon: Users,
    title: 'Members and organizers',
    desc: 'Assembly and district filters help people discover Vanigan members and organizers quickly.',
  },
  {
    icon: MessageCircle,
    title: 'Number-based chat flow',
    desc: 'Simple WhatsApp menu replies guide every user to business lists, news, plans, and onboarding.',
  },
  {
    icon: Newspaper,
    title: 'Local announcements',
    desc: 'Share business meetings, startup programs, conferences, and local updates inside the same assistant.',
  },
  {
    icon: ImageIcon,
    title: 'Gallery-ready listings',
    desc: 'Let businesses show storefronts, products, and services with rich visual media.',
  },
  {
    icon: ShieldCheck,
    title: 'Admin controlled',
    desc: 'Manage users, leads, businesses, payments, organizers, and members from a protected panel.',
  },
];

const stats = [
  { value: '24/7', label: 'WhatsApp access' },
  { value: '5', label: 'Core menu flows' },
  { value: '3', label: 'Listing plans' },
];

const workflow = [
  {
    icon: Send,
    title: 'User says Hi',
    desc: 'The assistant opens with clear options for business lists, organizers, members, onboarding, and plans.',
  },
  {
    icon: MapPin,
    title: 'Select district flow',
    desc: 'The user narrows results by district, category, or assembly without installing another app.',
  },
  {
    icon: PhoneCall,
    title: 'Connect instantly',
    desc: 'Every listing can surface phone, WhatsApp, map, gallery, and promotion details in one chat.',
  },
];

const pricing = [
  {
    title: 'Monthly',
    price: '\u20B9199',
    period: '/month',
    features: ['Business listing', 'Priority visibility', 'Gallery images', 'Contact access'],
  },
  {
    title: 'Yearly',
    price: '\u20B91499',
    period: '/year',
    popular: true,
    features: ['All monthly benefits', 'Featured listing', 'Business promotion', 'Priority support'],
  },
  {
    title: 'Lifetime',
    price: '\u20B94999',
    period: 'one time',
    features: ['Lifetime listing', 'Premium visibility', 'Unlimited photos', 'Dedicated support'],
  },
];

function Reveal({ children, delay = 0, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.8, delay: delay / 1000, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function SectionHeading({ eyebrow, title, desc }) {
  return (
    <div className="section-heading">
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      {desc && <p>{desc}</p>}
    </div>
  );
}

function PageSection({ id, className = '', children }) {
  return (
    <section id={id} className={`page-section ${className}`}>
      <div className="section-line" aria-hidden="true" />
      {children}
    </section>
  );
}

function HeroMotion() {
  return (
    <div className="hero-motion" aria-hidden="true">
      <motion.div 
        animate={{ rotate: 360 }} 
        transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
        className="motion-orbit orbit-one"
      >
        <motion.span 
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} 
          transition={{ duration: 3, repeat: Infinity }} 
        />
      </motion.div>
      <motion.div 
        animate={{ rotate: -360 }} 
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        className="motion-orbit orbit-two"
      >
        <motion.span 
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} 
          transition={{ duration: 4, repeat: Infinity }} 
        />
      </motion.div>
      <div className="motion-beam" />
      
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          animate={{ 
            y: ["0%", "-30%", "0%"],
            x: ["0%", i % 2 === 0 ? "15%" : "-15%", "0%"],
            opacity: [0.6, 1, 0.6]
          }}
          transition={{ duration: 6 + i * 1.5, repeat: Infinity, ease: "easeInOut" }}
          className={`motion-node node-${['one', 'two', 'three'][i]}`}
        />
      ))}

      <motion.div 
        animate={{ y: [0, -25, 0], rotate: [0, 6, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="motion-chip chip-business"
      >
        <BriefcaseBusiness size={15} />
        Verified listing
      </motion.div>
      <motion.div 
        animate={{ y: [0, 30, 0], rotate: [0, -6, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="motion-chip chip-message"
      >
        <MessageCircle size={15} />
        WhatsApp lead
      </motion.div>
      <motion.div 
        animate={{ y: [0, -20, 0], x: [0, 15, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="motion-chip chip-map"
      >
        <MapPin size={15} />
        District match
      </motion.div>
    </div>
  );
}

function FeatureCard({ item, index }) {
  const Icon = item.icon;

  return (
    <Reveal delay={index * 100} className="h-full">
      <motion.div 
        whileHover={{ y: -10, scale: 1.02 }}
        transition={{ type: "spring", bounce: 0.4 }}
        className="feature-card motion-card"
        style={{ height: '100%' }}
      >
        <span className="module-number">0{index + 1}</span>
        <div className="feature-icon">
          <Icon size={26} />
        </div>
        <h3>{item.title}</h3>
        <p>{item.desc}</p>
      </motion.div>
    </Reveal>
  );
}

function PhonePreview() {
  const menuItems = useMemo(
    () => ['Business List', 'Organizer List', 'Members List', 'Add Business', 'Subscription Plans'],
    [],
  );

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9, rotateY: 20 }}
      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
      transition={{ duration: 1.2, type: "spring", bounce: 0.3 }}
      className="phone-stage" aria-label="WhatsApp assistant preview"
    >
      <motion.div 
        animate={{ y: [0, -12, 0] }} 
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="signal-card signal-card-top"
      >
        <Sparkles size={16} />
        <span>Smart reply ready</span>
      </motion.div>
      <motion.div 
        animate={{ y: [0, 12, 0] }} 
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="signal-card signal-card-bottom"
      >
        <Zap size={16} />
        <span>Lead captured</span>
      </motion.div>

      <div className="phone-shell">
        <div className="phone-speaker" />
        <div className="chat-screen">
          <div className="chat-topbar">
            <div className="bot-avatar" style={{ background: 'transparent', boxShadow: 'none' }}>
              <img src="https://vanigan.digital/vaniganlogo.png" alt="Vanigan Assistant" style={{ width: 32, height: 32, objectFit: 'contain' }} />
            </div>
            <div>
              <strong>Vanigan Assistant</strong>
              <span>Online now</span>
            </div>
          </div>

          <div className="chat-body">
            <div className="chat-date">Today</div>
            <motion.div 
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}
              className="bubble bubble-sent"
            >
              Hi
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.2 }}
              className="bubble bubble-received"
            >
              <strong>Welcome to Vanigan App</strong>
              <p>Discover businesses, members, and organizers across your district.</p>
              <div className="menu-list">
                {menuItems.map((item, index) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: 1.8 + index * 0.12 }}
                    className="menu-item" key={item}
                  >
                    <span>{index + 1}</span>
                    {item}
                  </motion.div>
                ))}
              </div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3 }}
              className="bubble bubble-received tiny"
            >
              Reply with a number to continue.
            </motion.div>
          </div>

          <div className="chat-composer">
            <span>Type a message</span>
            <button aria-label="Send demo message">
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('menu-open', isMobileMenuOpen);
    return () => document.body.classList.remove('menu-open');
  }, [isMobileMenuOpen]);

  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="site-shell">
      <div className="ambient-grid" />

      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="container nav-container">
          <Link to="/" className="brand" onClick={closeMenu}>
            <span className="brand-mark" style={{ background: 'transparent', border: 'none' }}>
              <img src="https://vanigan.digital/vaniganlogo.png" alt="Vanigan Logo" style={{ width: 38, height: 38, objectFit: 'contain' }} />
            </span>
            <span>Vanigan</span>
            <span className="brand-accent">App</span>
          </Link>

          <div className={`nav-links ${isMobileMenuOpen ? 'open' : ''}`}>
            <a href="#features" onClick={closeMenu}>Features</a>
            <a href="#workflow" onClick={closeMenu}>How it works</a>
            <a href="#pricing" onClick={closeMenu}>Pricing</a>
            <button className="btn btn-primary nav-cta" onClick={() => window.open(whatsappUrl, '_blank', 'noopener,noreferrer')}>
              <MessageCircle size={18} />
              Connect
            </button>
          </div>

          <button
            className="mobile-toggle"
            type="button"
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen((value) => !value)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      <main>
        <section className="hero">
          <div className="hero-backdrop" />
          <HeroMotion />
          <div className="container hero-grid">
            <div className="hero-content">
              <Reveal>
                <div className="status-pill">
                  <span className="status-dot" />
                  Live on WhatsApp Cloud API
                </div>
              </Reveal>

              <Reveal delay={80}>
                <h1>
                  Vanigan business discovery, built inside WhatsApp.
                </h1>
              </Reveal>

              <Reveal delay={160}>
                <p className="hero-copy">
                  Connect local businesses, members, organizers, news, maps, gallery media, and subscription flows through one fast WhatsApp assistant.
                </p>
              </Reveal>

              <Reveal delay={240}>
                <div className="hero-actions">
                  <button className="btn btn-primary" onClick={() => window.open(whatsappUrl, '_blank', 'noopener,noreferrer')}>
                    Try WhatsApp demo
                    <ArrowRight size={18} />
                  </button>
                </div>
              </Reveal>

              <Reveal delay={320}>
                <div className="hero-stats">
                  {stats.map((item) => (
                    <div key={item.label}>
                      <strong>{item.value}</strong>
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>

            <Reveal delay={200} className="hero-visual">
              <PhonePreview />
            </Reveal>
          </div>
        </section>

        <PageSection id="features" className="features section-band">
          <div className="container">
            <SectionHeading
              eyebrow="Product modules"
              title="Everything your community directory needs"
              desc="The experience is organized around real user tasks: discover, verify, connect, promote, and manage."
            />
            <div className="features-grid">
              {features.map((item, index) => (
                <FeatureCard item={item} index={index} key={item.title} />
              ))}
            </div>
          </div>
        </PageSection>

        <PageSection id="workflow" className="workflow section-band section-contrast">
          <div className="container workflow-grid">
            <div>
              <SectionHeading
                eyebrow="Animated flow"
                title="From first message to useful lead"
                desc="Every step is designed to feel simple for WhatsApp users and measurable for admins."
              />
            </div>
            <div className="timeline">
              {workflow.map((item, index) => {
                const Icon = item.icon;
                return (
                  <Reveal delay={index * 150} key={item.title}>
                    <motion.div 
                      whileHover={{ x: 10, backgroundColor: "rgba(255, 255, 255, 0.05)" }}
                      transition={{ type: "spring", bounce: 0.3 }}
                      className="timeline-item motion-card"
                    >
                      <div className="timeline-icon">
                        <Icon size={22} />
                      </div>
                      <div>
                        <span>Step {index + 1}</span>
                        <h3>{item.title}</h3>
                        <p>{item.desc}</p>
                      </div>
                      <ChevronRight size={20} className="timeline-arrow" />
                    </motion.div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </PageSection>

        <PageSection id="pricing" className="pricing section-band">
          <div className="container">
            <SectionHeading
              eyebrow="Subscription plans"
              title="Simple plans for local business growth"
              desc="Keep onboarding clear, affordable, and easy to explain inside WhatsApp."
            />
            <div className="pricing-grid">
              {pricing.map((plan, index) => (
                <Reveal delay={index * 150} key={plan.title} className="h-full">
                  <motion.div 
                    whileHover={{ y: -10, scale: 1.02 }}
                    transition={{ type: "spring", bounce: 0.4 }}
                    className={`pricing-card motion-card ${plan.popular ? 'popular' : ''}`}
                    style={{ height: '100%' }}
                  >
                    {plan.popular && <div className="popular-badge">Best value</div>}
                    <h3>{plan.title}</h3>
                    <div className="price">
                      {plan.price}
                      <span>{plan.period}</span>
                    </div>
                    <ul className="pricing-features">
                      {plan.features.map((feature) => (
                        <li key={feature}>
                          <CheckCircle2 size={18} />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <motion.button 
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className={plan.popular ? 'btn btn-primary btn-full' : 'btn btn-secondary btn-full'}
                    >
                      Subscribe via WhatsApp
                    </motion.button>
                  </motion.div>
                </Reveal>
              ))}
            </div>
          </div>
        </PageSection>

        <PageSection id="cta-strip" className="cta-strip">
          <Reveal className="container cta-inner">
            <div>
              <BadgeCheck size={28} />
              <h2>Ready to make Vanigan searchable from every phone?</h2>
            </div>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn btn-primary" 
              onClick={() => window.open(whatsappUrl, '_blank', 'noopener,noreferrer')}
            >
              Launch chat
              <ArrowRight size={18} />
            </motion.button>
          </Reveal>
        </PageSection>
      </main>

      <footer className="footer">
        <Reveal className="container footer-inner">
          <Link to="/" className="brand">
            <span className="brand-mark" style={{ background: 'transparent', border: 'none' }}>
              <img src="https://vanigan.digital/vaniganlogo.png" alt="Vanigan Logo" style={{ width: 32, height: 32, objectFit: 'contain' }} />
            </span>
            <span>Vanigan</span>
            <span className="brand-accent">App</span>
          </Link>
          <p>Copyright 2026 Vanigan Network. All rights reserved.</p>
          <div className="footer-links">
            <a href="#features">Features</a>
            <a href="#workflow">How it works</a>
            <a href="#pricing">Pricing</a>
          </div>
        </Reveal>
      </footer>
    </div>
  );
}

export default Landing;
