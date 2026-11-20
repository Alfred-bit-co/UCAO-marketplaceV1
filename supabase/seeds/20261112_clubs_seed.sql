-- =====================================================================
-- SEED — NON EXÉCUTÉ. À lancer une seule fois dans le SQL Editor de Supabase,
-- après la migration 20261112_clubs_management.sql.
--
-- Remplissage initial de la table public.clubs à partir de l'ancien catalogue écrit en dur
-- (frontend/lib/club-catalog.ts, supprimé par la branche feat/espace-clubs) :
--   - mêmes images (fichiers de frontend/public/images/clubs/), mêmes numéros WhatsApp
--     (null pour le club Jeux vidéo, qui n'en avait pas), même ordre d'affichage ;
--   - une couleur différente par club, prise dans la palette de frontend/lib/club-colors.ts.
--
-- Vérification avant exécution (la table doit être vide, sinon adapter) :
--   select count(*) from public.clubs;
-- =====================================================================

begin;

insert into public.clubs (name, short_description, banner_url, external_url, whatsapp, sort_order, color, is_active)
values
  ('Basketball', 'Le club de basketball de l''UCAO, c''est plus qu''un sport : c''est une équipe, une discipline et une passion partagée. Que tu sois débutant ou confirmé, viens vivre l''aventure sur le terrain avec nous !', '/images/clubs/basketball.jpg', null, '+22891268956', 10, '#1E88E5', true),
  ('Théâtre', 'Le club de théâtre t''invite à explorer ta créativité, à développer ta confiance en toi et à partager des émotions fortes sur scène. Que tu sois acteur, metteur en scène ou simple passionné, il y a une place pour toi !', '/images/clubs/theatre.jpg', null, '+22890895459', 20, '#E53935', true),
  ('Jeux vidéo', 'Le club de jeux vidéo, c''est l''endroit où la passion du gaming prend vie. Affronte tes amis, participe à des tournois, découvre de nouveaux jeux et partage ta passion avec une communauté motivée.', '/images/clubs/jeux-video.jpg', null, null, 30, '#43A047', true),
  ('Football', 'Le club de football de l''UCAO, c''est le terrain, l''esprit d''équipe et la passion du ballon rond. Que tu sois attaquant, gardien ou simple supporter, viens partager des matchs et des entraînements dans une bonne ambiance !', '/images/clubs/football.jpg', null, '+22890593302', 40, '#FB8C00', true),
  ('Communication', 'Le club de communication de l''UCAO est l''endroit pour apprendre à captiver un public : prise de parole, réseaux sociaux et création de contenu. Viens développer ton style et donner de la voix aux projets du campus !', '/images/clubs/communication.jpg', null, '+22892424746', 50, '#8E24AA', true),
  ('Juristes', 'Le club des juristes de l''UCAO réunit des étudiants curieux du droit et de la justice. Débats, discussions et projets autour du droit : viens aiguiser ton esprit critique et ta rigueur !', '/images/clubs/juristes.jpg', null, '+22879760544', 60, '#4DD0E1', true),
  ('Pétanque', 'Le club de pétanque de l''UCAO, c''est la précision, la stratégie et la convivialité. Viens jouer entre amis, apprendre les bons gestes et profiter d''un moment de détente entre deux cours !', '/images/clubs/petanque.jpg', null, '+22871840656', 70, '#EC407A', true),
  ('Volley', 'Le club de volley de l''UCAO, c''est le rythme, la cohésion et l''énergie d''une équipe qui se renvoie la balle. Que tu sois débutant ou confirmé, viens jouer, progresser et te faire de nouveaux amis !', '/images/clubs/volley.jpg', null, '+22899547116', 80, '#FDD835', true),
  ('Chorale', 'La chorale de l''UCAO réunit des voix de tous horizons autour de la même passion : la musique. Que tu chantes depuis toujours ou que tu veuilles essayer, viens trouver ta voix dans l''harmonie du groupe !', '/images/clubs/chorale.jpg', null, '+22897549116', 90, '#6D4C41', true),
  ('Danse', 'Le club de danse de l''UCAO, c''est le rythme, l''énergie et la créativité en mouvement. Que tu danses depuis toujours ou que tu fasses tes premiers pas, viens apprendre, t''exprimer et partager ta passion avec le groupe !', '/images/clubs/dance.jpg', null, '+22897838098', 100, '#00897B', true),
  ('Cybersécurité', 'Le club de cybersécurité de l''UCAO t''invite à découvrir les bases de la sécurité informatique, à pratiquer lors d''ateliers et de défis CTF, et à adopter les bons réflexes pour te protéger en ligne. Que tu sois débutant curieux ou passionné confirmé, viens apprendre en équipe !', '/images/clubs/cyber.jpg', null, '+22896548352', 110, '#3949AB', true),
  ('Échecs', 'Le club d''échecs de l''UCAO, c''est la stratégie, la concentration et le plaisir de la réflexion. Que tu connaisses à peine les règles ou que tu joues depuis des années, viens t''entraîner, affronter d''autres passionnés et progresser à chaque partie !', '/images/clubs/echecs.jpg', null, '+22873267889', 120, '#9CCC65', true),
  ('Orchestre', 'Le club d''orchestre de l''UCAO rassemble des musiciens de tous niveaux autour d''un même projet : jouer ensemble. Instrument à vent, à cordes ou percussions, viens répéter, partager ta passion et faire vivre la musique sur le campus !', '/images/clubs/orchestra.jpg', null, '+22891209262', 130, '#827717', true),
  ('Anglais', 'Le club d''anglais de l''UCAO t''aide à gagner en aisance à l''oral, dans une ambiance détendue : discussions, jeux, films et petits défis. Que tu sois débutant ou déjà à l''aise, viens pratiquer et prendre confiance en toi !', '/images/clubs/odette.jpg', null, '+22890383821', 140, '#546E7A', true),
  ('Robotique', 'Le club de robotique de l''UCAO t''invite à concevoir, assembler et programmer des robots en équipe. Électronique, mécanique et code : que tu sois débutant curieux ou déjà bricoleur, viens apprendre en pratiquant !', '/images/clubs/robot.jpg', null, '+22891295950', 150, '#C0CA33', true);

commit;

-- ===== VÉRIFICATION APRÈS EXÉCUTION =====
-- select name, color, whatsapp, sort_order from public.clubs order by sort_order;

-- ===== RETOUR EN ARRIÈRE =====
-- delete from public.clubs where created_by is null and created_at > now() - interval '1 hour';
