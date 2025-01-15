-- Add currency column to profiles table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'currency'
    ) THEN
        ALTER TABLE profiles ADD COLUMN currency TEXT DEFAULT 'USD' NOT NULL;
    END IF;
END $$;
