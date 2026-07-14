import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { RoleBadge } from "@/components/role-badge";
import { getStandById } from "@/lib/stands";

export default async function StandDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const stand = await getStandById(id);

  return (
    <PageShell>
      <main className="container-ucao grid gap-8 py-[54px] md:grid-cols-2">
        {stand && (
          <>
            <div className="relative min-h-[420px] overflow-hidden rounded-ucao shadow-ucao">
              <Image
                src={stand.banner_url || "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=85"}
                alt={stand.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            <section>
              <RoleBadge role={stand.seller_role} />
              <h1 className="my-4 text-[clamp(34px,5vw,52px)] font-bold leading-tight">{stand.name}</h1>
              <p className="text-ucao-muted dark:text-[#a8b8cc]">{stand.description}</p>
              <div className="my-5 rounded-ucao bg-ucao-soft p-[18px] dark:bg-[#132238]">
                <h2 className="text-xl font-bold">Responsable</h2>
                <p>
                  <strong>{stand.seller?.name || "Vendeur UCAO"}</strong>
                </p>
                <p>Rôle : {stand.seller?.role || stand.seller_role || "SIMPLE"}</p>
              </div>
              <Link className="btn btn-primary" href="/stands">
                <ArrowLeft size={18} /> Retour aux stands
              </Link>
            </section>
          </>
        )}
      </main>
    </PageShell>
  );
}
