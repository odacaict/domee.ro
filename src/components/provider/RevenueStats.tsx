import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Users, Clock, Star as StarIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatPrice } from '../../lib/utils';

interface RevenueStatsProps {
  providerId: string;
}

interface Stats {
  revenue: {
    today: number;
    week: number;
    month: number;
    trend: number;
  };
  bookings: {
    total: number;
    completed: number;
    cancelled: number;
  };
  customers: {
    new: number;
    returning: number;
  };
  topServices: Array<{
    name: string;
    count: number;
    revenue: number;
  }>;
  occupancyRate: number;
  averageRating: number;
}

export const RevenueStats: React.FC<RevenueStatsProps> = ({ providerId }) => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month'>('week');

  useEffect(() => {
    fetchStats();
  }, [providerId, selectedPeriod]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Get date ranges
      const now = new Date();
      const startOfDay = new Date(now.setHours(0, 0, 0, 0));
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Fetch revenue data
      const { data: bookings } = await supabase
        .from('bookings')
        .select('*, services(name, price)')
        .eq('provider_id', providerId)
        .gte('created_at', startOfMonth.toISOString());

      // Calculate stats
      const todayRevenue = bookings?.filter(b => 
        new Date(b.created_at) >= startOfDay && b.status === 'completed'
      ).reduce((sum, b) => sum + b.total_price, 0) || 0;

      const weekRevenue = bookings?.filter(b => 
        new Date(b.created_at) >= startOfWeek && b.status === 'completed'
      ).reduce((sum, b) => sum + b.total_price, 0) || 0;

      const monthRevenue = bookings?.filter(b => 
        b.status === 'completed'
      ).reduce((sum, b) => sum + b.total_price, 0) || 0;

      // Calculate trend (compare to previous period)
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const { data: prevBookings } = await supabase
        .from('bookings')
        .select('total_price')
        .eq('provider_id', providerId)
        .eq('status', 'completed')
        .gte('created_at', prevMonth.toISOString())
        .lt('created_at', startOfMonth.toISOString());

      const prevRevenue = prevBookings?.reduce((sum, b) => sum + b.total_price, 0) || 0;
      const trend = prevRevenue > 0 ? ((monthRevenue - prevRevenue) / prevRevenue) * 100 : 0;

      // Booking stats
      const completed = bookings?.filter(b => b.status === 'completed').length || 0;
      const cancelled = bookings?.filter(b => b.status === 'cancelled').length || 0;

      // Customer stats
      const { data: customers } = await supabase
        .from('bookings')
        .select('user_id')
        .eq('provider_id', providerId)
        .gte('created_at', startOfMonth.toISOString());

      const uniqueCustomers = new Set(customers?.map(c => c.user_id) || []);
      const { data: returningCustomers } = await supabase
        .from('bookings')
        .select('user_id')
        .eq('provider_id', providerId)
        .lt('created_at', startOfMonth.toISOString())
        .in('user_id', Array.from(uniqueCustomers));

      const returningCount = new Set(returningCustomers?.map(c => c.user_id) || []).size;

      // Top services
      const serviceStats = bookings?.reduce((acc, booking) => {
        if (booking.status === 'completed' && booking.services) {
          const serviceName = booking.services.name;
          if (!acc[serviceName]) {
            acc[serviceName] = { name: serviceName, count: 0, revenue: 0 };
          }
          acc[serviceName].count++;
          acc[serviceName].revenue += booking.total_price;
        }
        return acc;
      }, {} as Record<string, { name: string; count: number; revenue: number }>);

      const topServices = Object.values(serviceStats || {})
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Average rating
      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('provider_id', providerId);

      const avgRating = reviews?.length 
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
        : 0;

      setStats({
        revenue: {
          today: todayRevenue,
          week: weekRevenue,
          month: monthRevenue,
          trend,
        },
        bookings: {
          total: bookings?.length || 0,
          completed,
          cancelled,
        },
        customers: {
          new: uniqueCustomers.size - returningCount,
          returning: returningCount,
        },
        topServices,
        occupancyRate: 75, // Placeholder - calculate based on working hours
        averageRating: avgRating,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-slate-200 h-32 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Revenue Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-100 rounded-lg">
              <DollarSign className="text-emerald-600" size={24} />
            </div>
            <div className={`flex items-center gap-1 text-sm ${stats.revenue.trend >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {stats.revenue.trend >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              {Math.abs(stats.revenue.trend).toFixed(1)}%
            </div>
          </div>
          <h3 className="text-sm text-slate-600 mb-1">Venituri Lunare</h3>
          <p className="text-2xl font-bold text-slate-800">{formatPrice(stats.revenue.month)}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calendar className="text-blue-600" size={24} />
            </div>
          </div>
          <h3 className="text-sm text-slate-600 mb-1">Rezervări Totale</h3>
          <p className="text-2xl font-bold text-slate-800">{stats.bookings.total}</p>
          <div className="mt-2 text-xs text-slate-500">
            <span className="text-emerald-600">{stats.bookings.completed} finalizate</span>
            {' • '}
            <span className="text-red-600">{stats.bookings.cancelled} anulate</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-100 rounded-lg">
              <Users className="text-amber-600" size={24} />
            </div>
          </div>
          <h3 className="text-sm text-slate-600 mb-1">Clienți</h3>
          <p className="text-2xl font-bold text-slate-800">{stats.customers.new + stats.customers.returning}</p>
          <div className="mt-2 text-xs text-slate-500">
            <span className="text-blue-600">{stats.customers.new} noi</span>
            {' • '}
            <span className="text-purple-600">{stats.customers.returning} recurenți</span>
          </div>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2">
        {(['day', 'week', 'month'] as const).map(period => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedPeriod === period
                ? 'bg-amber-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {period === 'day' ? 'Azi' : period === 'week' ? 'Săptămână' : 'Lună'}
          </button>
        ))}
      </div>

      {/* Revenue Chart Placeholder */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <h3 className="font-semibold text-slate-800 mb-4">Evoluție Venituri</h3>
        <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg">
          <p className="text-slate-500">Grafic venituri - În dezvoltare</p>
        </div>
      </div>

      {/* Top Services */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <h3 className="font-semibold text-slate-800 mb-4">Top Servicii</h3>
        <div className="space-y-3">
          {stats.topServices.map((service, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-slate-400">#{index + 1}</span>
                <div>
                  <p className="font-medium text-slate-800">{service.name}</p>
                  <p className="text-sm text-slate-500">{service.count} rezervări</p>
                </div>
              </div>
              <p className="font-semibold text-amber-600">{formatPrice(service.revenue)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="text-purple-600" size={20} />
            <h3 className="font-medium text-slate-800">Rată Ocupare</h3>
          </div>
          <p className="text-3xl font-bold text-purple-600">{stats.occupancyRate}%</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <StarIcon className="text-amber-600" size={20} />
            <h3 className="font-medium text-slate-800">Rating Mediu</h3>
          </div>
          <p className="text-3xl font-bold text-amber-600">{stats.averageRating.toFixed(1)}</p>
        </div>
      </div>
    </div>
  );
};
