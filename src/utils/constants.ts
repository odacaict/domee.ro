export const APP_NAME = 'doo mee';
export const APP_VERSION = '1.0.0';

export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  REFUNDED: 'refunded',
} as const;

export const PAYMENT_METHODS = {
  CRYPTO: 'crypto',
  FIAT: 'fiat',
} as const;

export const USER_TYPES = {
  CUSTOMER: 'customer',
  PROVIDER: 'provider',
  ADMIN: 'admin',
} as const;

export const SALON_TYPES = {
  WOMEN: 'women',
  MEN: 'men',
  UNISEX: 'unisex',
} as const;

export const PRICE_RANGES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;

export const NOTIFICATION_TYPES = {
  PAYMENT: 'payment',
  BOOKING: 'booking',
  REVIEW: 'review',
  ALERT: 'alert',
} as const;

export const DEFAULT_WORKING_HOURS = {
  monday: { open: '09:00', close: '18:00', breaks: [], closed: false },
  tuesday: { open: '09:00', close: '18:00', breaks: [], closed: false },
  wednesday: { open: '09:00', close: '18:00', breaks: [], closed: false },
  thursday: { open: '09:00', close: '18:00', breaks: [], closed: false },
  friday: { open: '09:00', close: '18:00', breaks: [], closed: false },
  saturday: { open: '10:00', close: '16:00', breaks: [], closed: false },
  sunday: { open: '10:00', close: '16:00', breaks: [], closed: true },
};

export const SEARCH_DEBOUNCE_MS = 300;
export const MAX_SEARCH_SUGGESTIONS = 8;
export const MAX_IMAGE_SIZE_MB = 5;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const FACILITIES_OPTIONS = [
  'wifi',
  'parking',
  'card_payment',
  'crypto_payment',
  'air_conditioning',
  'wheelchair_access',
  'kids_friendly',
  'pets_allowed',
  'online_booking',
  'loyalty_program',
] as const;

export const LANGUAGES = {
  ro: 'Română',
  en: 'English',
  hu: 'Espaniol',
  de: 'Deutsch',
} as const;

export const ROMANIA_CITIES = [
  'Alba Iulia',
  'Arad',
  'Alexandria',
  'Bacău',
  'Baia Mare',
  'Bistrița',
  'Botoșani',
  'Brăila',
  'Brașov',
  'București',
  'Buzău',
  'Călărași',
  'Cluj-Napoca',
  'Constanța',
  'Craiova',
  'Deva',
  'Drobeta-Turnu Severin',
  'Focșani',
  'Giurgiu',
  'Iași',
  'Miercurea Ciuc',
  'Oradea',
  'Piatra Neamț',
  'Pitești',
  'Ploiești',
  'Râmnicu Vâlcea',
  'Reșița',
  'Satu Mare',
  'Sfântu Gheorghe',
  'Sibiu',
  'Slatina',
  'Slobozia',
  'Suceava',
  'Târgoviște',
  'Târgu Jiu',
  'Târgu Mureș',
  'Timișoara',
  'Tulcea',
  'Vaslui',
  'Zalău'
];