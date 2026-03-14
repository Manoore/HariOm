import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Star, Calendar, ShoppingBag, Sun, ChevronRight, Users, Award, Clock, 
  ArrowRight, Sparkles, Check, Play, Quote, MapPin, Phone, Mail,
  Facebook, Twitter, Instagram, Youtube, ChevronDown, Menu, X
} from 'lucide-react';
import api from '../lib/api';

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

export default function LandingPage({ onGetStarted }) {
  const [priests, setPriests] = useState([]);
  const [products, setProducts] = useState([]);
  const [festivals, setFestivals] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [priestsRes, productsRes, festivalsRes] = await Promise.all([
        api.get('/api/priests?limit=3'),
        api.get('/api/products?limit=4'),
        api.get('/api/festivals')
      ]);
      setPriests(priestsRes.data.priests || []);
      setProducts(productsRes.data.products || []);
      setFestivals((festivalsRes.data.festivals || []).slice(0, 4));
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 lg:h-20">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <ellipse cx="50" cy="85" rx="30" ry="8" fill="#B8860B" />
                  <path d="M30 85 Q30 70 35 60 L65 60 Q70 70 70 85" fill="#FFD700" />
                  <ellipse cx="50" cy="60" rx="18" ry="6" fill="#FFD700" />
                  <path d="M50 55 Q45 40 50 25 Q55 40 50 55" fill="#FF9933" />
                </svg>
              </div>
              <span className="font-cinzel text-2xl font-bold text-maroon">DIVINE</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              <a href="#features" className="text-gray-700 hover:text-saffron transition-colors font-medium">Features</a>
              <a href="#services" className="text-gray-700 hover:text-saffron transition-colors font-medium">Services</a>
              <a href="#priests" className="text-gray-700 hover:text-saffron transition-colors font-medium">Priests</a>
              <a href="#marketplace" className="text-gray-700 hover:text-saffron transition-colors font-medium">Marketplace</a>
              <a href="#contact" className="text-gray-700 hover:text-saffron transition-colors font-medium">Contact</a>
            </div>

            {/* CTA Buttons */}
            <div className="hidden lg:flex items-center gap-4">
              <button onClick={() => onGetStarted('login')} className="text-maroon font-medium hover:text-saffron transition-colors">
                Login
              </button>
              <button onClick={() => onGetStarted('register')} className="bg-saffron hover:bg-saffron-dark text-white px-6 py-2.5 rounded-full font-medium transition-colors">
                Get Started
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-2">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:hidden bg-white border-t border-orange-100 px-4 py-6"
          >
            <div className="space-y-4">
              <a href="#features" className="block text-gray-700 font-medium">Features</a>
              <a href="#services" className="block text-gray-700 font-medium">Services</a>
              <a href="#priests" className="block text-gray-700 font-medium">Priests</a>
              <a href="#marketplace" className="block text-gray-700 font-medium">Marketplace</a>
              <div className="pt-4 space-y-3">
                <button onClick={() => onGetStarted('login')} className="w-full border-2 border-maroon text-maroon py-3 rounded-full font-medium">
                  Login
                </button>
                <button onClick={() => onGetStarted('register')} className="w-full bg-saffron text-white py-3 rounded-full font-medium">
                  Get Started
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1545126898-06fae8e63289?w=1920)' }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-maroon/90 via-maroon/80 to-maroon/60"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
                <Sparkles className="w-4 h-4 text-gold" />
                <span className="text-white/90 text-sm">Your Complete Spiritual Ecosystem</span>
              </div>
              
              <h1 className="font-cinzel text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Connect with the <span className="text-gold">Divine</span> from Anywhere
              </h1>
              
              <p className="text-lg text-white/80 mb-8 max-w-xl">
                Book verified priests for poojas, explore your horoscope, shop for sacred items, 
                and embrace Hindu traditions — all in one platform designed for the modern devotee.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => onGetStarted('register')}
                  className="bg-gold hover:bg-gold-dark text-maroon px-8 py-4 rounded-full font-semibold inline-flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl"
                >
                  Start Your Journey <ArrowRight className="w-5 h-5" />
                </button>
                <a 
                  href="#how-it-works"
                  className="border-2 border-white/50 text-white hover:bg-white/10 px-8 py-4 rounded-full font-medium inline-flex items-center justify-center gap-2 transition-all"
                >
                  <Play className="w-5 h-5" /> See How It Works
                </a>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-white/20">
                <div>
                  <p className="text-3xl font-bold text-gold">500+</p>
                  <p className="text-white/70 text-sm">Verified Priests</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gold">10K+</p>
                  <p className="text-white/70 text-sm">Poojas Completed</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gold">50K+</p>
                  <p className="text-white/70 text-sm">Happy Devotees</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="hidden lg:block"
            >
              {/* App Preview Mockup */}
              <div className="relative">
                <div className="w-72 h-[580px] bg-gray-900 rounded-[3rem] p-3 mx-auto shadow-2xl">
                  <div className="w-full h-full bg-cream rounded-[2.5rem] overflow-hidden">
                    <div className="p-4">
                      <p className="text-gray-500 text-xs">Namaste,</p>
                      <p className="font-cinzel text-lg font-bold text-maroon">Devotee</p>
                      <div className="grid grid-cols-4 gap-2 mt-4">
                        {['🙏', '✨', '🛒', '🛕'].map((icon, i) => (
                          <div key={i} className="bg-white rounded-xl p-3 text-center shadow-sm">
                            <span className="text-lg">{icon}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 bg-gradient-to-r from-saffron to-gold rounded-xl p-3 text-white">
                        <p className="text-xs opacity-80">Next Festival</p>
                        <p className="font-semibold text-sm">Maha Shivaratri</p>
                      </div>
                      <div className="mt-3 bg-white rounded-xl p-3 shadow-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 bg-saffron rounded-full flex items-center justify-center text-white font-bold">P</div>
                          <div>
                            <p className="font-semibold text-sm text-gray-800">Pandit Sharma</p>
                            <p className="text-xs text-gray-500">Vedic Rituals</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Floating elements */}
                <div className="absolute -left-8 top-20 bg-white rounded-2xl p-4 shadow-xl animate-float">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-gold fill-gold" />
                    <span className="font-semibold text-gray-800">4.9 Rating</span>
                  </div>
                </div>
                <div className="absolute -right-8 bottom-32 bg-white rounded-2xl p-4 shadow-xl animate-float" style={{animationDelay: '1s'}}>
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500" />
                    <span className="font-semibold text-gray-800">Verified Priests</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <ChevronDown className="w-8 h-8 text-white/50" />
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-saffron font-medium">WHY CHOOSE DIVINE</span>
            <h2 className="font-cinzel text-3xl md:text-4xl font-bold text-maroon mt-2 mb-4">
              Everything You Need for Your Spiritual Journey
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              From booking priests to checking your daily horoscope, we've brought all spiritual services together in one beautiful, easy-to-use platform.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { 
                icon: Users, 
                title: 'Verified Priests', 
                desc: 'All priests are thoroughly verified with experience validation and background checks.',
                color: 'bg-saffron'
              },
              { 
                icon: Sun, 
                title: 'Personalized Astrology', 
                desc: 'Get daily horoscopes, birth chart analysis, and personalized cosmic insights.',
                color: 'bg-indigo-500'
              },
              { 
                icon: ShoppingBag, 
                title: 'Authentic Products', 
                desc: 'Shop quality pooja items, idols, and spiritual products from trusted sellers.',
                color: 'bg-gold-dark'
              },
              { 
                icon: Calendar, 
                title: 'Festival Reminders', 
                desc: 'Never miss important festivals, muhurtas, and auspicious occasions.',
                color: 'bg-maroon'
              },
            ].map((feature, index) => (
              <motion.div 
                key={index}
                className="text-center p-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className={`${feature.color} w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-cinzel text-xl font-semibold text-maroon mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-24 bg-gradient-to-b from-cream to-parchment">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-saffron font-medium">OUR SERVICES</span>
              <h2 className="font-cinzel text-3xl md:text-4xl font-bold text-maroon mt-2 mb-6">
                Complete Spiritual Services at Your Fingertips
              </h2>
              <p className="text-gray-600 mb-8">
                Whether you're performing a Griha Pravesh, Satyanarayana Pooja, or seeking astrological guidance, 
                our platform connects you with the right services and experts.
              </p>

              <div className="space-y-4">
                {[
                  { title: 'Pooja Services', desc: 'Book priests for all types of Hindu rituals and ceremonies' },
                  { title: 'Online Consultations', desc: 'Connect with priests and astrologers via video call' },
                  { title: 'Vedic Learning', desc: 'Learn mantras, shlokas, and spiritual practices' },
                  { title: 'Pooja Kit Delivery', desc: 'Get all required items delivered to your doorstep' },
                ].map((service, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-6 h-6 bg-saffron/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <Check className="w-4 h-4 text-saffron" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">{service.title}</h4>
                      <p className="text-gray-600 text-sm">{service.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => onGetStarted('register')}
                className="mt-8 bg-saffron hover:bg-saffron-dark text-white px-8 py-4 rounded-full font-semibold inline-flex items-center gap-2 transition-all"
              >
                Explore All Services <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-4"
            >
              {[
                { title: 'Satyanarayana Pooja', price: '₹2,100', duration: '2 hours', image: '🙏' },
                { title: 'Griha Pravesh', price: '₹5,100', duration: '3 hours', image: '🏠' },
                { title: 'Navagraha Shanti', price: '₹4,500', duration: '2.5 hours', image: '✨' },
                { title: 'Rudrabhishekam', price: '₹3,100', duration: '1.5 hours', image: '🔱' },
              ].map((service, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-orange-100 hover:shadow-md transition-shadow">
                  <span className="text-4xl block mb-3">{service.image}</span>
                  <h4 className="font-semibold text-gray-800 mb-1">{service.title}</h4>
                  <p className="text-saffron font-bold text-lg mb-1">{service.price}</p>
                  <p className="text-gray-500 text-sm flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {service.duration}
                  </p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-maroon">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-gold font-medium">HOW IT WORKS</span>
            <h2 className="font-cinzel text-3xl md:text-4xl font-bold text-white mt-2 mb-4">
              Simple Steps to Spiritual Services
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Create Account', desc: 'Sign up in seconds with your email or phone number' },
              { step: '02', title: 'Choose Service', desc: 'Browse priests, select pooja type, or shop products' },
              { step: '03', title: 'Book & Pay', desc: 'Select date, time and complete secure payment' },
              { step: '04', title: 'Get Blessed', desc: 'Attend pooja in person or join online video session' },
            ].map((item, i) => (
              <motion.div 
                key={i}
                className="text-center relative"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="text-6xl font-bold text-white/10 font-cinzel mb-4">{item.step}</div>
                <h4 className="font-cinzel text-xl font-semibold text-white mb-2">{item.title}</h4>
                <p className="text-white/70 text-sm">{item.desc}</p>
                {i < 3 && (
                  <div className="hidden md:block absolute top-8 right-0 translate-x-1/2">
                    <ArrowRight className="w-6 h-6 text-white/30" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Priests */}
      <section id="priests" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-saffron font-medium">MEET OUR PRIESTS</span>
            <h2 className="font-cinzel text-3xl md:text-4xl font-bold text-maroon mt-2 mb-4">
              Verified & Experienced Pandits
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our priests are carefully verified with years of experience in Vedic rituals, ensuring authentic and meaningful ceremonies.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {priests.map((priest, index) => (
              <motion.div 
                key={priest.id}
                className="bg-cream rounded-2xl p-6 border border-orange-100"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-saffron to-gold rounded-full flex items-center justify-center text-white text-3xl font-cinzel">
                    {priest.user_name?.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-cinzel font-semibold text-maroon">{priest.user_name}</h4>
                      {priest.is_verified && <Award className="w-4 h-4 text-green-500" />}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                      <Star className="w-4 h-4 text-gold fill-gold" />
                      <span>{priest.rating} ({priest.total_reviews} reviews)</span>
                    </div>
                    <p className="text-sm text-gray-500">{priest.experience_years} years experience</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {priest.specializations?.slice(0, 3).map((spec, i) => (
                    <span key={i} className="bg-orange-100 text-saffron-dark text-xs px-3 py-1 rounded-full">
                      {spec}
                    </span>
                  ))}
                </div>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{priest.bio}</p>
                
                <button 
                  onClick={() => onGetStarted('register')}
                  className="w-full bg-saffron hover:bg-saffron-dark text-white py-3 rounded-full font-medium transition-colors"
                >
                  Book Now
                </button>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <button 
              onClick={() => onGetStarted('register')}
              className="border-2 border-maroon text-maroon hover:bg-maroon hover:text-white px-8 py-3 rounded-full font-medium transition-colors inline-flex items-center gap-2"
            >
              View All Priests <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Marketplace Preview */}
      <section id="marketplace" className="py-24 bg-gradient-to-b from-cream to-parchment">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-saffron font-medium">POOJA MARKETPLACE</span>
            <h2 className="font-cinzel text-3xl md:text-4xl font-bold text-maroon mt-2 mb-4">
              Authentic Pooja Essentials
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Shop quality pooja items, idols, incense, and spiritual products from verified sellers.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {products.map((product, index) => (
              <motion.div 
                key={product.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-orange-100 hover:shadow-md transition-shadow"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="aspect-square bg-orange-50 rounded-xl mb-3 flex items-center justify-center overflow-hidden">
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <ShoppingBag className="w-12 h-12 text-saffron/30" />
                  )}
                </div>
                <h4 className="font-medium text-gray-800 text-sm mb-1 line-clamp-2">{product.name}</h4>
                <div className="flex items-center gap-1 mb-2">
                  <Star className="w-3 h-3 text-gold fill-gold" />
                  <span className="text-xs text-gray-500">{product.rating}</span>
                </div>
                <p className="text-saffron font-bold">₹{product.price}</p>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <button 
              onClick={() => onGetStarted('register')}
              className="bg-saffron hover:bg-saffron-dark text-white px-8 py-3 rounded-full font-medium transition-colors inline-flex items-center gap-2"
            >
              Browse All Products <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Upcoming Festivals */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-saffron font-medium">FESTIVAL CALENDAR</span>
            <h2 className="font-cinzel text-3xl md:text-4xl font-bold text-maroon mt-2 mb-4">
              Upcoming Hindu Festivals
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-6">
            {festivals.map((festival, index) => (
              <motion.div 
                key={festival.id}
                className="bg-gradient-to-br from-saffron to-gold rounded-2xl p-6 text-white"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Calendar className="w-8 h-8 mb-4 opacity-80" />
                <h4 className="font-cinzel text-lg font-semibold mb-1">{festival.name}</h4>
                <p className="text-white/80 text-sm mb-2">{festival.date}</p>
                <p className="text-white/70 text-xs line-clamp-2">{festival.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-saffron font-medium">TESTIMONIALS</span>
            <h2 className="font-cinzel text-3xl md:text-4xl font-bold text-maroon mt-2 mb-4">
              What Our Devotees Say
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: 'Priya Sharma', location: 'Mumbai', text: 'Divine App made it so easy to book a pandit for my house warming ceremony. The priest was knowledgeable and the entire process was seamless.' },
              { name: 'Rajesh Kumar', location: 'Delhi', text: 'I\'ve been using Divine for daily horoscopes and pooja bookings. The astrology section is incredibly accurate and the priests are all verified.' },
              { name: 'Anita Patel', location: 'USA', text: 'Living abroad, I thought I\'d miss out on proper poojas. Divine connected me with priests who conducted online ceremonies beautifully.' },
            ].map((testimonial, i) => (
              <motion.div 
                key={i}
                className="bg-white rounded-2xl p-6 shadow-sm border border-orange-100"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Quote className="w-10 h-10 text-saffron/20 mb-4" />
                <p className="text-gray-600 mb-6">{testimonial.text}</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-saffron to-gold rounded-full flex items-center justify-center text-white font-semibold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.location}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-maroon">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-cinzel text-3xl md:text-4xl font-bold text-white mb-4">
              Begin Your Spiritual Journey Today
            </h2>
            <p className="text-white/80 mb-8 max-w-2xl mx-auto">
              Join thousands of devotees who trust Divine App for their spiritual needs. 
              Create your free account and experience the divine difference.
            </p>
            <button 
              onClick={() => onGetStarted('register')}
              className="bg-gold hover:bg-gold-dark text-maroon px-10 py-4 rounded-full font-semibold inline-flex items-center gap-2 transition-all shadow-lg hover:shadow-xl text-lg"
            >
              Create Free Account <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <ellipse cx="50" cy="85" rx="30" ry="8" fill="#B8860B" />
                    <path d="M30 85 Q30 70 35 60 L65 60 Q70 70 70 85" fill="#FFD700" />
                    <ellipse cx="50" cy="60" rx="18" ry="6" fill="#FFD700" />
                    <path d="M50 55 Q45 40 50 25 Q55 40 50 55" fill="#FF9933" />
                  </svg>
                </div>
                <span className="font-cinzel text-xl font-bold">DIVINE</span>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Your complete spiritual ecosystem for Hindu rituals, astrology, and sacred services.
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-gray-400 hover:text-white"><Facebook className="w-5 h-5" /></a>
                <a href="#" className="text-gray-400 hover:text-white"><Twitter className="w-5 h-5" /></a>
                <a href="#" className="text-gray-400 hover:text-white"><Instagram className="w-5 h-5" /></a>
                <a href="#" className="text-gray-400 hover:text-white"><Youtube className="w-5 h-5" /></a>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">Book Priests</a></li>
                <li><a href="#" className="hover:text-white">Astrology</a></li>
                <li><a href="#" className="hover:text-white">Pooja Store</a></li>
                <li><a href="#" className="hover:text-white">Festival Calendar</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">About Us</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  support@divineapp.com
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  +91 98765 43210
                </li>
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5" />
                  Mumbai, Maharashtra, India
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm text-gray-500">
            <p>© 2025 Divine App. All rights reserved. Made with 🙏 in India</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
