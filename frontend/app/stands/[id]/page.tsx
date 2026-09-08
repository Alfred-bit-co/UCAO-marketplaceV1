import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageCircle } from "@/lib/icons";
import { PageShell } from "@/components/page-shell";
import { RoleBadge } from "@/components/role-badge";
import { SITE_URL } from "@/lib/constants";
import { getStandById } from "@/lib/stands";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { IMAGE_ASSETS } from "@/lib/constants";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const stand = await getStandById(id);
  if (!stand) return { title: "Stand introuvable — UCAO Marketplace" };

  const description = stand.description.slice(0, 160);
  return {
    title: `${stand.name} — UCAO Marketplace`,
    description,
    openGraph: {
      title: stand.name,
      description,
      type: "website",
      url: `${SITE_URL}/stands/${id}`,
      images: stand.banner_url ? [{ url: stand.banner_url, alt: stand.name }] : undefined,
    },
  };
}

export default async function StandDetailPage({ params }: Props) {
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
              <h1 className="my-4 text-[clamp(34px,5vw,52px)] font-medium leading-tight">{stand.name}</h1>
              <section className="my-5 rounded-ucao bg-ucao-soft p-[18px] dark:bg-[#132238]">
                <h2 className="mb-2 text-xl font-medium">Description du stand</h2>
                <p className="text-ucao-muted dark:text-[#a8b8cc]">{stand.description}</p>
              </section>
              <div className="my-5 rounded-ucao bg-ucao-soft p-[18px] dark:bg-[#132238]">
                <h2 className="text-xl font-medium">Responsable</h2>
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
