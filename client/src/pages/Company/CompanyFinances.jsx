import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { message } from "antd";
import { Wallet, Percent, Landmark, Ticket } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

import { ShowLoading, HideLoading } from "../../redux/alertsSlice";
import { axiosInstance } from "../../helpers/axiosInstance";

function CompanyFinances() {
  const dispatch = useDispatch();
  const [stats, setStats] = useState({
    periodLabel: "",
    grossRevenue: 0,
    commissionRate: 0.02,
    commission: 0,
    netPayout: 0,
    ticketsIssued: 0,
    revenueByLigne: [],
    revenueByChannel: [],
  });

  const getFinanceStats = async () => {
    try {
      dispatch(ShowLoading());
      const response = await axiosInstance.get("/api/companys/get-finance-stats");
      if (response.data.success) setStats(response.data.data);
      else message.error(response.data.message);
    } catch {
      message.error("Erreur lors du chargement des données financières");
    } finally {
      dispatch(HideLoading());
    }
  };

  useEffect(() => {
    getFinanceStats();
  }, []);

  const fmt = (n) => `${n.toLocaleString("fr-FR")} FCFA`;
  const totalChannelRevenue = stats.revenueByChannel.reduce((s, c) => s + c.revenue, 0);

  const kpis = [
    {
      title: `Revenus bruts (${stats.periodLabel})`,
      value: fmt(stats.grossRevenue),
      icon: Wallet,
      color: "terracotta",
    },
    {
      title: `Commission plateforme (${Math.round(stats.commissionRate * 100)}%)`,
      value: fmt(stats.commission),
      icon: Percent,
      color: "saffron",
    },
    {
      title: "Reversement net",
      value: fmt(stats.netPayout),
      icon: Landmark,
      color: "brand-green",
    },
    { title: "Billets émis", value: stats.ticketsIssued, icon: Ticket, color: "terracotta" },
  ];

  const colorClasses = {
    terracotta: "bg-terracotta/10 text-terracotta",
    "brand-green": "bg-brand-green/10 text-brand-green",
    saffron: "bg-saffron/15 text-saffron",
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-anthracite">Finances</h1>
        <p className="text-sm text-anthracite/50 mt-0.5 capitalize">{stats.periodLabel}</p>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map(({ title, value, icon: Icon, color }, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-anthracite/40 uppercase tracking-wider">
                  {title}
                </p>
                <p className="text-2xl font-extrabold text-anthracite leading-none mt-2">{value}</p>
              </div>
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${colorClasses[color]}`}
              >
                <Icon size={18} />
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="text-base font-bold text-anthracite mb-4">Revenus par ligne</h2>
          {stats.revenueByLigne.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-sm text-anthracite/40">
              Aucun revenu ce mois-ci
            </div>
          ) : (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.revenueByLigne}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="4 4" stroke="#f0ede8" vertical={false} />
                  <XAxis dataKey="ligne" stroke="#8a8580" tick={{ fontSize: 10 }} />
                  <YAxis
                    stroke="#8a8580"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      borderColor: "#e5e0d8",
                      borderRadius: 8,
                    }}
                    labelStyle={{ color: "#1a1a1a", fontWeight: 600 }}
                    formatter={(value) => [fmt(value), "Revenus"]}
                  />
                  <Bar dataKey="revenue" radius={[6, 6, 0, 0]} barSize={32}>
                    {stats.revenueByLigne.map((_, index) => (
                      <Cell key={index} fill={index === 0 ? "#D85A30" : "#e5e0d8"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="text-base font-bold text-anthracite mb-4">
            Répartition par canal de vente
          </h2>
          {totalChannelRevenue === 0 ? (
            <div className="h-56 flex items-center justify-center text-sm text-anthracite/40">
              Aucun revenu ce mois-ci
            </div>
          ) : (
            <div className="space-y-5 mt-2">
              {stats.revenueByChannel.map((c) => {
                const pct = Math.round((c.revenue / totalChannelRevenue) * 100);
                return (
                  <div key={c.channel}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-semibold text-anthracite">{c.label}</span>
                      <span className="text-sm text-anthracite/60">
                        {fmt(c.revenue)} · <span className="font-semibold">{pct}%</span>
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: c.channel === "ONLINE" ? "#0F6E56" : "#D85A30",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
              <p className="text-xs text-anthracite/40 pt-2">
                Guichet = espèces + Mobile Money encaissés en gare · En ligne = paiement via
                l&apos;application
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default CompanyFinances;
