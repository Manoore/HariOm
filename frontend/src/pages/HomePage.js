import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Star, Calendar, ShoppingBag, Sun, ChevronRight, 
  Users, Award, Clock, ArrowRight, Sparkles
} from 'lucide-react';
import api from '../lib/api';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function HomePage() {
  const [priests, setPriests] = useState([]);
  const [products, setProducts] = useState([]);
  const [festivals, setFestivals] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [priestsRes, productsRes, festivalsRes] = await Promise.all([
          api.get('/api/priests?limit=3'),
          api.get('/api/products?limit=4'),
          api.get('/api/festivals')
        ]);
        setPriests(priestsRes.data.priests || []);
        setProducts(productsRes.data.products || []);
        setFestivals((festivalsRes.data.festivals || []).slice(0, 3));
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: 'url(https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1920)',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-maroon/80 via-maroon/70 to-cream"></div>
        </div>
        
        {/* Content */}
        <motion.div 
          className="relative z-10 text-center px-4 max-w-4xl mx-auto pt-20"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div 
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Sparkles className="w-4 h-4 text-gold" />
            <span className="text-white/90 text-sm">Your Spiritual Journey Begins Here</span>
          </motion.div>
          
          <h1 className="font-cinzel text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            Connect with the <span className="text-gold">Divine</span>
          </h1>
          
          <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl mx-auto font-light">
            Book verified priests, explore your horoscope, shop for pooja essentials, 
            and embrace Hindu traditions from anywhere in the world.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/priests" className="btn-primary inline-flex items-center gap-2 text-lg" data-testid="hero-book-priest">
              Book a Priest
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/astrology" className="btn-secondary bg-white/10 border-white text-white hover:bg-white hover:text-maroon inline-flex items-center gap-2" data-testid="hero-check-horoscope">
              Check Horoscope
            </Link>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-white/50 rounded-full"></div>
          </div>
        </motion.div>
      </section>

      {/* Services Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-cream to-parchment">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            {...fadeInUp}
          >
            <h2 className="font-cinzel text-3xl md:text-4xl font-bold text-maroon mb-4">
              Sacred Services
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Everything you need for your spiritual journey, accessible at your fingertips
            </p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {[
              { icon: Users, title: 'Book Priests', desc: 'Connect with verified pandits for poojas and ceremonies', link: '/priests', color: 'bg-saffron' },
              { icon: Sun, title: 'Astrology', desc: 'Daily horoscope and personalized birth chart analysis', link: '/astrology', color: 'bg-cosmic-accent' },
              { icon: ShoppingBag, title: 'Pooja Store', desc: 'Quality pooja items delivered to your doorstep', link: '/marketplace', color: 'bg-gold-dark' },
              { icon: Calendar, title: 'Festivals', desc: 'Never miss important Hindu festivals and muhurtas', link: '/festivals', color: 'bg-maroon' },
            ].map((service, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Link to={service.link} className="card-service block h-full" data-testid={`service-card-${index}`}>
                  <div className={`${service.color} w-14 h-14 rounded-2xl flex items-center justify-center mb-4`}>
                    <service.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-cinzel text-xl font-semibold text-maroon mb-2">{service.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{service.desc}</p>
                  <span className="inline-flex items-center text-saffron font-medium text-sm">
                    Explore <ChevronRight className="w-4 h-4 ml-1" />
                  </span>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Featured Priests */}
      <section className="py-20 px-4 bg-parchment">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="font-cinzel text-3xl font-bold text-maroon mb-2">Featured Priests</h2>
              <p className="text-gray-600">Verified pandits for your spiritual needs</p>
            </div>
            <Link to="/priests" className="btn-ghost inline-flex items-center gap-1" data-testid="view-all-priests">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {priests.map((priest, index) => (
              <motion.div 
                key={priest.id}
                className="card p-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-saffron to-gold rounded-full flex items-center justify-center text-white text-2xl font-cinzel">
                    {priest.user_name?.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-cinzel font-semibold text-maroon">{priest.user_name}</h3>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Star className="w-4 h-4 text-gold fill-gold" />
                      <span>{priest.rating}</span>
                      <span className="text-gray-400">({priest.total_reviews} reviews)</span>
                    </div>
                  </div>
                  {priest.is_verified && (
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      <Award className="w-3 h-3" /> Verified
                    </span>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {priest.specializations?.slice(0, 3).map((spec, i) => (
                    <span key={i} className="bg-orange-50 text-saffron-dark text-xs px-2 py-1 rounded-full">
                      {spec}
                    </span>
                  ))}
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {priest.experience_years} years exp
                  </span>
                  <span>{priest.languages?.join(', ')}</span>
                </div>
                
                <Link 
                  to={`/priests/${priest.id}`} 
                  className="btn-primary w-full text-center block"
                  data-testid={`book-priest-${priest.id}`}
                >
                  View Services
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Festivals */}
      <section className="py-20 px-4 bg-gradient-to-b from-parchment to-cream">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="font-cinzel text-3xl font-bold text-maroon mb-2">Upcoming Festivals</h2>
              <p className="text-gray-600">Mark your calendar for these auspicious occasions</p>
            </div>
            <Link to="/festivals" className="btn-ghost inline-flex items-center gap-1" data-testid="view-all-festivals">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {festivals.map((festival, index) => (
              <motion.div 
                key={festival.id}
                className="card overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="bg-gradient-to-r from-saffron to-gold p-4">
                  <Calendar className="w-8 h-8 text-white mb-2" />
                  <h3 className="font-cinzel text-xl font-bold text-white">{festival.name}</h3>
                </div>
                <div className="p-4">
                  <p className="text-gray-600 text-sm mb-2">{festival.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-saffron font-medium">{festival.date}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      festival.importance === 'Major' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {festival.importance}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 px-4 bg-cream">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="font-cinzel text-3xl font-bold text-maroon mb-2">Pooja Essentials</h2>
              <p className="text-gray-600">Quality items for your daily worship</p>
            </div>
            <Link to="/marketplace" className="btn-ghost inline-flex items-center gap-1" data-testid="view-all-products">
              Shop All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {products.map((product, index) => (
              <motion.div 
                key={product.id}
                className="card-product"
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="aspect-square bg-gradient-to-br from-orange-50 to-cream rounded-xl mb-3 flex items-center justify-center overflow-hidden">
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <ShoppingBag className="w-12 h-12 text-saffron/30" />
                  )}
                </div>
                <h3 className="font-medium text-gray-800 text-sm mb-1 line-clamp-2">{product.name}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-saffron font-bold">₹{product.price}</span>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Star className="w-3 h-3 text-gold fill-gold" />
                    {product.rating}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-maroon">
        <div className="max-w-4xl mx-auto text-center">
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
              Register now and get access to verified priests, personalized horoscopes, and more.
            </p>
            <Link to="/register" className="btn-primary bg-gold hover:bg-gold-dark text-maroon inline-flex items-center gap-2" data-testid="cta-register">
              Create Free Account
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
