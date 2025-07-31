-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  avatar_url TEXT,
  user_type TEXT NOT NULL CHECK (user_type IN ('customer', 'provider', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Providers table
CREATE TABLE public.providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  salon_name TEXT NOT NULL,
  company_name TEXT,
  fiscal_code TEXT,
  company_type TEXT,
  description TEXT DEFAULT '',
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'România',
  location GEOGRAPHY(POINT),
  location_plus_code TEXT, -- Plus Code pentru afișare și căutare
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  website TEXT,
  verified BOOLEAN DEFAULT FALSE,
  rating DECIMAL(2,1) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  review_count INTEGER DEFAULT 0 CHECK (review_count >= 0),
  images TEXT[] DEFAULT '{}',
  logo_url TEXT,
  featured_image TEXT,
  working_hours JSONB DEFAULT '{
    "monday": {"open": "09:00", "close": "18:00", "breaks": [], "closed": false},
    "tuesday": {"open": "09:00", "close": "18:00", "breaks": [], "closed": false},
    "wednesday": {"open": "09:00", "close": "18:00", "breaks": [], "closed": false},
    "thursday": {"open": "09:00", "close": "18:00", "breaks": [], "closed": false},
    "friday": {"open": "09:00", "close": "18:00", "breaks": [], "closed": false},
    "saturday": {"open": "10:00", "close": "16:00", "breaks": [], "closed": false},
    "sunday": {"open": "10:00", "close": "16:00", "breaks": [], "closed": true}
  }',
  payment_methods JSONB DEFAULT '{
    "crypto": false,
    "fiat": false,
    "crypto_wallets": [],
    "bank_accounts": []
  }',
  salon_type TEXT NOT NULL CHECK (salon_type IN ('women', 'men', 'unisex')) DEFAULT 'unisex',
  price_range TEXT CHECK (price_range IN ('low', 'medium', 'high')),
  facilities TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{"ro"}',
  gallery JSONB DEFAULT '[]',
  video_url TEXT,
  social_media JSONB DEFAULT '{}',
  policies JSONB DEFAULT '{}',
  team_members JSONB DEFAULT '[]',
  active_promotions JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Services table
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  duration INTEGER NOT NULL CHECK (duration > 0), -- in minutes
  category TEXT,
  image_url TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id),
  provider_id UUID NOT NULL REFERENCES public.providers(id),
  service_id UUID NOT NULL REFERENCES public.services(id),
  date DATE NOT NULL,
  time TIME NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')) DEFAULT 'pending',
  total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
  payment_status TEXT NOT NULL CHECK (payment_status IN ('pending', 'paid', 'refunded')) DEFAULT 'pending',
  payment_method TEXT CHECK (payment_method IN ('crypto', 'fiat')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id),
  user_id UUID NOT NULL REFERENCES public.users(id),
  provider_id UUID NOT NULL REFERENCES public.providers(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  response TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id),
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  method TEXT NOT NULL CHECK (method IN ('card', 'paypal', 'apple_pay', 'crypto')),
  crypto_currency TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
  transaction_id TEXT,
  payment_intent_id TEXT,
  platform_fee DECIMAL(10,2),
  provider_payout DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('payment', 'booking', 'review', 'alert')),
  read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Search history table
CREATE TABLE public.search_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id),
  query TEXT NOT NULL,
  filters JSONB,
  results_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Funcții pentru validări
CREATE OR REPLACE FUNCTION validate_fiscal_code(fiscal_code TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Validare cod fiscal românesc (CUI)
  RETURN fiscal_code ~ '^RO?\d{6,10}$';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION validate_iban(iban TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Validare IBAN românesc
  RETURN iban ~ '^RO\d{2}[A-Z]{4}[A-Z0-9]{16}$';
END;
$$ LANGUAGE plpgsql;

-- Funcție pentru transformarea coordonatelor
CREATE OR REPLACE FUNCTION transform_coordinates(lat DOUBLE PRECISION, lng DOUBLE PRECISION)
RETURNS GEOGRAPHY AS $$
BEGIN
  RETURN ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography;
END;
$$ LANGUAGE plpgsql;

-- Funcție simplă pentru căutarea furnizorilor în apropiere
CREATE OR REPLACE FUNCTION get_nearby_providers(
  user_lat FLOAT,
  user_lng FLOAT,
  radius_km FLOAT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  salon_name TEXT,
  address TEXT,
  city TEXT,
  rating DECIMAL,
  distance FLOAT,
  coordinates JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.salon_name,
    p.address,
    p.city,
    p.rating,
    ST_Distance(p.location, ST_MakePoint(user_lng, user_lat)::geography) / 1000 as distance,
    CASE 
      WHEN p.location IS NOT NULL THEN
        json_build_object('lat', ST_Y(p.location), 'lng', ST_X(p.location))
      ELSE NULL
    END as coordinates
  FROM providers p
  WHERE 
    p.location IS NOT NULL AND
    ST_DWithin(p.location, ST_MakePoint(user_lng, user_lat)::geography, radius_km * 1000)
  ORDER BY distance;
END;
$$ LANGUAGE plpgsql;

-- SOLUȚIA: Funcție și Trigger pentru crearea automată a profilului în public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, phone, user_type)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'customer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists to avoid errors on re-run
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- RLS Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Politici RLS corectate
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Anyone can view providers" ON public.providers;
CREATE POLICY "Anyone can view providers" ON public.providers FOR SELECT USING (true);
DROP POLICY IF EXISTS "Providers can update their own data" ON public.providers;
CREATE POLICY "Providers can update their own data" ON public.providers FOR UPDATE USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Authenticated providers can create their profile" ON public.providers;
CREATE POLICY "Authenticated providers can create their profile" ON public.providers FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view active services" ON public.services;
CREATE POLICY "Anyone can view active services" ON public.services FOR SELECT USING (active = true);
DROP POLICY IF EXISTS "Providers can manage their services" ON public.services;
CREATE POLICY "Providers can manage their services" ON public.services FOR ALL USING (provider_id IN (SELECT id FROM providers WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can manage their own bookings" ON public.bookings;
CREATE POLICY "Users can manage their own bookings" ON public.bookings FOR ALL USING (user_id = auth.uid() OR provider_id IN (SELECT id FROM providers WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;
CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can create reviews for their completed bookings" ON public.reviews;
CREATE POLICY "Users can create reviews for their completed bookings" ON public.reviews FOR INSERT WITH CHECK (user_id = auth.uid() AND booking_id IN (SELECT id FROM bookings WHERE user_id = auth.uid() AND status = 'completed'));
DROP POLICY IF EXISTS "Providers can respond to reviews" ON public.reviews;
CREATE POLICY "Providers can respond to reviews" ON public.reviews FOR UPDATE USING (provider_id IN (SELECT id FROM providers WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can manage their own notifications" ON public.notifications;
CREATE POLICY "Users can manage their own notifications" ON public.notifications FOR ALL USING (user_id = auth.uid());
