"use client";

import { AlertTriangle, Check, IdCard, X } from "@/lib/icons";
import type { DuplicateFlag, DuplicateKind } from "@/lib/trial";
import type { Profile } from "@/lib/types";
import { cn } from "@/lib/utils";

type AdminVerificationsProps = {
  verifications: Profile[];
  flags: Record<string, DuplicateFlag>;
  onViewCard: (path: string) => void | Promise<void>;
  onDecide: (id: string, status: "approved" | "rejected", note?: string) => void | Promise<void>;
};

const KIND_LABELS: Record<DuplicateKind, string> = {
  phone: "même numéro de téléphone",
  email: "même adresse e-mail (variantes Gmail comprises)",
  card: "même fichier de carte d'étudiant",
  identity: "même nom, filière et niveau d'étude",
};

function formatDate(iso: string | null) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(date);
}

function describeFlag(flag: DuplicateFlag) {
  const date = formatDate(flag.earliestSeenAt);
  const parts: string[] = [];

  parts.push(
    flag.previousAccounts > 1
      ? `${flag.previousAccounts} comptes précédents${date ? `, le plus ancien du ${date}` : ""}`
      : `Compte précédent${date ? ` du ${date}` : ""}`,
  );
  if (flag.anyPreviousDeleted) parts.push("ancien compte supprimé");
  parts.push(flag.kinds.map((kind) => KIND_LABELS[kind] ?? kind).join(", "));
  if (flag.trialAlreadyUsed) parts.push("essai gratuit déjà utilisé");

  return parts.join(" · ");
}

export function AdminVerifications({ verifications, flags, onViewCard, onDecide }: AdminVerificationsProps) {
  const flaggedCount = verifications.filter((user) => flags[user.id]).length;

  return (
    <article className="panel p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Priorité</p>
          <h2 className="text-2xl font-bold">Vérifications étudiantes</h2>
          {flaggedCount > 0 && (
            <p className="mt-1 text-sm font-medium text-ucao-red">
              {flaggedCount} compte{flaggedCount > 1 ? "s" : ""} à examiner de près (doublon possible)
            </p>
          )}
        </div>
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ucao-red-soft text-ucao-red">
          <IdCard size={18} />
        </span>
      </div>

      {verifications.length ? (
        <ul className="space-y-3">
          {verifications.map((user) => {
            const flag = flags[user.id];
            return (
              <li
                key={user.id}
                className={cn(
                  "rounded-ucao p-4",
                  !flag && "bg-ucao-soft dark:bg-[#132238]",
                  flag?.strong && "border border-ucao-red bg-ucao-red-soft dark:bg-[#3a1a1c]",
                  flag && !flag.strong && "border border-amber-300 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/40",
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold">{user.full_name}</p>
                    <p className="truncate text-sm text-ucao-muted">{user.email}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {user.student_id_url && (
                      <button
                        className="btn btn-ghost min-h-9 px-3 text-xs"
                        type="button"
                        onClick={() => void onViewCard(user.student_id_url!)}
                      >
                        <IdCard size={14} /> Voir la carte
                      </button>
                    )}
                    <button
                      className="btn btn-primary min-h-9 px-3 text-xs"
                      type="button"
                      onClick={() => void onDecide(user.id, "approved")}
                    >
                      <Check size={14} /> Valider
                    </button>
                    <button
                      className="btn btn-ghost min-h-9 px-3 text-xs"
                      type="button"
                      onClick={() =>
                        void onDecide(user.id, "rejected", window.prompt("Motif du refus (optionnel) :") || undefined)
                      }
                    >
                      <X size={14} /> Rejeter
                    </button>
                  </div>
                </div>

                {flag && (
                  <div
                    role="note"
                    className={cn(
                      "mt-3 flex items-start gap-2 border-t pt-3 text-sm",
                      flag.strong
                        ? "border-ucao-red/30 text-ucao-red"
                        : "border-amber-300 text-amber-900 dark:border-amber-900/60 dark:text-amber-100",
                    )}
                  >
                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                    <p>
                      <strong className="font-bold">
                        {flag.strong ? "Cet utilisateur s'est déjà inscrit une fois." : "Possible doublon, à vérifier."}
                      </strong>{" "}
                      <span className="opacity-90">{describeFlag(flag)}</span>
                    </p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="rounded-ucao bg-ucao-success-soft p-5 font-medium text-ucao-success">
          Aucune vérification en attente.
        </p>
      )}
    </article>
  );
}
