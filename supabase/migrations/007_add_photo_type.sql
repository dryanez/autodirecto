-- ============================================================
-- Migration 007: Add photo_type column to vehicle_images
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)
-- ============================================================

-- Adds support for categorizing photos:
--   'exterior'  = landscape, outside car  → published on autodirecto.cl
--   'interior'  = landscape, inside car   → published on autodirecto.cl
--   'social'    = vertical/portrait shots → NOT published (used for social media only)

ALTER TABLE vehicle_images
  ADD COLUMN IF NOT EXISTS photo_type TEXT DEFAULT 'exterior';

-- Index for fast filtering by photo_type
CREATE INDEX IF NOT EXISTS idx_vehicle_images_photo_type
  ON vehicle_images(photo_type);
