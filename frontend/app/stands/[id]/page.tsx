import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { RoleBadge } from "@/components/role-badge";
import { getStandById } from "@/lib/stands";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { IMAGE_ASSETS } from "@/lib/constants";

export default async function StandDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const stand = await getStandById(id);
  if (!stand) notFound();
  const whatsapp = buildWhatsAppUrl(stand.seller?.phone);
  return (
    <PageShell>
      <main className="container-ucao grid gap-8 py-[54px] md:grid-cols-2">
        <>
            <div className="relative min-h-[420px] overflow-hidden rounded-ucao shadow-ucao">
              <Image
                src={stand.banner_url || IMAGE_ASSETS.standFallback}
                alt={stand.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            <section>
              <RoleBadge tier={stand.seller_tier} />
              <h1 className="my-4 text-[clamp(34px,5vw,52px)] font-bold leading-tight">{stand.name}</h1>
              <section className="my-5 rounded-ucao bg-ucao-soft p-[18px] dark:bg-[#132238]">
                <h2 className="mb-2 text-xl font-bold">Description du stand</h2>
                <p className="text-ucao-muted dark:text-[#a8b8cc]">{stand.description}</p>
              </section>
              <div className="my-5 rounded-ucao bg-ucao-soft p-[18px] dark:bg-[#132238]">
                <h2 className="text-xl font-bold">Responsable</h2>
                <p>
                  <strong>{stand.seller?.name || "Vendeur UCAO"}</strong>
                </p>
                <p>Palier : {stand.seller?.subscription_tier ?? stand.seller_tier ?? "STANDARD"}</p>
                <p>Contact : {stand.seller?.phone || "Non renseigné"}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                {whatsapp && (
                  <a className="btn btn-primary" href={whatsapp} target="_blank" rel="noopener noreferrer">
                    <MessageCircle size={18} /> Discuter sur WhatsApp
                  </a>
                )}
                <Link className="btn btn-ghost" href="/stands">
                  <ArrowLeft size={18} /> Retour aux stands
                </Link>
              </div>
            </section>
        </>
      </main>
    </PageShell>
  );
}
