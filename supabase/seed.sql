-- ============================================================
-- BikeTrip — Données de démo
-- Exécuter après les migrations (005_rls.sql inclus)
-- ============================================================

-- NOTE : Les UUIDs auth.users doivent être créés manuellement
-- via Supabase Auth ou le dashboard. Ce seed insère uniquement
-- les données de profils et de contenu.

-- ============================================================
-- PROFILS UTILISATEURS DE DÉMO
-- ============================================================
-- Remplacer les UUIDs par ceux créés dans auth.users

-- ID de démo (à remplacer par les vrais UUIDs Supabase Auth)
DO $$
DECLARE
  admin_id   UUID := '00000000-0000-0000-0000-000000000001';
  mod_id     UUID := '00000000-0000-0000-0000-000000000002';
  user1_id   UUID := '00000000-0000-0000-0000-000000000003';
  user2_id   UUID := '00000000-0000-0000-0000-000000000004';
  user3_id   UUID := '00000000-0000-0000-0000-000000000005';

  trail1_id  UUID := 'a1000000-0000-0000-0000-000000000001';
  trail2_id  UUID := 'a1000000-0000-0000-0000-000000000002';
  trail3_id  UUID := 'a1000000-0000-0000-0000-000000000003';
  trail4_id  UUID := 'a1000000-0000-0000-0000-000000000004';
  trail5_id  UUID := 'a1000000-0000-0000-0000-000000000005';
  trail6_id  UUID := 'a1000000-0000-0000-0000-000000000006';
  trail7_id  UUID := 'a1000000-0000-0000-0000-000000000007';
  trail8_id  UUID := 'a1000000-0000-0000-0000-000000000008';
  trail9_id  UUID := 'a1000000-0000-0000-0000-000000000009';
  trail10_id UUID := 'a1000000-0000-0000-0000-000000000010';

BEGIN

-- ============================================================
-- PROFILS
-- ============================================================
INSERT INTO profiles (id, full_name, avatar_url, city, cycling_level, primary_bike_type, comfortable_distance_km, role)
VALUES
  (admin_id,  'Marie Tremblay',   NULL, 'Québec',    'EXPERT',  'ROAD',   120, 'ADMIN'),
  (mod_id,    'Jean-François Roy', NULL, 'Montréal',  'SPORT',   'GRAVEL', 80,  'MODERATOR'),
  (user1_id,  'Sophie Lapointe',  NULL, 'Québec',    'REGULAR', 'HYBRID', 40,  'USER'),
  (user2_id,  'Marc Beaulieu',    NULL, 'Sherbrooke','BEGINNER','URBAN',  20,  'USER'),
  (user3_id,  'Émilie Fortin',    NULL, 'Montréal',  'CASUAL',  'ELECTRIC',35, 'USER')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PISTES CYCLABLES
-- ============================================================
INSERT INTO trails (id, name, slug, description, city, region, country,
  distance_km, estimated_duration_minutes, elevation_gain_m, elevation_loss_m,
  min_altitude_m, max_altitude_m, difficulty, surface_type, trail_type,
  recommended_bike_types, safety_score, start_latitude, start_longitude,
  end_latitude, end_longitude, is_verified)
VALUES

-- 1. Piste Verte des Plaines (Québec)
(trail1_id,
 'Piste Verte des Plaines', 'piste-verte-des-plaines',
 'Une magnifique piste aspahltée longeant les plaines d''Abraham à Québec. Idéale pour une sortie en famille ou une balade tranquille. Vue sur le fleuve Saint-Laurent garantie.',
 'Québec', 'Capitale-Nationale', 'Canada',
 12.5, 45, 85, 80, 5, 90,
 'EASY', 'ASPHALT', 'FAMILY',
 ARRAY['HYBRID', 'ROAD', 'ELECTRIC', 'URBAN']::bike_type[],
 9.2, 46.8131, -71.2082, 46.8189, -71.1923, true),

-- 2. Piste Cyclable du Littoral (Québec-Lévis)
(trail2_id,
 'Piste Cyclable du Littoral', 'piste-cyclable-du-littoral',
 'Parcours longeant le fleuve Saint-Laurent entre Québec et Lévis. Piste asphaltée avec vue imprenable sur le Château Frontenac et le fleuve. Quelques montées modérées.',
 'Québec', 'Capitale-Nationale', 'Canada',
 28.3, 100, 240, 235, 0, 95,
 'MODERATE', 'ASPHALT', 'NATURE',
 ARRAY['ROAD', 'HYBRID', 'GRAVEL']::bike_type[],
 8.8, 46.8155, -71.1953, 46.7094, -71.2895, true),

-- 3. Parcours Urbain Montréal Centre
(trail3_id,
 'Parcours Urbain Montréal Centre', 'parcours-urbain-montreal-centre',
 'Circuit urbain dans le cœur de Montréal, passant par le Plateau-Mont-Royal, le Vieux-Port et le canal Lachine. Piste cyclable dédiée sur la majorité du trajet.',
 'Montréal', 'Île-de-Montréal', 'Canada',
 18.7, 70, 110, 105, 5, 115,
 'EASY', 'ASPHALT', 'URBAN',
 ARRAY['URBAN', 'HYBRID', 'ELECTRIC', 'ROAD']::bike_type[],
 7.5, 45.5088, -73.5878, 45.4957, -73.5673, true),

-- 4. Boucle Familiale du Parc de la Jacques-Cartier
(trail4_id,
 'Boucle Familiale du Parc de la Jacques-Cartier', 'boucle-familiale-parc-jacques-cartier',
 'Boucle sécurisée et balisée au cœur du Parc national de la Jacques-Cartier. Piste en terre battue avec quelques sections sur gravier compact. Idéale avec enfants.',
 'Stoneham-et-Tewkesbury', 'Capitale-Nationale', 'Canada',
 8.2, 50, 145, 145, 145, 290,
 'EASY', 'DIRT', 'FAMILY',
 ARRAY['MOUNTAIN', 'HYBRID', 'GRAVEL']::bike_type[],
 9.5, 47.0346, -71.3578, 47.0312, -71.3490, true),

-- 5. Parcours Gravel Forêt Montmorency
(trail5_id,
 'Parcours Gravel Forêt Montmorency', 'parcours-gravel-foret-montmorency',
 'Sentier gravel exigeant en forêt boréale. Chemin forestier avec quelques passages techniques. Vue sur la chute Montmorency en prime. Réservé aux cyclistes expérimentés.',
 'Beauport', 'Capitale-Nationale', 'Canada',
 35.6, 180, 620, 615, 85, 705,
 'HARD', 'GRAVEL', 'GRAVEL',
 ARRAY['MOUNTAIN', 'GRAVEL']::bike_type[],
 6.8, 47.0558, -71.1445, 47.0102, -71.1876, true),

-- 6. Circuit Bord de Fleuve — Trois-Rivières
(trail6_id,
 'Circuit Bord de Fleuve — Trois-Rivières', 'circuit-bord-de-fleuve-trois-rivieres',
 'Piste cyclable longeant le fleuve Saint-Laurent à Trois-Rivières. Parcours plat et accessible, parfait pour les débutants ou les sorties en soirée.',
 'Trois-Rivières', 'Mauricie', 'Canada',
 22.0, 75, 30, 28, 0, 30,
 'EASY', 'ASPHALT', 'NATURE',
 ARRAY['ROAD', 'HYBRID', 'ELECTRIC', 'URBAN', 'GRAVEL']::bike_type[],
 8.5, 46.3432, -72.5490, 46.3701, -72.5967, true),

-- 7. Piste Longue Distance — La Montégéroise
(trail7_id,
 'Piste Longue Distance — La Montégéroise', 'piste-longue-distance-monteregoise',
 'Parcours longue distance traversant la Montérégie de Sorel-Tracy à Saint-Jean-sur-Richelieu sur voies vertes et pistes dédiées. Paysages agricoles et boisés.',
 'Saint-Hyacinthe', 'Montérégie', 'Canada',
 65.0, 270, 180, 175, 5, 95,
 'MODERATE', 'ASPHALT', 'LONG_DISTANCE',
 ARRAY['ROAD', 'GRAVEL', 'HYBRID']::bike_type[],
 8.2, 45.6095, -72.9571, 45.3073, -73.2700, false),

-- 8. Sentier du Fjord — Saguenay
(trail8_id,
 'Sentier du Fjord — Saguenay', 'sentier-du-fjord-saguenay',
 'Parcours spectaculaire longeant le Fjord du Saguenay. Dénivelé important, surfaces mixtes. Vue époustouflante sur le fjord. Niveau intermédiaire à avancé.',
 'La Baie', 'Saguenay–Lac-Saint-Jean', 'Canada',
 42.8, 200, 890, 885, 0, 890,
 'HARD', 'MIXED', 'NATURE',
 ARRAY['MOUNTAIN', 'GRAVEL', 'ROAD']::bike_type[],
 7.9, 48.3256, -70.8734, 48.4123, -70.9567, true),

-- 9. Voie Verte de l''Estrie — Appalachien
(trail9_id,
 'Voie Verte de l''Estrie — Appalachien', 'voie-verte-estrie-appalachien',
 'Voie verte aménagée sur l''ancienne emprise ferroviaire des Appalaches. Piste asphaltée traversant villages et forêts des Cantons-de-l''Est.',
 'Sherbrooke', 'Estrie', 'Canada',
 31.5, 130, 210, 215, 180, 390,
 'MODERATE', 'ASPHALT', 'GREENWAY',
 ARRAY['ROAD', 'HYBRID', 'GRAVEL', 'ELECTRIC']::bike_type[],
 9.0, 45.4043, -71.8929, 45.5589, -72.1234, true),

-- 10. Circuit Touristique du Vieux-Port Montréal
(trail10_id,
 'Circuit Touristique du Vieux-Port Montréal', 'circuit-touristique-vieux-port-montreal',
 'Circuit découverte du Vieux-Montréal, du Canal Lachine et du Vieux-Port. Piste cyclable dédiée sur le parcours complet. Idéal pour découvrir Montréal à vélo.',
 'Montréal', 'Île-de-Montréal', 'Canada',
 14.0, 55, 45, 45, 5, 50,
 'EASY', 'ASPHALT', 'TOURISM',
 ARRAY['URBAN', 'HYBRID', 'ELECTRIC', 'ROAD']::bike_type[],
 8.7, 45.5016, -73.5564, 45.4800, -73.5850, true);

-- ============================================================
-- POINTS DE PISTE (trail_points) — quelques points pour trail1
-- ============================================================
INSERT INTO trail_points (trail_id, latitude, longitude, altitude_m, position) VALUES
  (trail1_id, 46.8131, -71.2082, 50,  1),
  (trail1_id, 46.8142, -71.2010, 55,  2),
  (trail1_id, 46.8155, -71.1945, 60,  3),
  (trail1_id, 46.8163, -71.1880, 65,  4),
  (trail1_id, 46.8170, -71.1810, 72,  5),
  (trail1_id, 46.8180, -71.1760, 80,  6),
  (trail1_id, 46.8189, -71.1923, 90,  7);

-- ============================================================
-- POINTS D'INTÉRÊT
-- ============================================================
INSERT INTO points_of_interest (trail_id, name, type, description, latitude, longitude) VALUES
  (trail1_id, 'Fontaine Plaines',       'WATER_FOUNTAIN',  'Fontaine d''eau potable aux Plaines d''Abraham',  46.8140, -71.2050),
  (trail1_id, 'Stationnement vélos Plaines', 'BIKE_PARKING', 'Supports à vélos sécurisés',                    46.8135, -71.2070),
  (trail2_id, 'Station réparation Lévis', 'REPAIR_STATION', 'Station de réparation avec outils et pompe',     46.7500, -71.2500),
  (trail3_id, 'Café Vélo Montréal',      'CAFE',            'Café cycliste avec stationnement sécurisé',       45.5100, -73.5800),
  (trail3_id, 'Station recharge VAE',    'CHARGING_STATION','Borne de recharge pour vélos électriques',        45.5050, -73.5750),
  (trail3_id, 'WC Canal Lachine',        'TOILET',          'Toilettes publiques au Canal Lachine',            45.4960, -73.5690),
  (trail4_id, 'Aire repos forestière',   'REST_AREA',       'Table de pique-nique et eau potable',             47.0330, -71.3530),
  (trail5_id, 'Belvédère Montmorency',   'VIEWPOINT',       'Vue panoramique sur la chute Montmorency',        47.0545, -71.1465),
  (trail6_id, 'Halte cyclable Fleuve',   'CYCLING_REST',    'Halte cyclable avec bancs et eau',                46.3500, -72.5600),
  (trail9_id, 'Boutique Vélo Estrie',    'BIKE_SHOP',       'Boutique vélo avec atelier de réparation',        45.4050, -71.8950),
  (trail10_id,'Stationnement Vieux-Port','CAR_PARKING',     'Stationnement voiture proche du départ',          45.5010, -73.5540),
  (trail10_id,'Station STM Champ-de-Mars','TRAIN_STATION',  'Metro Champ-de-Mars pour rejoindre le départ',    45.5082, -73.5541);

-- ============================================================
-- SIGNALEMENTS COMMUNAUTAIRES
-- ============================================================
INSERT INTO reports (trail_id, user_id, type, title, description, severity, status, latitude, longitude, confirmed_count, expires_at)
VALUES
  -- Trail 1 : Piste Verte
  (trail1_id, user1_id, 'POTHOLE',      'Nid-de-poule km 3',
   'Nid-de-poule dangereux à 200m après l''entrée des Plaines. Environ 15cm de diamètre.',
   'MEDIUM', 'CONFIRMED', 46.8145, -71.2001, 4, now() + interval '7 days'),

  (trail1_id, user2_id, 'MUD',          'Boue après la pluie',
   'Section boueuse après les fortes pluies de la semaine. Ralentissez.',
   'LOW', 'ACTIVE', 46.8160, -71.1900, 1, now() + interval '3 days'),

  -- Trail 2 : Littoral
  (trail2_id, user3_id, 'CONSTRUCTION', 'Travaux secteur Lévis',
   'Travaux de voirie entre le km 18 et le km 21. Piste partiellement fermée. Contournement disponible.',
   'HIGH', 'CONFIRMED', 46.7200, -71.2500, 6, now() + interval '14 days'),

  (trail2_id, user1_id, 'DANGEROUS_GRAVEL', 'Gravier sur piste — descente',
   'Accumulation de gravier dans la descente vers Lévis. Surface glissante.',
   'HIGH', 'ACTIVE', 46.7400, -71.2300, 2, now() + interval '5 days'),

  -- Trail 3 : Montréal
  (trail3_id, user2_id, 'POOR_LIGHTING', 'Éclairage insuffisant tunnel',
   'Passage sous tunnel au Vieux-Port avec éclairage très faible. Lampe recommandée.',
   'MEDIUM', 'ACTIVE', 45.5020, -73.5600, 3, now() + interval '30 days'),

  (trail3_id, user3_id, 'HEAVY_TRAFFIC', 'Forte circulation boulevard',
   'Circulation automobile dense sur le tronçon partagé boulevard Saint-Laurent.',
   'HIGH', 'CONFIRMED', 45.5100, -73.5850, 5, now() + interval '1 day'),

  -- Trail 5 : Gravel Forêt
  (trail5_id, user1_id, 'FALLEN_TREE',  'Arbre tombé — km 12',
   'Arbre tombé en travers du sentier au km 12. Passage difficile mais possible.',
   'MEDIUM', 'ACTIVE', 47.0400, -71.1600, 2, now() + interval '5 days'),

  (trail5_id, user2_id, 'MUD',          'Zone très boueuse après montée',
   'La descente après le col est très boueuse sur 300m. VTT conseillé.',
   'HIGH', 'CONFIRMED', 47.0300, -71.1700, 4, now() + interval '3 days'),

  -- Trail 8 : Fjord
  (trail8_id, user3_id, 'ICE',          'Verglas matinal — prudence',
   'Verglas présent sur les sections à l''ombre le matin. Attendez 10h.',
   'CRITICAL', 'CONFIRMED', 48.3300, -70.8800, 7, now() + interval '2 days'),

  -- Trail 9 : Estrie
  (trail9_id, user1_id, 'POOR_SIGNAGE', 'Intersection mal signalée',
   'Intersection au km 15 sans panneau directionnel. Risque de se tromper de direction.',
   'LOW', 'ACTIVE', 45.4500, -71.9500, 1, now() + interval '14 days'),

  -- Sans piste spécifique (signalement général de zone)
  (NULL, user2_id, 'ROAD_HAZARD', 'Danger carrefour avenue',
   'Carrefour sans priorité vélo. Automobilistes agressifs. Extrême prudence.',
   'HIGH', 'ACTIVE', 45.5200, -73.5700, 3, now() + interval '30 days'),

  (NULL, user3_id, 'ANIMALS', 'Chevreuils sur la piste',
   'Trois chevreuils repérés traversant régulièrement la piste en début de matinée.',
   'LOW', 'ACTIVE', 47.0500, -71.3600, 0, now() + interval '7 days'),

  (trail1_id, user1_id, 'WATER_ACCUMULATION', 'Flaque après pluie',
   'Grande flaque d''eau sur la piste à la hauteur du kiosque. Évitable sur le côté.',
   'LOW', 'RESOLVED', 46.8175, -71.1850, 2, now() + interval '2 days'),

  (trail3_id, user2_id, 'OBSTACLE', 'Poubelle renversée',
   'Poubelle renversée sur la piste cyclable près du marché Atwater.',
   'LOW', 'RESOLVED', 45.4985, -73.5750, 0, now() - interval '1 day'),

  (trail2_id, user3_id, 'ACCIDENT', 'Chute de cycliste — km 8',
   'Chute signalée au km 8 suite au nid-de-poule. Cycliste légèrement blessé. Signalement d''avertissement.',
   'HIGH', 'CONFIRMED', 46.7800, -71.2200, 5, now() + interval '2 days');

-- ============================================================
-- AVIS SUR LES PISTES
-- ============================================================
INSERT INTO trail_reviews (trail_id, user_id, rating, comment) VALUES
  (trail1_id, user1_id, 5, 'Magnifique piste, parfaitement entretenue. Vue sur le Saint-Laurent à couper le souffle. Idéale pour les familles.'),
  (trail1_id, user2_id, 4, 'Très agréable, bien aménagée. Quelques cyclistes rapides parfois mais globalement très sécuritaire.'),
  (trail2_id, user3_id, 4, 'Beau parcours longeant le fleuve. Quelques montées surprenantes mais rien de difficile. Attention aux travaux section Lévis.'),
  (trail3_id, user1_id, 3, 'Pratique pour se déplacer en ville mais parfois stressant avec la circulation. Mieux les weekends.'),
  (trail4_id, user2_id, 5, 'Parfaite pour les familles avec enfants. Calme, nature, bien balisée. On revient chaque été.'),
  (trail5_id, user1_id, 5, 'Parcours exigeant mais tellement gratifiant ! La vue sur la chute Montmorency est un cadeau en bonus.'),
  (trail6_id, user3_id, 4, 'Piste plate et reposante. Idéale pour des sorties en soirée. Bien éclairée en ville.'),
  (trail8_id, user1_id, 5, 'Une des plus belles pistes du Québec ! Dénivelé important mais les vues sur le fjord valent chaque effort.'),
  (trail9_id, user2_id, 4, 'Voie verte bien entretenue. Paysages agréables. Quelques intersections à améliorer mais globalement excellent.'),
  (trail10_id, user3_id, 4, 'Circuit touristique parfait pour découvrir Montréal. Très touristique en été mais magnifique.');

-- ============================================================
-- FAVORIS
-- ============================================================
INSERT INTO favorites (user_id, trail_id, note) VALUES
  (user1_id, trail1_id, 'Ma piste préférée à Québec'),
  (user1_id, trail5_id, 'Pour les grandes sorties gravel'),
  (user1_id, trail8_id, 'Rêve de faire le fjord cet été'),
  (user2_id, trail4_id, 'Parfaite pour aller avec les enfants'),
  (user2_id, trail6_id, 'Sortie facile après le travail'),
  (user3_id, trail3_id, 'Mes déplacements quotidiens'),
  (user3_id, trail10_id, 'Pour faire visiter Montréal aux amis');

-- ============================================================
-- COLLECTIONS
-- ============================================================
INSERT INTO collections (id, user_id, name, description)
VALUES
  ('c0000000-0000-0000-0000-000000000001', user1_id, 'À faire cet été', 'Pistes que je veux absolument faire avant l''automne'),
  ('c0000000-0000-0000-0000-000000000002', user2_id, 'Sorties en famille', 'Pistes accessibles avec les enfants'),
  ('c0000000-0000-0000-0000-000000000003', user3_id, 'Montréal à vélo', 'Tous mes itinéraires montréalais');

INSERT INTO collection_trails (collection_id, trail_id) VALUES
  ('c0000000-0000-0000-0000-000000000001', trail5_id),
  ('c0000000-0000-0000-0000-000000000001', trail7_id),
  ('c0000000-0000-0000-0000-000000000001', trail8_id),
  ('c0000000-0000-0000-0000-000000000002', trail1_id),
  ('c0000000-0000-0000-0000-000000000002', trail4_id),
  ('c0000000-0000-0000-0000-000000000002', trail6_id),
  ('c0000000-0000-0000-0000-000000000003', trail3_id),
  ('c0000000-0000-0000-0000-000000000003', trail10_id);

-- ============================================================
-- SORTIES SAUVEGARDÉES
-- ============================================================
INSERT INTO rides (id, user_id, trail_id, title, started_at, ended_at,
  distance_km, duration_seconds, average_speed_kmh, max_speed_kmh,
  elevation_gain_m, elevation_loss_m, weather_summary, notes, status)
VALUES
  ('r0000000-0000-0000-0000-000000000001',
   user1_id, trail1_id, 'Sortie matinale Plaines',
   '2025-09-15 07:30:00', '2025-09-15 08:45:00',
   12.8, 4500, 18.2, 32.5, 88, 80,
   'Ensoleillé, 14°C, vent léger NE 12 km/h',
   'Super sortie, la piste était très calme le matin. Belle lumière.', 'COMPLETED'),

  ('r0000000-0000-0000-0000-000000000002',
   user1_id, trail2_id, 'Littoral complet A/R',
   '2025-08-22 09:00:00', '2025-08-22 12:30:00',
   57.1, 12600, 16.3, 45.8, 485, 480,
   'Partiellement nuageux, 19°C',
   'Belle journée malgré le vent sur la partie Lévis. Les travaux km 18 sont bien délimités.', 'COMPLETED'),

  ('r0000000-0000-0000-0000-000000000003',
   user2_id, trail4_id, 'Boucle familiale avec les enfants',
   '2025-08-10 10:00:00', '2025-08-10 11:30:00',
   8.5, 5400, 8.4, 18.2, 150, 150,
   'Ensoleillé, 22°C',
   'Les enfants ont adoré ! Superbe forêt et rivière. On recommence.', 'COMPLETED'),

  ('r0000000-0000-0000-0000-000000000004',
   user3_id, trail3_id, 'Trajet domicile-boulot',
   '2025-09-18 08:15:00', '2025-09-18 08:52:00',
   9.2, 2220, 14.9, 25.6, 55, 52,
   'Couvert, 12°C, risque de pluie 40%',
   'Pas eu de pluie finalement. Un peu de circulation rue Sherbrooke mais ok.', 'COMPLETED'),

  ('r0000000-0000-0000-0000-000000000005',
   user1_id, trail5_id, 'Gravel Montmorency — exploration',
   '2025-09-05 07:00:00', '2025-09-05 10:15:00',
   36.2, 11700, 11.1, 52.3, 635, 630,
   'Frais, 9°C départ, 16°C arrivée',
   'Parcours exigeant comme prévu. L''arbre tombé au km 12 est toujours là mais contournable. La vue sur la chute = incroyable.', 'COMPLETED');

-- ============================================================
-- SORTIES PLANIFIÉES
-- ============================================================
INSERT INTO planned_rides (user_id, trail_id, planned_date, planned_time, notes, status)
VALUES
  (user1_id, trail8_id, CURRENT_DATE + 14, '07:00:00', 'Préparer kit réparation et eau supplémentaire.', 'PLANNED'),
  (user2_id, trail1_id, CURRENT_DATE + 3,  '09:30:00', 'Sortie avec les voisins.', 'PLANNED'),
  (user3_id, trail10_id, CURRENT_DATE + 7, '10:00:00', 'Tour touristique avec amis en visite.', 'PLANNED');

END $$;
