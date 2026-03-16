import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Star, Clock, MapPin, Phone, Award, Calendar, ChevronLeft,
  Languages, CheckCircle, Loader2, ArrowRight
} from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Toaster, toast } from 'sonner';
import AddressAutocomplete from '../components/AddressAutocomplete';

export function PriestsListPage() {
  const [priests, setPriests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    specialization: '',
    language: ''
  });

  useEffect(() => {
    fetchPriests();
  }, [filters]);

  const fetchPriests = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.specialization) params.append('specialization', filters.specialization);
      if (filters.language) params.append('language', filters.language);
      
      const res = await api.get(`/api/priests?${params.toString()}`);
      setPriests(res.data.priests || []);
    } catch (error) {
      console.error('Error fetching priests:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-24 md:pb-12 bg-gradient-to-b from-cream to-parchment">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-cinzel text-3xl md:text-4xl font-bold text-maroon mb-2">
            Book a Priest
          </h1>
          <p className="text-gray-600">
            Connect with verified pandits for poojas, ceremonies, and spiritual guidance
          </p>
        </motion.div>

        {/* Filters */}
        <div className="card p-4 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Specialization</label>
              <select
                value={filters.specialization}
                onChange={(e) => setFilters({ ...filters, specialization: e.target.value })}
                className="input-field"
                data-testid="filter-specialization"
              >
                <option value="">All Specializations</option>
                <option value="Vedic Rituals">Vedic Rituals</option>
                <option value="Satyanarayana">Satyanarayana Pooja</option>
                <option value="Griha Pravesh">Griha Pravesh</option>
                <option value="Homam">Homam</option>
                <option value="Navagraha">Navagraha Pooja</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
              <select
                value={filters.language}
                onChange={(e) => setFilters({ ...filters, language: e.target.value })}
                className="input-field"
                data-testid="filter-language"
              >
                <option value="">All Languages</option>
                <option value="Hindi">Hindi</option>
                <option value="Sanskrit">Sanskrit</option>
                <option value="Tamil">Tamil</option>
                <option value="Telugu">Telugu</option>
                <option value="English">English</option>
              </select>
            </div>
          </div>
        </div>

        {/* Priests Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-saffron animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {priests.map((priest, index) => (
              <motion.div 
                key={priest.id}
                className="card p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-saffron to-gold rounded-full flex items-center justify-center text-white text-2xl font-cinzel flex-shrink-0">
                    {priest.user_name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-cinzel font-semibold text-maroon truncate">{priest.user_name}</h3>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Star className="w-4 h-4 text-gold fill-gold" />
                      <span>{priest.rating}</span>
                      <span className="text-gray-400">({priest.total_reviews} reviews)</span>
                    </div>
                  </div>
                  {priest.is_verified && (
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full flex items-center gap-1 flex-shrink-0">
                      <Award className="w-3 h-3" /> Verified
                    </span>
                  )}
                </div>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{priest.bio}</p>
                
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
                    {priest.experience_years} years
                  </span>
                  <span className="flex items-center gap-1">
                    <Languages className="w-4 h-4" />
                    {priest.languages?.slice(0, 2).join(', ')}
                  </span>
                </div>
                
                <Link 
                  to={`/priests/${priest.id}`} 
                  className="btn-primary w-full text-center block"
                  data-testid={`view-priest-${priest.id}`}
                >
                  View Services & Book
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {!loading && priests.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500 mb-4">No priests found matching your criteria</p>
            <button 
              onClick={() => setFilters({ specialization: '', language: '' })}
              className="btn-secondary"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function PriestDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [priest, setPriest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingType, setBookingType] = useState('online');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    fetchPriest();
  }, [id]);

  const fetchPriest = async () => {
    try {
      const res = await api.get(`/api/priests/${id}`);
      setPriest(res.data);
    } catch (error) {
      console.error('Error fetching priest:', error);
      toast.error('Priest not found');
      navigate('/priests');
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!user) {
      toast.error('Please login to book');
      navigate('/login');
      return;
    }
    if (!selectedService || !bookingDate) {
      toast.error('Please select a service and date');
      return;
    }
    if (bookingType === 'home_visit' && !address) {
      toast.error('Please provide your address for home visit');
      return;
    }

    setBookingLoading(true);
    try {
      const res = await api.post('/api/bookings', {
        priest_id: id,
        service_name: selectedService.name,
        booking_date: new Date(bookingDate).toISOString(),
        booking_type: bookingType,
        address: bookingType === 'home_visit' ? address : null,
        notes
      });
      toast.success('Booking created! Proceed to payment.');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Booking failed');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-saffron animate-spin" />
      </div>
    );
  }

  if (!priest) return null;

  return (
    <div className="min-h-screen pt-20 pb-24 md:pb-12 bg-gradient-to-b from-cream to-parchment">
      <Toaster position="top-center" richColors />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <button 
          onClick={() => navigate('/priests')}
          className="flex items-center gap-2 text-gray-600 hover:text-maroon mb-6"
          data-testid="back-to-priests"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to Priests
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Priest Info */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div 
              className="card p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-start gap-6">
                <div className="w-24 h-24 bg-gradient-to-br from-saffron to-gold rounded-full flex items-center justify-center text-white text-4xl font-cinzel flex-shrink-0">
                  {priest.user_name?.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="font-cinzel text-2xl font-bold text-maroon">{priest.user_name}</h1>
                    {priest.is_verified && (
                      <span className="bg-green-100 text-green-700 text-sm px-3 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" /> Verified
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-gold fill-gold" />
                      {priest.rating} ({priest.total_reviews} reviews)
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {priest.experience_years} years experience
                    </span>
                  </div>
                  <p className="text-gray-600">{priest.bio}</p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-orange-100">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Specializations</h4>
                    <div className="flex flex-wrap gap-2">
                      {priest.specializations?.map((spec, i) => (
                        <span key={i} className="bg-orange-50 text-saffron-dark text-sm px-3 py-1 rounded-full">
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Languages</h4>
                    <div className="flex flex-wrap gap-2">
                      {priest.languages?.map((lang, i) => (
                        <span key={i} className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full">
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Services */}
            <motion.div 
              className="card p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h2 className="font-cinzel text-xl font-bold text-maroon mb-4">Services Offered</h2>
              <div className="space-y-4">
                {priest.services?.map((service, index) => (
                  <div 
                    key={index}
                    onClick={() => setSelectedService(service)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedService?.name === service.name 
                        ? 'border-saffron bg-orange-50' 
                        : 'border-gray-100 hover:border-orange-200'
                    }`}
                    data-testid={`service-${index}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-800">{service.name}</h3>
                      <span className="text-saffron font-bold text-lg">₹{service.price}</span>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{service.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {service.duration_minutes} mins
                      </span>
                      <span className="bg-gray-100 px-2 py-0.5 rounded-full text-xs">
                        {service.category}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Booking Form */}
          <div className="lg:col-span-1">
            <motion.div 
              className="card p-6 sticky top-24"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h2 className="font-cinzel text-xl font-bold text-maroon mb-4">Book Service</h2>
              
              {selectedService ? (
                <div className="bg-orange-50 p-4 rounded-xl mb-4">
                  <p className="text-sm text-gray-600">Selected Service</p>
                  <p className="font-semibold text-maroon">{selectedService.name}</p>
                  <p className="text-saffron font-bold">₹{selectedService.price}</p>
                </div>
              ) : (
                <p className="text-gray-500 text-sm mb-4">Please select a service from the left</p>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date & Time</label>
                  <input
                    type="datetime-local"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="input-field"
                    min={new Date().toISOString().slice(0, 16)}
                    data-testid="booking-date"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Booking Type</label>
                  <select
                    value={bookingType}
                    onChange={(e) => setBookingType(e.target.value)}
                    className="input-field"
                    data-testid="booking-type"
                  >
                    <option value="online">Online (Video Call)</option>
                    <option value="home_visit">Home Visit</option>
                  </select>
                </div>

                {bookingType === 'home_visit' && (
                  <div>
                    <AddressAutocomplete
                      label="Address"
                      value={address}
                      onChange={(value) => setAddress(value)}
                      onSelect={(placeDetails) => {
                        setAddress(placeDetails.formatted_address || placeDetails.address || address);
                      }}
                      placeholder="Search for your address..."
                      testId="booking-address"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Special Notes (Optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="input-field"
                    rows={2}
                    placeholder="Any specific requirements..."
                    data-testid="booking-notes"
                  />
                </div>

                <button
                  onClick={handleBooking}
                  disabled={!selectedService || !bookingDate || bookingLoading}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                  data-testid="confirm-booking"
                >
                  {bookingLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Confirm Booking <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
