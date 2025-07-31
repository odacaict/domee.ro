import React, { useState, useEffect } from 'react';
import { ArrowLeft, Star as StarIcon, MapPin, Phone, Clock, Globe, Calendar } from 'lucide-react';
import { Button } from '../ui/Button';
import { Provider, Service } from '../../types';
import { formatPrice, formatDuration } from '../../lib/utils';
import { BookingCalendar } from './BookingCalendar';
import { providerService } from '../../services/providerService';
import { supabase } from '../../lib/supabase';

interface ProviderProfileProps {
  provider: Provider;
  onBack: () => void;
  onBookService: (service: Service) => void;
}

export const ProviderProfile: React.FC<ProviderProfileProps> = ({
  provider,
  onBack,
  onBookService,
}) => {
  const [activeTab, setActiveTab] = useState<'services' | 'gallery' | 'reviews'>('services');
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch services
        const { data: servicesData } = await supabase
          .from('services')
          .select('*')
          .eq('provider_id', provider.id)
          .eq('active', true);
        
        setServices(servicesData || []);

        // Fetch reviews
        const { data: reviewsData } = await supabase
          .from('reviews')
          .select(`
            *,
            users (name)
          `)
          .eq('provider_id', provider.id)
          .order('created_at', { ascending: false });
        
        setReviews(reviewsData || []);
      } catch (error) {
        console.error('Failed to fetch provider data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [provider.id]);

  const getWorkingHours = () => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[new Date().getDay()] as keyof typeof provider.working_hours;
    const schedule = provider.working_hours[today];
    
    if (!schedule || schedule.closed) {
      return 'Closed today';
    }
    
    return `${schedule.open} - ${schedule.close}`;
  };

  const handleSelectService = (service: Service) => {
    setSelectedService(service);
    setShowCalendar(true);
  };

  const handleConfirmBooking = async (date: Date, time: string) => {
    if (selectedService) {
      // TODO: Implement actual booking logic
      alert(`Rezervare confirmată pentru ${selectedService.name} la ${provider.salon_name} pe ${date.toLocaleDateString('ro-RO')} la ora ${time}`);
      setShowCalendar(false);
      setSelectedService(null);
    }
  };

  const handleBackFromCalendar = () => {
    setShowCalendar(false);
    setSelectedService(null);
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Astăzi';
    if (diffInDays === 1) return 'Ieri';
    if (diffInDays < 7) return `Acum ${diffInDays} zile`;
    if (diffInDays < 30) return `Acum ${Math.floor(diffInDays / 7)} săptămâni`;
    if (diffInDays < 365) return `Acum ${Math.floor(diffInDays / 30)} luni`;
    return `Acum ${Math.floor(diffInDays / 365)} ani`;
  };

  if (showCalendar && selectedService) {
    return (
      <BookingCalendar
        provider={provider}
        service={selectedService}
        onBack={handleBackFromCalendar}
        onConfirm={handleConfirmBooking}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white sticky top-0 z-10">
        <div className="flex items-center gap-4 p-4 border-b">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-bold text-lg text-slate-800 truncate">
            {provider.salon_name}
          </h1>
        </div>
      </div>

      <div className="relative">
        <img
          src={provider.images[0] || 'https://images.pexels.com/photos/1570807/pexels-photo-1570807.jpeg?auto=compress&cs=tinysrgb&w=800'}
          alt={provider.salon_name}
          className="w-full h-64 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        {provider.verified && (
          <div className="absolute top-4 right-4 bg-emerald-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
            ✓ Verified
          </div>
        )}
      </div>

      <div className="bg-white mx-4 -mt-6 rounded-2xl shadow-lg relative z-10">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">
                {provider.salon_name}
              </h2>
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-1">
                  <StarIcon size={18} className="text-amber-400 fill-current" />
                  <span className="font-bold text-slate-700">
                    {provider.rating.toFixed(1)}
                  </span>
                  <span className="text-slate-500">
                    ({provider.review_count} reviews)
                  </span>
                </div>
              </div>
              <p className="text-slate-600 leading-relaxed mb-4">
                {provider.description}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 mb-6">
            <div className="flex items-center gap-3 text-slate-600">
              <MapPin size={18} className="text-slate-400 flex-shrink-0" />
              <span className="text-sm">{provider.address}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-600">
              <Phone size={18} className="text-slate-400 flex-shrink-0" />
              <span className="text-sm">{provider.phone}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-600">
              <Clock size={18} className="text-slate-400 flex-shrink-0" />
              <span className="text-sm">Today: {getWorkingHours()}</span>
            </div>
            {provider.website && (
              <div className="flex items-center gap-3 text-slate-600">
                <Globe size={18} className="text-slate-400 flex-shrink-0" />
                <a 
                  href={provider.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-amber-600 hover:text-amber-700"
                >
                  Visit website
                </a>
              </div>
            )}
          </div>

          <div className="flex gap-2 mb-6">
            <Button
              variant="success"
              size="lg"
              className="flex-1 font-semibold"
              onClick={() => setActiveTab('services')}
            >
              <Calendar size={18} className="mr-2" />
              Book Now
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="px-6"
            >
              <MapPin size={18} />
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="bg-white mx-4 rounded-2xl shadow-sm">
          <div className="flex border-b">
            {[
              { key: 'services', label: 'Services' },
              { key: 'gallery', label: 'Gallery' },
              { key: 'reviews', label: 'Reviews' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 py-4 text-center font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'text-amber-600 border-b-2 border-amber-600'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {loading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-slate-100 rounded-lg"></div>
                ))}
              </div>
            ) : (
              <>
                {activeTab === 'services' && (
                  <div className="space-y-4">
                    {services.length > 0 ? (
                      services.map((service) => (
                        <div
                          key={service.id}
                          className="border border-slate-200 rounded-xl p-4 hover:border-amber-300 transition-all duration-200 hover:shadow-sm"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h3 className="font-bold text-slate-800 mb-1">
                                {service.name}
                              </h3>
                              <p className="text-slate-600 text-sm mb-2 leading-relaxed">
                                {service.description}
                              </p>
                              <p className="text-slate-500 text-sm">
                                Duration: {formatDuration(service.duration)}
                              </p>
                            </div>
                            <div className="text-right ml-4">
                              <p className="font-bold text-amber-600 text-lg mb-2">
                                {formatPrice(service.price)}
                              </p>
                              <Button
                                onClick={() => handleSelectService(service)}
                                size="sm"
                                className="font-medium"
                              >
                                Select
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-slate-500 py-8">
                        Nu sunt servicii disponibile momentan.
                      </p>
                    )}
                  </div>
                )}

                {activeTab === 'gallery' && (
                  <div className="grid grid-cols-2 gap-4">
                    {provider.images.length > 0 ? (
                      provider.images.map((image, i) => (
                        <div key={i} className="aspect-square rounded-lg overflow-hidden">
                          <img
                            src={image}
                            alt={`${provider.salon_name} ${i + 1}`}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                          />
                        </div>
                      ))
                    ) : (
                      <p className="col-span-2 text-center text-slate-500 py-8">
                        Nu sunt imagini disponibile momentan.
                      </p>
                    )}
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div className="space-y-6">
                    {reviews.length > 0 ? (
                      reviews.map((review) => (
                        <div key={review.id} className="border-b border-slate-100 pb-6 last:border-b-0">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                              <span className="font-bold text-amber-600 text-sm">
                                {review.users?.name?.charAt(0) || 'U'}
                              </span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-slate-700">
                                  {review.users?.name || 'Utilizator'}
                                </span>
                                <span className="text-slate-500 text-sm">
                                  • {formatRelativeTime(review.created_at)}
                                </span>
                              </div>
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <StarIcon
                                    key={star}
                                    size={14}
                                    className={`${
                                      star <= review.rating
                                        ? 'text-amber-400 fill-current'
                                        : 'text-slate-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                          <p className="text-slate-600 text-sm mb-3 leading-relaxed">
                            {review.comment}
                          </p>
                          {review.response && (
                            <div className="bg-slate-50 rounded-lg p-3 ml-4">
                              <p className="text-slate-700 text-sm font-medium mb-1">
                                Response from {provider.salon_name}:
                              </p>
                              <p className="text-slate-600 text-sm leading-relaxed">
                                {review.response}
                              </p>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-slate-500 py-8">
                        Nu sunt recenzii încă. Fii primul care lasă o recenzie!
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="h-6"></div>
    </div>
  );
};