-- =====================================================================
-- UCAO Marketplace — Nettoyage des noms et descriptions des 12 produits du compte VIP de test
--
-- Seuls `name` et `description` changent : prix, images, catégories, stands et dates sont conservés.
-- Aucun produit n'est supprimé. Chaque mise à jour est limitée au compte
-- 0abe7373-34bc-4e4c-8a89-b2a0bfb95981 (sécurité si un identifiant était faux).
--
-- À exécuter dans Supabase > SQL Editor. Contrôle fait avant écriture (lecture seule, 03/11/2026) :
-- les 12 identifiants existent et appartiennent tous à ce compte, qui n'a pas d'autre produit.
-- =====================================================================

begin;

update public.products
   set name = 'Riz au poulet à emporter',
       description = 'Riz au poulet, à emporter.'
 where id = '02e9bf00-730f-4169-9b57-e46811c757e9'
   and user_id = '0abe7373-34bc-4e4c-8a89-b2a0bfb95981';

update public.products
   set name = 'Alloco des Rois',
       description = 'Alloco sucré, comme tu l''aimes.'
 where id = 'b0f48954-16c9-4996-a98b-27d0c042c6df'
   and user_id = '0abe7373-34bc-4e4c-8a89-b2a0bfb95981';

update public.products
   set name = 'Ayimolou choco',
       description = 'Viens manger ton ayimolou, à partir de 200 FCFA. Tu ne seras pas déçu.'
 where id = '0f64ff72-7771-4bea-a570-677d77549db8'
   and user_id = '0abe7373-34bc-4e4c-8a89-b2a0bfb95981';

update public.products
   set name = 'Frites + poulet',
       description = 'Tchalé, paye, tu ne seras pas déçu. 😉✌️'
 where id = '3ed8e09a-a8a4-4d58-a55a-da175ab58217'
   and user_id = '0abe7373-34bc-4e4c-8a89-b2a0bfb95981';

update public.products
   set name = 'Jus de fruits',
       description = 'Compose ton jus de fruits toi-même. Livraison gratuite au sein de l''université.'
 where id = '3ced0161-30e5-4745-b2f8-ff28f5f98405'
   and user_id = '0abe7373-34bc-4e4c-8a89-b2a0bfb95981';

update public.products
   set name = 'Salade de fruits',
       description = 'Compose ta salade avec les fruits de ton choix.'
 where id = '64c540d3-a749-44cf-aeba-92bfd7e5537d'
   and user_id = '0abe7373-34bc-4e4c-8a89-b2a0bfb95981';

update public.products
   set name = 'PC gaming ASUS ROG Zephyrus',
       description = 'PC gaming ASUS ROG Zephyrus. Contacte-moi pour les caractéristiques.'
 where id = 'f6f60fd9-70a2-4262-b89d-ea34efc7fc04'
   and user_id = '0abe7373-34bc-4e4c-8a89-b2a0bfb95981';

update public.products
   set name = 'Adaptateur pour PC',
       description = 'Adaptateur pour ordinateur portable. Contacte-moi pour la compatibilité.'
 where id = 'b7816f63-7604-4c27-a76e-42f143305e9e'
   and user_id = '0abe7373-34bc-4e4c-8a89-b2a0bfb95981';

update public.products
   set name = 'Joli pull',
       description = 'Pull doux et confortable. Contacte-moi pour la taille et la couleur.'
 where id = 'dee833d7-45ad-4848-a476-33a6d9108ecf'
   and user_id = '0abe7373-34bc-4e4c-8a89-b2a0bfb95981';

update public.products
   set name = 'Bague homme — modèle 1',
       description = 'Bague pour homme. Contacte-moi pour la taille.'
 where id = 'ee36e39e-4ea1-49a7-877f-f15fa2f30214'
   and user_id = '0abe7373-34bc-4e4c-8a89-b2a0bfb95981';

update public.products
   set name = 'Bague homme — modèle 2',
       description = 'Bague pour homme. Contacte-moi pour la taille.'
 where id = 'ab922d6e-80c0-4dd1-98ed-a38983a2a022'
   and user_id = '0abe7373-34bc-4e4c-8a89-b2a0bfb95981';

update public.products
   set name = 'Sac à main noir pour femme',
       description = 'Sac à main noir pour femme. Contacte-moi pour plus de photos.'
 where id = '978c1ec9-04d2-4271-854d-e5caadc3d296'
   and user_id = '0abe7373-34bc-4e4c-8a89-b2a0bfb95981';

commit;

-- Vérification : les 12 produits du compte, avec leurs nouveaux textes.
select id, name, description from public.products where user_id = '0abe7373-34bc-4e4c-8a89-b2a0bfb95981' order by created_at;
