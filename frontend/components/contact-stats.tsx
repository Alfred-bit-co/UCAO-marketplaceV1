"use client";

import { useEffect, useState } from "react";
import { MessageCircle } from "@/lib/icons";
import { getMyContactStats, type ContactStat } from "@/lib/contacts";
import type { Product } from "@/lib/types";

/**
 * Bloc du tableau de bord : combien de personnes ont cliqué sur « Contacter » pour chaque produit.
 * Caché si le compteur n'est pas encore disponible côté base.
 */
export function ContactStats({ products }: { products: Product[] }) {
  const [stats, setStats] = useState<Map<string, ContactStat> | null>(null);

  useEffect(() => {
    let active = true;
    getMyContactStats().then((result) => {
      if (active) setStats(result);
    });
    return () => {
      active = false;
    };
  }, [products]);

  if (!stats) return null;

  const rows = products
    .map((product) => ({ product, stat: stats.get(String(product.id)) ?? { total: 0, last7Days: 0 } }))
    .sort((a, b) => b.stat.last7Days - a.stat.last7Days || b.stat.total - a.stat.total);
  const week = rows.reduce((sum, row) => sum + row.stat.last7Days, 0);
  const total = rows.reduce((sum, row) => sum + row.stat.total, 0);

  return (
    <section className="container-ucao mt-5">
      <article className="panel p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Contacts WhatsApp</p>
            <h2 className="text-2xl font-bold">
              {week === 0
                ? "Aucun contact cette semaine"
                : `${week} personne${week > 1 ? "s" : ""} vous ${week > 1 ? "ont" : "a"} contacté cette semaine`}
            </h2>
            <p className="mt-1 text-sm text-ucao-muted dark:text-[#a8b8cc]">
              {total} au total · une personne est comptée une fois par produit et par jour.
            </p>
          </div>
          <span className="grid size-10 place-items-center rounded-full bg-ucao-success-soft text-ucao-success">
            <MessageCircle size={18} aria-hidden="true" />
          </span>
        </div>

        {rows.length > 0 && (
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {rows.map(({ product, stat }) => (
              <li
                key={product.id}
                className="flex items-center justify-between gap-3 rounded-ucao border border-ucao-line p-3 dark:border-[#263d5c]"
              >
                <p className="min-w-0 truncate font-medium">{product.name}</p>
                <p className="shrink-0 text-sm text-ucao-muted dark:text-[#a8b8cc]">
                  <strong className="text-ucao-ink dark:text-white">{stat.last7Days}</strong> cette semaine · {stat.total} au total
                </p>
              </li>
            ))}
          </ul>
        )}
      </article>
    </section>
  );
}
