import { useEffect, useState } from "react";
import { Form, message } from "antd";
import { useDispatch } from "react-redux";
import { ShowLoading, HideLoading } from "../../redux/alertsSlice";
import { axiosInstance } from "../../helpers/axiosInstance";
import WaxPattern from "../../components/WaxPattern";
import {
  Users,
  ShieldCheck,
  LineChart,
  CheckCircle2,
  Building2,
  Mail,
  Phone,
  FileText,
  MapPinned,
} from "lucide-react";

const STEPS = [
  {
    icon: <FileText className="w-6 h-6" />,
    title: "Postulez",
    desc: "Remplissez le formulaire avec les informations de votre compagnie. Ça prend deux minutes.",
  },
  {
    icon: <ShieldCheck className="w-6 h-6" />,
    title: "Validation",
    desc: "Notre équipe vérifie votre dossier (RCCM, IFU) et valide votre compte sous quelques jours.",
  },
  {
    icon: <LineChart className="w-6 h-6" />,
    title: "Vendez vos billets",
    desc: "Publiez vos lignes et vos départs, gérez vos réservations depuis votre espace compagnie.",
  },
];

const VALUE_PROPS = [
  {
    icon: <Users className="w-6 h-6" />,
    title: "Plus de voyageurs",
    desc: "Vos trajets deviennent visibles à côté de toutes les autres compagnies, pour les voyageurs qui comparent avant de réserver.",
    color: "#D85A30",
  },
  {
    icon: <ShieldCheck className="w-6 h-6" />,
    title: "Aucun frais d'entrée",
    desc: "Rejoindre la plateforme est gratuit. AliGo se rémunère uniquement via une commission sur les billets effectivement vendus.",
    color: "#0F6E56",
  },
  {
    icon: <LineChart className="w-6 h-6" />,
    title: "Tableau de bord dédié",
    desc: "Suivez vos réservations, vos lignes et vos revenus en temps réel depuis votre espace compagnie.",
    color: "#E8B03D",
  },
];

export default function PartnerApply() {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [submitted, setSubmitted] = useState(false);
  const [stats, setStats] = useState({ partnerCount: 0, citiesCount: 0 });

  useEffect(() => {
    axiosInstance
      .get("/api/trips/get-all-trips")
      .then((res) => {
        if (!res.data.success) return;
        const trips = res.data.data;
        const partnerCount = new Set(trips.map((t) => t.company?.companyName).filter(Boolean)).size;
        const citiesCount = new Set(trips.flatMap((t) => [t.from, t.to]).filter(Boolean)).size;
        setStats({ partnerCount, citiesCount });
      })
      .catch(() => {});
  }, []);

  const onFinish = async (values) => {
    try {
      dispatch(ShowLoading());
      const response = await axiosInstance.post("/api/companys/apply", values);
      dispatch(HideLoading());

      if (response.data.success) {
        setSubmitted(true);
        form.resetFields();
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      dispatch(HideLoading());
      message.error(error.response?.data?.message || "Une erreur est survenue");
    }
  };

  return (
    <div className="w-full">
      {/* Hero */}
      <section className="relative overflow-hidden bg-offwhite pt-20 pb-16 px-4">
        <WaxPattern />
        <div
          className="absolute top-0 left-0 right-0 h-1.5"
          style={{ background: "linear-gradient(90deg, #D85A30, #E8B03D, #0F6E56)" }}
        />
        <div className="relative z-10 text-center max-w-3xl mx-auto">
          <span
            className="inline-flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-full mb-8"
            style={{ backgroundColor: "#0F6E5622", color: "#0B5443" }}
          >
            <span className="w-2 h-2 rounded-full bg-brand-green" />
            Espace compagnies
          </span>
          <h1
            className="text-4xl md:text-5xl font-black mb-6 text-anthracite"
            style={{ lineHeight: 1.15 }}
          >
            Vendez vos billets à plus de voyageurs avec{" "}
            <span className="text-terracotta">AliGo</span>
          </h1>
          <p className="text-xl text-anthracite/60 max-w-2xl mx-auto leading-relaxed">
            Rejoignez les compagnies déjà présentes sur AliGo.bj, gérez vos lignes et vos
            réservations depuis un seul tableau de bord.
          </p>
        </div>

        {stats.partnerCount > 0 && (
          <div className="relative z-10 max-w-md mx-auto mt-10 bg-white border border-gray-200 rounded-2xl px-6 py-5 grid grid-cols-2 divide-x divide-gray-100 text-center">
            <div>
              <p className="text-2xl font-extrabold text-terracotta">{stats.partnerCount}</p>
              <p className="text-sm text-anthracite/50 mt-1">
                compagnie{stats.partnerCount > 1 ? "s" : ""} déjà partenaire
                {stats.partnerCount > 1 ? "s" : ""}
              </p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-brand-green">{stats.citiesCount}</p>
              <p className="text-sm text-anthracite/50 mt-1">
                ville{stats.citiesCount > 1 ? "s" : ""} desservie{stats.citiesCount > 1 ? "s" : ""}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Pourquoi rejoindre AliGo */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {VALUE_PROPS.map((item) => (
            <div key={item.title} className="flex flex-col items-start gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white"
                style={{ backgroundColor: item.color }}
              >
                {item.icon}
              </div>
              <h3 className="text-lg font-bold text-anthracite">{item.title}</h3>
              <p className="text-base text-anthracite/60 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="border-t border-gray-100 py-20 bg-offwhite">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-extrabold text-anthracite">Comment ça marche</h2>
            <p className="text-anthracite/50 mt-2 text-lg">Trois étapes pour rejoindre AliGo</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map((step, i) => (
              <div key={step.title} className="bg-white border border-gray-200 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-9 h-9 rounded-full bg-terracotta text-white font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-terracotta">{step.icon}</span>
                </div>
                <h3 className="text-lg font-bold text-anthracite mb-2">{step.title}</h3>
                <p className="text-base text-anthracite/60 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Formulaire de candidature */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {submitted ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
            <CheckCircle2 className="w-14 h-14 text-brand-green mx-auto mb-4" />
            <h2 className="text-2xl font-extrabold text-anthracite mb-2">Candidature envoyée</h2>
            <p className="text-anthracite/60 max-w-md mx-auto">
              Merci ! Notre équipe va examiner votre dossier et vous contactera par email ou
              téléphone pour la suite.
            </p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-extrabold text-anthracite mb-1">
                Déposer votre candidature
              </h2>
              <p className="text-anthracite/50">
                Champs marqués d&apos;un * obligatoires. Gratuit, sans engagement.
              </p>
            </div>

            <Form layout="vertical" form={form} onFinish={onFinish} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-anthracite/70 mb-1.5">
                    Nom de la compagnie *
                  </label>
                  <div className="relative">
                    <Building2 className="absolute z-10 left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-anthracite/30" />
                    <Form.Item
                      name="companyName"
                      initialValue=""
                      rules={[{ required: true, message: "Le nom de la compagnie est requis" }]}
                      className="!mb-0"
                    >
                      <input
                        placeholder="Bénin Voyages"
                        className="w-full pl-12 pr-3 py-3 border border-gray-200 rounded-xl placeholder-anthracite/30 text-anthracite focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta"
                      />
                    </Form.Item>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-anthracite/70 mb-1.5">
                    Email professionnel *
                  </label>
                  <div className="relative">
                    <Mail className="absolute z-10 left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-anthracite/30" />
                    <Form.Item
                      name="email"
                      initialValue=""
                      rules={[
                        { required: true, message: "L'email est requis" },
                        { type: "email", message: "Email invalide" },
                      ]}
                      className="!mb-0"
                    >
                      <input
                        type="email"
                        placeholder="contact@macompagnie.bj"
                        className="w-full pl-12 pr-3 py-3 border border-gray-200 rounded-xl placeholder-anthracite/30 text-anthracite focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta"
                      />
                    </Form.Item>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-anthracite/70 mb-1.5">
                    Nom du contact *
                  </label>
                  <Form.Item
                    name="contactName"
                    initialValue=""
                    rules={[{ required: true, message: "Le nom du contact est requis" }]}
                    className="!mb-0"
                  >
                    <input
                      placeholder="Prénom et nom"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl placeholder-anthracite/30 text-anthracite focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta"
                    />
                  </Form.Item>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-anthracite/70 mb-1.5">
                    Téléphone *
                  </label>
                  <div className="relative">
                    <Phone className="absolute z-10 left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-anthracite/30" />
                    <Form.Item
                      name="contactPhone"
                      initialValue=""
                      rules={[{ required: true, message: "Le téléphone est requis" }]}
                      className="!mb-0"
                    >
                      <input
                        placeholder="+229 XX XX XX XX"
                        className="w-full pl-12 pr-3 py-3 border border-gray-200 rounded-xl placeholder-anthracite/30 text-anthracite focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta"
                      />
                    </Form.Item>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-anthracite/70 mb-1.5">
                    RCCM
                  </label>
                  <Form.Item name="rccm" initialValue="" className="!mb-0">
                    <input
                      placeholder="Numéro RCCM (optionnel)"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl placeholder-anthracite/30 text-anthracite focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta"
                    />
                  </Form.Item>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-anthracite/70 mb-1.5">
                    IFU
                  </label>
                  <Form.Item name="ifu" initialValue="" className="!mb-0">
                    <input
                      placeholder="Numéro IFU (optionnel)"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl placeholder-anthracite/30 text-anthracite focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta"
                    />
                  </Form.Item>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-anthracite/70 mb-1.5">
                  Vos lignes habituelles
                </label>
                <div className="relative">
                  <MapPinned className="absolute z-10 left-4 top-3.5 h-5 w-5 text-anthracite/30" />
                  <Form.Item name="routesNote" initialValue="" className="!mb-0">
                    <textarea
                      rows={3}
                      placeholder="Ex : Cotonou - Parakou, Cotonou - Natitingou (optionnel)"
                      className="w-full pl-12 pr-3 py-3 border border-gray-200 rounded-xl placeholder-anthracite/30 text-anthracite focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta resize-none"
                    />
                  </Form.Item>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl text-white text-base font-bold bg-terracotta hover:bg-terracotta-dark transition-colors"
              >
                Envoyer ma candidature
              </button>

              <p className="text-center text-sm text-anthracite/50">
                Déjà partenaire ?{" "}
                <a href="/company/login" className="text-terracotta font-semibold">
                  Connectez-vous à votre espace
                </a>
              </p>
            </Form>
          </div>
        )}
      </section>
    </div>
  );
}
