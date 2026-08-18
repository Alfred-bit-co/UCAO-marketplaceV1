"use client";
import { Headset, Package, ShieldCheck, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";

export function PlatformStats({
  initialProducts,
  initialVendors,
}: {
  initialProducts: number;
  initialVendors: number;
}) {
  const [products, setProducts] = useState(initialProducts);
  const [vendors, setVendors] = useState(initialVendors);
  const countedVendorIds = useRef(new Set<string>());

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    const channel = supabase
      .channel("platform-stats")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "products" }, () => {
        setProducts((value) => value + 1);
      })
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: "role=eq.VENDEUR" },
        (payload: any) => {
          const id = payload.new?.id as string | undefined;
          if (id && !countedVendorIds.current.has(id)) {
            countedVendorIds.current.add(id);
            setVendors((value) => value + 1);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const stats = [
    { Icon: Package, value: `${products}+`, label: "Produits disponibles" },
    { Icon: Users, value: `${vendors}+`, label: "Étudiants vendeurs" },
    { Icon: ShieldCheck, value: "Vérifiés", label: "Vendeurs vérifiés" },
    { Icon: Headset, value: "Réactif", label: "Support disponible" },
  ];

  return (
    <section className="container-ucao py-[64px]">
      <div className="relative overflow-hidden rounded-ucao bg-[linear-gradient(120deg,#1E2A6E,#2C3A7A_60%,#7A1E2D)] p-8 text-white shadow-ucao">
        <h2 className="mb-6 text-center text-2xl font-bold">UCAO Marketplace en chiffres</h2>
        <div className="grid gap-6 sm:grid-cols-4">
          {stats.map(({ Icon, value, label }) => (
            <div key={label} className="text-center">
              <Icon className="mx-auto mb-2" size={28} />
              <p className="text-3xl font-black">{value}</p>
              <p className="text-sm text-white/80">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 