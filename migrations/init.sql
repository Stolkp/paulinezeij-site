-- ============================================================
-- Pauline Zeij Portfolio — Supabase migratie
-- Voer uit in Supabase Dashboard → SQL Editor
-- ============================================================

-- Opruimen als er al iets bestaat
DROP TABLE IF EXISTS project_images CASCADE;
DROP TABLE IF EXISTS projects CASCADE;

-- Projecten tabel (bigint id = Supabase standaard)
CREATE TABLE projects (
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

-- Projectafbeeldingen (max 4 per project, op volgorde)
CREATE TABLE project_images (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  project_id  bigint NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  order_num   int    NOT NULL DEFAULT 0,
  url         text   NOT NULL,
  created_at  timestamptz DEFAULT NOW()
);

-- Index voor snelle sortering
CREATE INDEX idx_projects_order        ON projects(order_num);
CREATE INDEX idx_project_images_project ON project_images(project_id, order_num);

-- ---- RLS ----
ALTER TABLE projects       ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_images ENABLE ROW LEVEL SECURITY;

-- Iedereen mag lezen (public portfolio)
CREATE POLICY "public read projects"       ON projects       FOR SELECT USING (true);
CREATE POLICY "public read project_images" ON project_images FOR SELECT USING (true);

-- Alleen ingelogde gebruikers mogen schrijven
CREATE POLICY "auth write projects"        ON projects       FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth write project_images"  ON project_images FOR ALL USING (auth.role() = 'authenticated');

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
