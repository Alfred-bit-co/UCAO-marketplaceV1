-- Limites de taille et de type sur les buckets de stockage (audit SEC-03).
-- Appliquee en production le 2026-10-25. Ne modifie pas les fichiers existants.
update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg','image/jpg','image/png','image/webp','image/avif']
where id in ('marketplace-media', 'student-ids');
