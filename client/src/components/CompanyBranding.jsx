import { Bus, ShieldCheck, TrendingUp, Smartphone, Zap } from "lucide-react";

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Zéro survente garantie",
    desc: "Chaque siège verrouillé le temps du paiement — deux voyageurs ne peuvent jamais réserver la même place.",
  },
  {
    icon: TrendingUp,
    title: "Revenus en temps réel",
    desc: "Trajets, réservations et recettes de votre compagnie visibles instantanément depuis votre tableau de bord.",
  },
  {
    icon: Smartphone,
    title: "Paiement Mobile Money",
    desc: "Vos voyageurs paient en MTN MoMo ou Moov Money, vous recevez la réservation immédiatement.",
  },
  {
    icon: Zap,
    title: "Visible sur tout AliGo",
    desc: "Vos trajets apparaissent directement dans les résultats de recherche des voyageurs, sans démarche supplémentaire.",
  },
];

export default function CompanyBranding() {
  return (
    <div className="hidden lg:flex flex-col justify-between w-[480px] xl:w-[520px] bg-anthracite text-white p-12 flex-shrink-0">
      <div>
        <div className="flex items-center gap-3 mb-12">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shadow-sm"
            style={{ background: "linear-gradient(135deg, #D85A30 60%, #B84020 100%)" }}
          >
            <Bus className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-xl font-black text-white leading-tight">
              AliGo<span className="text-terracotta">.bj</span>
            </p>
            <p className="text-xs text-white/40 leading-tight">Espace compagnie</p>
          </div>
        </div>

        <h2 className="text-3xl font-black text-white leading-snug mb-3">
          Votre compagnie,
          <br />
          <span className="text-terracotta">enfin sur AliGo.</span>
        </h2>
        <p className="text-white/60 text-sm leading-relaxed mb-7">
          Gérez vos trajets, vos bus et vos réservations depuis un seul tableau de bord
        </p>

        <div className="space-y-5">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-4">
              <div className="w-9 h-9 rounded-lg bg-terracotta/20 flex items-center justify-center flex-shrink-0 text-terracotta">
                <Icon size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white mb-0.5">{title}</p>
                <p className="text-xs text-white/50 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
