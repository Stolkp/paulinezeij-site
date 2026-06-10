-- ============================================================
-- Pauline Zeij — Seed data
-- Voer uit NA init.sql in Supabase SQL Editor
-- Vult de 5 bestaande series + INFO-teksten in
-- ============================================================

-- Settings tabel (voor INFO-paginatekst)
CREATE TABLE IF NOT EXISTS paulinezeij_settings (
  key   text PRIMARY KEY,
  value text NOT NULL DEFAULT ''
);

ALTER TABLE paulinezeij_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pz public read settings" ON paulinezeij_settings FOR SELECT USING (true);
CREATE POLICY "pz auth write settings"  ON paulinezeij_settings FOR ALL   USING (auth.role() = 'authenticated');

-- INFO-paginatekst
INSERT INTO paulinezeij_settings (key, value) VALUES
  ('bio_p1', 'Pauline Zeij is een contemporaine kunstenaar gevestigd in de omgeving van Uithoorn. Ze schildert trefzekere portretten van zowel mensen als dieren, en beeldt een geheel eigen magische wereld uit waar mens en dier elkaar regelmatig ontmoeten. Haar werk bevindt zich in particuliere collecties en wordt vertegenwoordigd door de Paard Verzameld Gallery.'),
  ('bio_p2', 'Haar beeldtaal is zacht en aaibaar, maar ook rauw en reëel — een combinatie die moeiteloos samengaat op het doek. Het gebruik van licht en kleur is voor Pauline van groot belang: het zijn de middelen waarmee ze zowel haar realiteit als haar magie vangt.'),
  ('quote',  'Licht en kleur zijn voor mij het begin van elk verhaal.')
ON CONFLICT (key) DO NOTHING;

-- 5 series (afbeeldingen wijzen naar de huidige Vercel static URLs)
INSERT INTO paulinezeij_projects (order_num, title, tag, cover_url, copy_p1, copy_p2, copy_p3) VALUES
(0, 'Paarden', 'Equine Art',
 'https://paulinezeij.vercel.app/images/01.jpg',
 'Pauline schildert paarden zoals ze zijn — krachtig, gracieus en vol karakter. Elk schilderij vangt een moment van aanwezigheid, een blik die de toeschouwer raakt en niet loslaat.',
 'De werken zijn geschilderd in olieverf op groot formaat doek. Licht en kleur zijn de sleutelwoorden: diep donker als achtergrond, warme tinten die het paard doen oplichten.',
 'Een persoonlijk paardenportret laten maken? Pauline werkt graag in opdracht. Neem contact op via <a href="mailto:info@paulinezeij.nl">info@paulinezeij.nl</a> of <a href="tel:+31612854167">+31 6 12 85 41 67</a>.'),

(1, 'Magie', 'Fine Art',
 'https://paulinezeij.vercel.app/images/02.jpg',
 'In haar magische werken ontmoeten mensen en dieren elkaar in een wereld die tegelijk vertrouwd en dromerig aanvoelt. Realisme en fantasie vloeien moeiteloos samen op het doek.',
 'Gemengde techniek op doek — olieverf in combinatie met andere materialen. De heldere kleurvlakken en de precieze details maken haar herkenbare signatuur.',
 'Interesse in een van haar magische werken? Neem contact op voor beschikbaarheid en prijzen: <a href="mailto:info@paulinezeij.nl">info@paulinezeij.nl</a>.'),

(2, 'Kunstenaar', 'Portret',
 'https://paulinezeij.vercel.app/images/03.jpg',
 'Pauline Zeij — de kunstenaar achter het werk. Haar passie voor licht, kleur en het samenspel tussen mens en dier is zichtbaar in elk schilderij dat ze maakt.',
 'Gevestigd in de omgeving van Uithoorn, werkt Pauline vanuit een eigen atelier waar elk doek begint als een dialoog tussen haar en het onderwerp.',
 'Meer weten over Pauline? Volg haar op Instagram @pauline_zeij_contemporary_art of neem direct contact op via <a href="mailto:info@paulinezeij.nl">info@paulinezeij.nl</a>.'),

(3, 'Atelier', 'Studie',
 'https://paulinezeij.vercel.app/images/04.jpg',
 'Detailopnames vanuit het atelier — close-ups van schilderijen in wording, verflagen en penseelstreken die de intimiteit van het maakproces tonen.',
 'Olieverf op doek, vastgelegd in het atelier. Elke close-up onthult de textuur en gelaagdheid die van dichtbij pas volledig zichtbaar wordt.',
 'Wil je het maakproces volgen? Pauline deelt regelmatig behind-the-scenes op Instagram @pauline_zeij_contemporary_art.'),

(4, 'Galerie', 'Collectie',
 'https://paulinezeij.vercel.app/images/05.jpg',
 'Werken in hun uiteindelijke context — ingelijst, opgehangen, thuis. Zo laat Pauline zien hoe haar schilderijen tot leven komen in een woon- of galerie-omgeving.',
 'Verschillende technieken en formaten, van klein formaat aquarel tot groot formaat olieverf. Vertegenwoordigd door de Paard Verzameld Gallery.',
 'Interesse in een werk voor uw collectie? Neem contact op met Pauline via <a href="mailto:info@paulinezeij.nl">info@paulinezeij.nl</a> of bezoek de Paard Verzameld Gallery.');

-- Project afbeeldingen (Vercel static URLs als startpunt)
INSERT INTO paulinezeij_project_images (project_id, order_num, url)
SELECT p.id, imgs.order_num, imgs.url
FROM paulinezeij_projects p
JOIN (VALUES
  ('Paarden', 0, 'https://paulinezeij.vercel.app/images/Project-01/01.jpg'),
  ('Paarden', 1, 'https://paulinezeij.vercel.app/images/Project-01/02.jpg'),
  ('Paarden', 2, 'https://paulinezeij.vercel.app/images/Project-01/03.jpg'),
  ('Paarden', 3, 'https://paulinezeij.vercel.app/images/Project-01/04.jpg'),
  ('Magie',   0, 'https://paulinezeij.vercel.app/images/Project-02/01.jpg'),
  ('Magie',   1, 'https://paulinezeij.vercel.app/images/Project-02/02.jpg'),
  ('Magie',   2, 'https://paulinezeij.vercel.app/images/Project-02/03.jpg'),
  ('Magie',   3, 'https://paulinezeij.vercel.app/images/Project-02/04.jpg'),
  ('Kunstenaar', 0, 'https://paulinezeij.vercel.app/images/Project-03/01.jpg'),
  ('Kunstenaar', 1, 'https://paulinezeij.vercel.app/images/Project-03/02.jpg'),
  ('Kunstenaar', 2, 'https://paulinezeij.vercel.app/images/Project-03/03.jpg'),
  ('Kunstenaar', 3, 'https://paulinezeij.vercel.app/images/Project-03/04.jpg'),
  ('Atelier', 0, 'https://paulinezeij.vercel.app/images/Project-04/01.jpg'),
  ('Atelier', 1, 'https://paulinezeij.vercel.app/images/Project-04/02.jpg'),
  ('Atelier', 2, 'https://paulinezeij.vercel.app/images/Project-04/03.jpg'),
  ('Atelier', 3, 'https://paulinezeij.vercel.app/images/Project-04/04.jpg'),
  ('Galerie', 0, 'https://paulinezeij.vercel.app/images/Project-05/01.jpg'),
  ('Galerie', 1, 'https://paulinezeij.vercel.app/images/Project-05/02.jpg'),
  ('Galerie', 2, 'https://paulinezeij.vercel.app/images/Project-05/03.jpg'),
  ('Galerie', 3, 'https://paulinezeij.vercel.app/images/Project-05/04.jpg')
) AS imgs(title, order_num, url) ON p.title = imgs.title;
