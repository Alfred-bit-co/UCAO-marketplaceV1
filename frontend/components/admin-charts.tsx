"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AdminStats, MonthlySignup, RoleCount, TierCount } from "@/lib/admin";

// The Google Forms-like treatment keeps every chart easy to scan at a glance.
const PURPLE = "#1e2a6e";
const PIE_COLORS = ["#1e2a6e", "#7a1e2d", "#2e7d5b"];

type ChartItem = { name: string; value: number; label: string };

function formatPercent(value: number, total: number) {
  if (!total) return "0 %";
  const percent = (value / total) * 100;
  return `${percent.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
}

function addLabels(items: { name: string; value: number }[]): ChartItem[] {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  return items.map((item) => ({
    ...item,
    label: `${item.value.toLocaleString("fr-FR")} (${formatPercent(item.value, total)})`,
  }));
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#202124] shadow-md dark:border-[#34455e] dark:bg-[#10233b] dark:text-white">
      {label && <p className="mb-1 font-medium">{label}</p>}
      {payload.map((item) => <p key={item.name}>{item.name} : <strong>{item.value.toLocaleString("fr-FR")}</strong></p>)}
    </div>
  );
}

function ChartCard({ title, count, countLabel, children }: { title: string; count: number; countLabel: string; children: React.ReactNode }) {
  return (
    <article className="panel overflow-hidden p-5 sm:p-6">
      <h2 className="text-lg font-medium text-[#202124] dark:text-white">{title}</h2>
      <p className="mt-1 text-sm text-[#3c4043] dark:text-[#c5d0df]">{count.toLocaleString("fr-FR")} {countLabel}</p>
      <div className="mt-5 h-[290px]">{children}</div>
    </article>
  );
}

function VerticalBars({ data, valueName }: { data: ChartItem[]; valueName: string }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 28, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#e8eaed" />
        <XAxis dataKey="name" tick={{ fill: "#3c4043", fontSize: 12 }} axisLine={{ stroke: "#3c4043" }} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fill: "#5f6368", fontSize: 12 }} axisLine={false} tickLine={false} />
        <Tooltip content={<ChartTooltip />} />
        <Bar dataKey="value" name={valueName} fill={PURPLE} radius={[2, 2, 0, 0]} maxBarSize={58}>
          <LabelList dataKey="label" position="top" fill="#202124" fontSize={12} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function HorizontalBars({ data, valueName }: { data: ChartItem[]; valueName: string }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 88, left: 20, bottom: 0 }} barCategoryGap="24%">
        <CartesianGrid horizontal={false} stroke="#e8eaed" />
        <XAxis type="number" allowDecimals={false} tick={{ fill: "#5f6368", fontSize: 12 }} axisLine={{ stroke: "#dadce0" }} tickLine={false} />
        <YAxis type="category" dataKey="name" width={90} tick={{ fill: "#3c4043", fontSize: 12 }} axisLine={false} tickLine={false} />
        <Tooltip content={<ChartTooltip />} />
        <Bar dataKey="value" name={valueName} fill={PURPLE} radius={[0, 2, 2, 0]} maxBarSize={27}>
          <LabelList dataKey="label" position="right" fill="#202124" fontSize={12} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function DistributionPie({ data }: { data: ChartItem[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="38%" cy="50%" outerRadius={100} stroke="#fff" strokeWidth={1} labelLine={false} label={({ percent }) => percent && percent >= 0.06 ? `${(percent * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %` : ""}>
          {data.map((item, index) => <Cell key={item.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
        </Pie>
        <Tooltip content={<ChartTooltip />} />
        <Legend layout="vertical" verticalAlign="middle" align="right" iconType="circle" formatter={(value) => <span className="text-sm text-[#202124] dark:text-white">{value}</span>} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function AdminCharts({ stats, signups, productPublishes, userSignups, roles, tiers }: {
  stats: AdminStats;
  signups: MonthlySignup[];
  productPublishes: MonthlySignup[];
  userSignups: MonthlySignup[];
  roles: RoleCount[];
  tiers: TierCount[];
}) {
  const allSignups = addLabels(userSignups.map((item) => ({ name: item.month, value: item.count })));
  const vendorData = addLabels(signups.map((item) => ({ name: item.month, value: item.count })));
  const productData = addLabels(productPublishes.map((item) => ({ name: item.month, value: item.count })));
  const roleData = addLabels(roles.map((item) => ({ name: item.role, value: item.count })));
  const tierData = addLabels(tiers.map((item) => ({ name: item.tier, value: item.count })));
  const hasRoles = roleData.some((item) => item.value > 0);
  const hasTiers = tierData.some((item) => item.value > 0);

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-2">
        <ChartCard title="Inscriptions par mois" count={stats.totalUsers} countLabel="utilisateurs au total">{allSignups.length ? <VerticalBars data={allSignups} valueName="Inscriptions" /> : <EmptyChart message="Pas encore de données d'inscription." />}</ChartCard>
        <ChartCard title="Nouveaux vendeurs par mois" count={stats.totalVendors} countLabel="vendeurs au total">{vendorData.length ? <VerticalBars data={vendorData} valueName="Vendeurs" /> : <EmptyChart message="Aucune souscription payée enregistrée." />}</ChartCard>
      </div>
      <ChartCard title="Produits publiés par mois" count={stats.totalProducts} countLabel="produits au total">{productData.length ? <VerticalBars data={productData} valueName="Produits" /> : <EmptyChart message="Aucune donnée de publication." />}</ChartCard>
      <div className="grid gap-5 xl:grid-cols-2">
        <ChartCard title="Répartition des utilisateurs par rôle" count={stats.totalUsers} countLabel="utilisateurs au total">{hasRoles ? <HorizontalBars data={roleData} valueName="Utilisateurs" /> : <EmptyChart message="Aucun utilisateur." />}</ChartCard>
        <ChartCard title="Répartition des paliers vendeurs" count={stats.totalVendors} countLabel="vendeurs au total">{hasTiers ? <DistributionPie data={tierData} /> : <EmptyChart message="Aucun vendeur abonné." />}</ChartCard>
      </div>
      <article className="panel p-5 sm:p-6"><h2 className="text-lg font-medium">Modération et avis</h2><div className="mt-5 grid gap-4 sm:grid-cols-3"><Metric label="Avis total" value={stats.totalReviews} /><Metric label="Avis validés" value={stats.approvedReviews} /><Metric label="Stands en attente" value={stats.pendingStands} /></div></article>
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return <div className="grid h-full place-items-center rounded-lg border border-dashed border-[#dadce0] text-sm text-ucao-muted dark:border-[#34455e]">{message}</div>;
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg bg-[#f8f9fa] p-4 dark:bg-[#132238]"><p className="text-sm text-ucao-muted">{label}</p><p className="mt-1 text-3xl font-bold">{value.toLocaleString("fr-FR")}</p></div>;
}
