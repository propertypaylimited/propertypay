-- Add created_at column to tenancies table
ALTER TABLE public.tenancies 
ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL;