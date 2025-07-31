export interface User {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
  preferences?: UserPreferences;
  user_type: 'customer' | 'provider' | 'admin';
}

export interface UserPreferences {
  notifications: boolean;
  location_sharing: boolean;
  preferred_language: string;
  payment_methods?: PaymentPreferences;
}

export interface PaymentPreferences {
  accept_crypto: boolean;
  accept_fiat: boolean;
  preferred_currency?: string;
}

export interface Provider {
  id: string;
  user_id: string;
  salon_name: string;
  company_name?: string;
  fiscal_code?: string;
  company_type?: string;
  description: string;
  address: string;
  city: string;
  country: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  location_plus_code?: string; // Plus Code pentru afișare și căutare
  phone: string;
  email: string;
  website?: string;
  verified: boolean;
  rating: number;
  review_count: number;
  images: string[];
  logo_url?: string;
  featured_image?: string;
  working_hours: WorkingHours;
  distance?: number;
  payment_methods: {
    crypto: boolean;
    fiat: boolean;
    crypto_wallets?: string[];
    bank_accounts?: BankAccount[];
  };
  salon_type: 'women' | 'men' | 'unisex';
  price_range?: 'low' | 'medium' | 'high';
  facilities?: string[];
  languages?: string[];
  gallery?: Array<{
    id: string;
    name: string;
    description: string;
    images: string[];
  }>;
  video_url?: string;
  social_media?: {
    facebook?: string;
    instagram?: string;
    youtube?: string;
  };
  policies?: {
    cancellation?: string;
    payment?: string;
    health_safety?: string;
  };
  team_members?: Array<{
    name: string;
    role: string;
    description?: string;
    image?: string;
  }>;
}

export interface BankAccount {
  bank_name: string;
  iban: string;
  swift?: string;
}

export interface WorkingHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface DaySchedule {
  open: string;
  close: string;
  breaks: TimeSlot[];
  closed: boolean;
}

export interface TimeSlot {
  start: string;
  end: string;
}

export interface Service {
  id: string;
  provider_id: string;
  name: string;
  description: string;
  price: number;
  duration: number; // in minutes
  category?: string;
  image_url?: string;
  active: boolean;
}

export interface Booking {
  id: string;
  user_id: string;
  provider_id: string;
  service_id: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  total_price: number;
  payment_status: 'pending' | 'paid' | 'refunded';
  payment_method?: 'crypto' | 'fiat';
  notes?: string;
  created_at: string;
  provider?: Provider;
  service?: Service;
  user?: User;
  users?: User; // For backwards compatibility with some queries
  services?: Service; // For backwards compatibility with some queries
  bookings?: {
    services?: Service;
  };
}

export interface Review {
  id: string;
  booking_id: string;
  user_id: string;
  provider_id: string;
  rating: number;
  comment: string;
  response?: string;
  created_at: string;
  users?: User;
  bookings?: {
    services?: Service;
  };
}

export interface Payment {
  id: string;
  booking_id: string;
  amount: number;
  method: 'card' | 'paypal' | 'apple_pay' | 'crypto';
  crypto_currency?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transaction_id: string;
  created_at: string;
  payment_intent_id?: string;
  platform_fee?: number;
  provider_payout?: number;
}

export interface Notification {
  id: string; 
  user_id: string;
  title: string;
  message: string;
  type: 'payment' | 'booking' | 'review' | 'alert';
  read: boolean;
  created_at: string;
  action_url?: string;
}

export interface AppContextType {
  user: User | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  userType: 'customer' | 'provider' | 'admin' | null;
  notifications: Notification[];
  unreadCount: number;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignupData, user_type: 'customer' | 'provider') => Promise<void>;
  signupProvider: (data: ProviderSignupData) => Promise<void>;
  logout: () => Promise<void>;
  continueAsGuest: () => void;
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;
}

export interface SignupData {
  email: string;
  password: string;
  name: string;
  phone: string;
}

export interface ProviderSignupData extends SignupData {
  company_name: string;
  fiscal_code: string;
  company_type: string;
  salon_name: string;
  address: string;
  city: string;
  country: string;
  coordinates?: string;
  bank_accounts?: BankAccount[];
  crypto_wallets?: string[];
  salon_type: 'women' | 'men' | 'unisex';
}

export interface FilterCriteria {
  minReviews?: number;
  maxDistance?: number;
  priceOrder?: 'asc' | 'desc';
  paymentMethods?: {
    crypto?: boolean;
    fiat?: boolean;
  };
  salonType?: 'women' | 'men' | 'unisex';
  city?: string;
  minRating?: number;
  priceMin?: number;
  priceMax?: number;
  facilities?: string[];
  languages?: string[];
  verified?: boolean;
  hasPromotions?: boolean;
  availableNow?: boolean;
}