import React, { useState, useEffect } from 'react';
import { Bot, MessageSquare, Briefcase, MapPin, Users, Newspaper, Image as ImageIcon, ArrowRight, CheckCircle2, Menu, X, Smartphone } from 'lucide-react';
import './index.css';

function App() {
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: <Briefcase size={28} />,
      title: 'Business Directory',
      desc: 'Browse categorized retail, manufacturing, services, and more across your district.'
    },
    {
      icon: <Users size={28} />,
      title: 'Member & Organizer Access',
      desc: 'Find people by district and assembly, view contact details and business roles seamlessly.'
    },
    {
      icon: <MapPin size={28} />,
      title: 'Location Services',
      desc: 'Get precise Google Maps links for businesses directly within your WhatsApp chat.'
    },
    {
      icon: <Newspaper size={28} />,
      title: 'Local News Updates',
      desc: 'Stay informed on the latest business meetings, conferences, and startup programs.'
    },
    {
      icon: <ImageIcon size={28} />,
      title: 'Rich Media Gallery',
      desc: 'Upload and view business gallery photos straight through WhatsApp.'
    },
    {
      icon: <MessageSquare size={28} />,
      title: 'Instant Chat Flow',
      desc: 'Navigation is as simple as sending a number. Intuitive menus guide you anywhere.'
    }
  ];

  const pricing = [
    {
      title: 'Monthly Plan',
      price: '₹199',
      period: '/month',
      features: ['Business Listing', 'Priority Visibility', 'Gallery Images', 'Contact Access']
    },
    {
      title: 'Yearly Plan',
      price: '₹1499',
      period: '/year',
      popular: true,
      features: ['All Monthly Benefits', 'Featured Listing', 'Business Promotion', 'Priority Support']
    },
    {
      title: 'Lifetime Plan',
      price: '₹4999',
      period: 'One Time',
      features: ['Lifetime Business Listing', 'Premium Visibility', 'Unlimited Photos', 'Dedicated 24/7 Support']
    }
  ];

  return (
    <>
      <div className="bg-gradient"></div>

      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="container nav-container">
          <div className="logo">
            <Bot size={32} className="logo-icon" />
            Vanigan<span className="text-gradient">App</span>
          </div>

          <div className="nav-links desktop-only">
            <a href="#features">Features</a>
            <a href="#demo">How it Works</a>
            <a href="#pricing">Pricing</a>
          </div>

          <div className="desktop-only">
            <button className="btn btn-primary">Connect WhatsApp</button>
          </div>
          
          <div className="mobile-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-content">
            <div className="badge-live">
              <span className="dot"></span>
              Live on WhatsApp Cloud API
            </div>
            <h1>The Ultimate<br /><span className="text-gradient">Business Discovery</span><br />Bot for Vanigan</h1>
            <p>Connect, discover, and grow. Access your district's business directory, members list, and latest news entirely through an intelligent WhatsApp assistant.</p>
            <div className="hero-actions">
              <button className="btn btn-primary" onClick={() => window.open('https://api.whatsapp.com/send?phone=YOUR_NUMBER&text=Hi', '_blank')}>
                Try Demo <ArrowRight size={18} />
              </button>
              <button className="btn btn-outline">
                <Smartphone size={18} /> View Features
              </button>
            </div>
          </div>

          <div className="hero-image">
            <div className="mockup-container">
              <div className="phone-mockup">
                <div className="phone-notch"></div>
                <div className="chat-app">
                  <div className="chat-header">
                    <div className="bot-avatar"><Bot size={24} color="white"/></div>
                    <div>
                      <h4 style={{ fontSize: '1rem', color: 'white', lineHeight: 1 }}>Vanigan Assistant</h4>
                      <span style={{ fontSize: '0.75rem', color: '#10B981' }}>Online</span>
                    </div>
                  </div>
                  
                  <div className="chat-body">
                    <div className="bubble bubble-sent">Hi</div>
                    <div className="bubble bubble-received" style={{ animation: 'fadeIn 0.5s ease' }}>
                      <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>Welcome to Vanigan App</p>
                      <p style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>Discover Businesses, Members, and Organizers across your district.</p>
                      
                      <div className="menu-list">
                        <div className="menu-item">1. Business List</div>
                        <div className="menu-item">2. Organizer List</div>
                        <div className="menu-item">3. Members List</div>
                        <div className="menu-item">4. Add Business</div>
                        <div className="menu-item">5. Subscription Plans</div>
                        <div className="menu-item">6. News</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <div className="container">
          <h2>Powerful Features Built-In</h2>
          <div className="features-grid">
            {features.map((item, i) => (
              <div key={i} className="feature-card" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="feature-icon">{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="pricing">
        <div className="container">
          <h2>Subscription Plans</h2>
          <p className="section-desc">
            Choose the perfect plan to grow your business presence in your district. Upgrade your visibility and access premium networking features instantly.
          </p>
          
          <div className="pricing-grid">
            {pricing.map((plan, i) => (
              <div key={i} className={`pricing-card ${plan.popular ? 'popular' : ''}`} style={{ animationDelay: `${i * 0.2}s` }}>
                {plan.popular && <div className="popular-badge">Most Popular</div>}
                
                <h3 className={plan.popular ? 'text-primary' : ''}>{plan.title}</h3>
                <div className="price">{plan.price}<span>{plan.period}</span></div>
                
                <ul className="pricing-features">
                  {plan.features.map((feature, j) => (
                    <li key={j}>
                      <CheckCircle2 size={18} color="var(--secondary)" /> {feature}
                    </li>
                  ))}
                </ul>
                
                <button className={`btn ${plan.popular ? 'btn-primary' : 'btn-outline'} btn-full`}>
                  Subscribe via WhatsApp
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer>
        <div className="container">
          <div className="footer-logo">
            <Bot size={24} className="logo-icon" />
            <span className="footer-logo-text">VaniganApp</span>
          </div>
          <p>© 2026 Vanigan Network. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}

export default App;
