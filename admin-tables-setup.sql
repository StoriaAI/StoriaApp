-- Organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- License keys table
CREATE TABLE IF NOT EXISTS public.license_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    license_key TEXT UNIQUE NOT NULL,
    is_used BOOLEAN DEFAULT false,
    used_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Educational admins table
CREATE TABLE IF NOT EXISTS public.educational_admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL, -- This will store a hashed password
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Admin users table for the main admin authentication
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL, -- This will store a hashed password
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Set up RLS (Row Level Security)
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.educational_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_license_keys_organization_id ON public.license_keys(organization_id);
CREATE INDEX IF NOT EXISTS idx_educational_admins_organization_id ON public.educational_admins(organization_id);

-- Insert default admin user
INSERT INTO public.admin_users (username, password)
VALUES (
    'rajmehta1220',
    -- Password is 'JoinStoria1220' - This would be properly hashed in a real implementation
    -- For development purposes only, use a proper password hashing function in production
    '$2a$10$xJCY1MQy0yFXGgj3tKh.9OqQ5HjvmfUMT85syp9dJ1jekQ0yRmI.e'
) ON CONFLICT (username) DO NOTHING;

-- Functions to update timestamps
CREATE OR REPLACE FUNCTION public.handle_organization_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_license_key_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_educational_admin_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for timestamp updates
CREATE TRIGGER on_organization_update
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW EXECUTE FUNCTION public.handle_organization_update();

CREATE TRIGGER on_license_key_update
    BEFORE UPDATE ON public.license_keys
    FOR EACH ROW EXECUTE FUNCTION public.handle_license_key_update();

CREATE TRIGGER on_educational_admin_update
    BEFORE UPDATE ON public.educational_admins
    FOR EACH ROW EXECUTE FUNCTION public.handle_educational_admin_update();

-- Policies for admin access
-- Admin users can do everything
CREATE POLICY "Admin users have full access to organizations"
    ON public.organizations FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE username = current_setting('request.jwt.claims', true)::json->>'username'
        )
    );

CREATE POLICY "Admin users have full access to license keys"
    ON public.license_keys FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE username = current_setting('request.jwt.claims', true)::json->>'username'
        )
    );

CREATE POLICY "Admin users have full access to educational admins"
    ON public.educational_admins FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE username = current_setting('request.jwt.claims', true)::json->>'username'
        )
    );

CREATE POLICY "Admin users have full access to admin users"
    ON public.admin_users FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE username = current_setting('request.jwt.claims', true)::json->>'username'
        )
    );

-- Function to generate a random license key
CREATE OR REPLACE FUNCTION public.generate_license_key()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '';
    i INTEGER := 0;
    pos INTEGER := 0;
BEGIN
    FOR i IN 1..20 LOOP
        pos := 1 + CAST(random() * (length(chars) - 1) AS INTEGER);
        result := result || substr(chars, pos, 1);
        -- Add a hyphen every 5 characters except at the end
        IF i % 5 = 0 AND i < 20 THEN
            result := result || '-';
        END IF;
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql; 