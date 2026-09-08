"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AdminStats, MonthlySignup, RoleCount, TierCount } from "@/lib/admin";
import { cn } from "@/lib/utils";

const CHART_COLORS = {
  navy: "#1e2a6e",
  red: "#7a1e2d",
  green: "#2e7d5b",
  gold: "#9a4a55",
  soft: "#e8ebf8",
};

const ROLE_COLORS: Record<string, string> = {
  ACHETEUR: CHART_COLORS.navy,
  VENDEUR: CHART_COLORS.red,
  ADMIN: CHART_COLORS.green,
};

const TIER_COLORS: Record<string, string> = {
  STANDARD: CHART_COLORS.navy,
  PREMIUM: CHART_COLORS.red,
  VIP: CHART_COLORS.green,
};

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; name: string; color?: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-ucao border border-ucao-line bg-white px-3 py-2 text-sm shadow-ucao dark:border-[#2a3a52] dark:bg-[#0b1c31]">
      {label && <p className="mb-1 font-bold">{label}</p>}
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name} : <strong>{entry.value}</strong>
        </p>
      ))}
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: number;
  hint?: string;
  accent: "red" | "green" | "navy" | "gold";
}) {
  const accents = {
    red: "border-l-ucao-red",
    green: "border-l-ucao-success",
    navy: "border-l-ucao-navy",
    gold: "border-l-[#9a4a55]",
  };
  return (
    <article className={cn("panel border-l-4 p-5 transition hover:-translate-y-0.5 hover:shadow-ucao", accents[accent])}>
      <p className="text-sm font-bold uppercase tracking-wide text-ucao-muted dark:text-[#a8b8cc]">{label}</p>
      <p className="mt-2 text-4xl font-black">{value.toLocaleString("fr-FR")}</p>
      {hint && <p className="mt-1 text-sm text-ucao-muted dark:text-[#a8b8cc]">{hint}</p>}
    </article>
  );
}

export function AdminCharts({
  stats,
  signups,
  productPublishes,
  userSignups,
  roles,
  tiers,
}: {
  stats: AdminStats;
  signups: MonthlySignup[];
  productPublishes: MonthlySignup[];
  userSignups: MonthlySignup[];
  roles: RoleCount[];
  tiers: TierCount[];
}) {
  const roleData = roles.map((item) => ({ name: item.role, value: item.count }));
  const tierData = tiers.map((item) => ({ name: item.tier, value: item.count }));
  const vendorData = signups.map((item) => ({
    month: item.month,
    vendeurs: item.count,
  }));
  const productData = productPublishes.map((item) => ({ month: item.month, produits: item.count }));
  const allSignups = userSignups.map((item) => ({
    month: item.month,
    inscriptions: item.count,
  }));

  return (
    <div className="space-y-6">
      <div className="hidden">
        <StatCard label="Utilisateurs" value={stats.totalUsers} hint="Comptes enregistrés" accent="navy" />
        <StatCard label="Vendeurs actifs" value={stats.totalVendors} hint="Abonnements en cours" accent="red" />
        <StatCard label="Produits publiés" value={stats.totalProducts} accent="green" />
        <StatCard
          label="Vérifications en attente"
          value={stats.pendingVerifications}
          hint={`${stats.pendingStands} stand(s) à valider`}
          accent="gold"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="panel p-5">
          <p className="eyebrow mb-1">Activité</p>
          <h2 className="mb-4 text-xl font-bold">Inscriptions par mois</h2>
          <div className="h-[280px]">
            {allSignups.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={allSignups}>
                  <defs>
                    <linearGradient id="signupGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.navy} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={CHART_COLORS.navy} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7edf3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="inscriptions"
                    name="Inscriptions"
                    stroke={CHART_COLORS.navy}
                    fill="url(#signupGradient)"
                    strokeWidth={2.5}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-ucao-muted dark:text-[#a8b8cc]">Pas encore de données d&apos;inscription.</p>
            )}
          </div>
        </article>

        <article className="panel p-5">
          <p className="eyebrow mb-1">Monétisation</p>
          <h2 className="mb-4 text-xl font-bold">Nouveaux vendeurs par mois</h2>
          <div className="h-[280px]">
            {vendorData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vendorData}>
                  <defs><linearGradient id="vendorBarGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={CHART_COLORS.red} /><stop offset="100%" stopColor={CHART_COLORS.navy} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7edf3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="vendeurs" name="Vendeurs" fill="url(#vendorBarGradient)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-ucao-muted dark:text-[#a8b8cc]">Aucune souscription payée enregistrée.</p>
            )}
          </div>
        </article>
      </div>

      <article className="panel p-5">
        <p className="eyebrow mb-1">Catalogue</p>
        <h2 className="mb-4 text-xl font-bold">Produits publiés par mois</h2>
        <div className="h-[280px]">{productData.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={productData}><CartesianGrid strokeDasharray="3 3" stroke="#e7edf3" /><XAxis dataKey="month" tick={{ fontSize: 12 }} /><YAxis allowDecimals={false} tick={{ fontSize: 12 }} /><Tooltip content={<ChartTooltip />} /><Bar dataKey="produits" name="Produits" fill={CHART_COLORS.green} radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer> : <p className="text-ucao-muted">Aucune donnée de publication.</p>}</div>
      </article>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="panel p-5">
          <p className="eyebrow mb-1">Communauté</p>
          <h2 className="mb-4 text-xl font-bold">Répartition par rôle</h2>
          <div className="h-[280px]">
            {roleData.some((item) => item.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roleData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={3}
                  >
                    {roleData.map((entry) => (
                      <Cell key={entry.name} fill={ROLE_COLORS[entry.name] ?? CHART_COLORS.navy} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-ucao-muted dark:text-[#a8b8cc]">Aucun utilisateur.</p>
            )}
          </div>
        </article>

        <article className="panel p-5">
          <p className="eyebrow mb-1">Abonnements</p>
          <h2 className="mb-4 text-xl font-bold">Paliers vendeurs</h2>
          <div className="h-[280px]">
            {tierData.some((item) => item.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={tierData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={3}>
                    {tierData.map((entry) => (
                      <Cell key={entry.name} fill={TIER_COLORS[entry.name] ?? CHART_COLORS.red} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-ucao-muted dark:text-[#a8b8cc]">Aucun vendeur abonné.</p>
            )}
          </div>
        </article>
      </div>

      <article className="panel p-5">
        <p className="eyebrow mb-1">Confiance</p>
        <h2 className="text-xl font-bold">Modération & avis</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-ucao bg-ucao-soft p-4 dark:bg-[#132238]">
            <p className="text-sm text-ucao-muted dark:text-[#a8b8cc]">Avis total</p>
            <p className="text-3xl font-black">{stats.totalReviews}</p>
          </div>
          <div className="rounded-ucao bg-ucao-success-soft p-4 dark:bg-[#123628]">
            <p className="text-sm text-ucao-success">Avis validés</p>
            <p className="text-3xl font-black text-ucao-success">{stats.approvedReviews}</p>
          </div>
          <div className="rounded-ucao bg-ucao-red-soft p-4 dark:bg-[#3a1a1c]">
            <p className="text-sm text-ucao-red">Stands en attente</p>
            <p className="text-3xl font-black text-ucao-red">{stats.pendingStands}</p>
          </div>
        </div>
      </article>
    </div>
  );
}
