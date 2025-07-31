-- Migrare pentru adăugarea coloanei location_plus_code
-- Rulare: psql -d your_database -f add_location_plus_code.sql

-- Verificăm dacă coloana există deja
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'providers' 
        AND column_name = 'location_plus_code'
    ) THEN
        -- Adăugăm coloana location_plus_code
        ALTER TABLE public.providers 
        ADD COLUMN location_plus_code TEXT;
        
        RAISE NOTICE 'Coloana location_plus_code a fost adăugată cu succes';
    ELSE
        RAISE NOTICE 'Coloana location_plus_code există deja';
    END IF;
END $$;

-- Verificăm structura tabelului după migrare
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'providers' 
AND column_name IN ('location_plus_code', 'location', 'review_count')
ORDER BY column_name; 