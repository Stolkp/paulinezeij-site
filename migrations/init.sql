-- ============================================================
-- Pauline Zeij Portfolio — Supabase migratie
-- Gebruik je bestaande Supabase project (gedeeld).
-- Tabelnamen hebben prefix 'paulinezeij_' om conflicten te vermijden.
-- Voer uit in Supabase Dashboard → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS paulinezeij_projects (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_num   int    NOT NULL DEFAULT 0,
  title       text   NOT NULL,
  tag         text   NOT NULL DEFAULT '',
  cover_url   text,
  copy_p1     text   DEFAULT '',
  copy_p2     text   DEFAULT '',
  copy_p3     text   DEFAULT '',
  created_at  timestamptz DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS paulinezeij_project_images (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  project_id  bigint NOT NULL REFERENCES paulinezeij_projects(id) ON DELETE CASCADE,
  order_num   int    NOT NULL DEFAULT 0,
  url         text   NOT NULL,
  created_at  timestamptz DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pz_projects_order         ON paulinezeij_projects(order_num);
CREATE INDEX IF NOT EXISTS idx_pz_project_images_project ON paulinezeij_project_images(project_id, order_num);

-- ---- RLS ----
ALTER TABLE paulinezeij_projects        ENABLE ROW LEVEL SECURITY;
ALTER TABLE paulinezeij_project_images  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pz public read projects"        ON paulinezeij_projects        FOR SELECT USING (true);
CREATE POLICY "pz public read project_images"  ON paulinezeij_project_images  FOR SELECT USING (true);
CREATE POLICY "pz auth write projects"         ON paulinezeij_projects        FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "pz auth write project_images"   ON paulinezeij_project_images  FOR ALL USING (auth.role() = 'authenticated');

-- ---- Storage bucket (sla over als 'paulinezeij' al bestaat) ----
INSERT INTO storage.buckets (id, name, public)
VALUES ('paulinezeij', 'paulinezeij', true)
ON CONFLICT DO NOTHING;

CREATE POLICY IF NOT EXISTS "pz public read storage"   ON storage.objects FOR SELECT  USING (bucket_id = 'paulinezeij');
CREATE POLICY IF NOT EXISTS "pz auth upload storage"   ON storage.objects FOR INSERT  WITH CHECK (bucket_id = 'paulinezeij' AND auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "pz auth delete storage"   ON storage.objects FOR DELETE  USING (bucket_id = 'paulinezeij' AND auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "pz auth update storage"   ON storage.objects FOR UPDATE  USING (bucket_id = 'paulinezeij' AND auth.role() = 'authenticated');

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
