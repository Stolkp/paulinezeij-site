-- ============================================================
-- Pauline Zeij Portfolio — Supabase migratie
-- Voer uit in Supabase Dashboard → SQL Editor
-- ============================================================

-- Projecten tabel
CREATE TABLE IF NOT EXISTS projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_num   INT  NOT NULL DEFAULT 0,
  title       TEXT NOT NULL,
  tag         TEXT NOT NULL DEFAULT '',
  cover_url   TEXT,
  copy_p1     TEXT DEFAULT '',
  copy_p2     TEXT DEFAULT '',
  copy_p3     TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Projectafbeeldingen (max 4 per project, op volgorde)
CREATE TABLE IF NOT EXISTS project_images (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  order_num   INT  NOT NULL DEFAULT 0,
  url         TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Index voor snelle sortering
CREATE INDEX IF NOT EXISTS idx_projects_order ON projects(order_num);
CREATE INDEX IF NOT EXISTS idx_project_images_project ON project_images(project_id, order_num);

-- ---- RLS ----
ALTER TABLE projects      ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_images ENABLE ROW LEVEL SECURITY;

-- Iedereen mag lezen (public portfolio)
CREATE POLICY "public read projects"
  ON projects FOR SELECT USING (true);

CREATE POLICY "public read project_images"
  ON project_images FOR SELECT USING (true);

-- Alleen ingelogde gebruikers mogen schrijven
CREATE POLICY "auth write projects"
  ON projects FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "auth write project_images"
  ON project_images FOR ALL USING (auth.role() = 'authenticated');

-- ---- Storage bucket ----
INSERT INTO storage.buckets (id, name, public)
VALUES ('paulinezeij', 'paulinezeij', true)
ON CONFLICT DO NOTHING;

-- Storage policies
CREATE POLICY "public read paulinezeij"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'paulinezeij');

CREATE POLICY "auth upload paulinezeij"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'paulinezeij' AND auth.role() = 'authenticated');

CREATE POLICY "auth delete paulinezeij"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'paulinezeij' AND auth.role() = 'authenticated');

CREATE POLICY "auth update paulinezeij"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'paulinezeij' AND auth.role() = 'authenticated');
