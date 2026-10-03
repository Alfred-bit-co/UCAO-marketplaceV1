-- 1) Index sur les clés étrangères signalées par l'advisor Supabase ("Unindexed foreign keys").
--    Sans index, les jointures et les suppressions en cascade ralentissent quand les tables grossissent.
--    "if not exists" : le script peut être relancé sans erreur.
--
-- 2) Retire l'accès à l'ancienne fonction submit_student_id(text), remplacée par
--    submit_student_verification(...). Elle n'est plus appelée par le frontend ni par le backend
--    et n'avait pas la garde "compte déjà vérifié".

begin;

create index if not exists idx_stands_user_id              on public.stands (user_id);
create index if not exists idx_products_user_id            on public.products (user_id);
create index if not exists idx_products_stand_id           on public.products (stand_id);
create index if not exists idx_product_images_product_id   on public.product_images (product_id);
create index if not exists idx_orders_user_id              on public.orders (user_id);
create index if not exists idx_order_items_order_id        on public.order_items (order_id);
create index if not exists idx_order_items_product_id      on public.order_items (product_id);
create index if not exists idx_subscription_payments_user_id on public.subscription_payments (user_id);
create index if not exists idx_clubs_created_by            on public.clubs (created_by);

revoke execute on function public.submit_student_id(text) from public, anon, authenticated;

commit;

-- ===== ROLLBACK (seulement si quelque chose casse) =====
-- grant execute on function public.submit_student_id(text) to authenticated;
-- Les index peuvent rester : ils sont sans danger.