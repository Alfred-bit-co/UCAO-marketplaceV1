import { Eye, Shield } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { PageShell } from "@/components/page-shell";
import { DEMO_ADMIN_STANDS } from "@/lib/constants";

export default function AdminPage() {
  return (
    <PageShell>
      <main>
        <PageHero icon={Shield} eyebrow="Administration" title="Validation des stands">
          Contrôlez les inscriptions et gardez la marketplace fiable.
        </PageHero>
        <section className="container-ucao panel my-10 mb-[84px] overflow-x-auto p-5">
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr>
                <th className="border-b border-ucao-line p-3.5 text-left dark:border-[#2a3a52]">Stand</th>
                <th className="border-b border-ucao-line p-3.5 text-left dark:border-[#2a3a52]">Responsable</th>
                <th className="border-b border-ucao-line p-3.5 text-left dark:border-[#2a3a52]">Statut</th>
                <th className="border-b border-ucao-line p-3.5 text-left dark:border-[#2a3a52]">Action</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_ADMIN_STANDS.map((stand) => (
                <tr key={stand.id}>
                  <td className="border-b border-ucao-line p-3.5 dark:border-[#2a3a52]">{stand.name}</td>
                  <td className="border-b border-ucao-line p-3.5 dark:border-[#2a3a52]">{stand.seller?.name}</td>
                  <td className="border-b border-ucao-line p-3.5 dark:border-[#2a3a52]">Validé</td>
                  <td className="border-b border-ucao-line p-3.5 dark:border-[#2a3a52]">
                    <button className="btn btn-ghost" type="button">
                      <Eye size={18} /> Voir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </PageShell>
  );
}
