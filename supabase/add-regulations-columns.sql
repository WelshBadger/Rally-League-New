-- Run this in Supabase SQL editor
ALTER TABLE rallies
  ADD COLUMN IF NOT EXISTS regulations_pdf_url TEXT,
  ADD COLUMN IF NOT EXISTS regulations_data JSONB;
