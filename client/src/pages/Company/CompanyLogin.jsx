import { useState } from "react";
import { Form, message } from "antd";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useDispatch } from "react-redux";
import { ShowLoading, HideLoading } from "../../redux/alertsSlice";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Bus } from "lucide-react";
import CompanyBranding from "../../components/CompanyBranding";

function CompanyLogin() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showPassword, setShowPassword] = useState(false);

  const onFinish = async (values) => {
    try {
      dispatch(ShowLoading());
      const response = await axios.post("/api/users/login-company", values);
      dispatch(HideLoading());

      if (response.data.success) {
        message.success(response.data.message);
        const { accessToken, refreshToken } = response.data.data;
        localStorage.setItem("token", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        localStorage.setItem("role", "company");
        navigate("/company");
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      dispatch(HideLoading());
      message.error(error.response?.data?.message || "Une erreur est survenue");
    }
  };

  return (
    <div className="min-h-screen flex bg-offwhite">
      <CompanyBranding />

      <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-12">
        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #D85A30 60%, #B84020 100%)" }}
            >
              <Bus className="h-4 w-4 text-white" />
            </div>
            <span className="font-black text-lg text-anthracite">
              AliGo<span className="text-terracotta">.bj</span>
            </span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-extrabold text-anthracite mb-1">Connexion</h1>
            <p className="text-sm text-anthracite/50">Accédez à votre espace de gestion.</p>
          </div>

          <Form layout="vertical" onFinish={onFinish} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-anthracite/70 mb-1.5">
                Adresse email
              </label>
              <div className="relative">
                <Mail className="absolute z-10 left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-anthracite/30" />
                <Form.Item
                  name="email"
                  rules={[{ required: true, message: "Veuillez entrer votre email" }]}
                  className="!mb-0"
                >
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="gerant@macompagnie.bj"
                    className="w-full pl-12 pr-3 py-3 border border-gray-200 rounded-xl placeholder-anthracite/30 text-anthracite focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta text-base"
                  />
                </Form.Item>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-anthracite/70 mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute z-10 left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-anthracite/30" />
                <Form.Item
                  name="password"
                  rules={[{ required: true, message: "Veuillez entrer votre mot de passe" }]}
                  className="!mb-0"
                >
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="w-full pl-12 pr-11 py-3 border border-gray-200 rounded-xl placeholder-anthracite/30 text-anthracite focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta text-base"
                  />
                </Form.Item>
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute z-10 right-4 top-1/2 -translate-y-1/2 text-anthracite/30 hover:text-anthracite/60 transition-colors"
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-anthracite/60 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded accent-terracotta" />
                Rester connecté
              </label>
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-terracotta hover:text-terracotta-dark"
              >
                Mot de passe oublié ?
              </Link>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl text-white text-base font-bold bg-terracotta hover:bg-terracotta-dark transition-colors flex items-center justify-center gap-2"
            >
              Se connecter
              <ArrowRight size={17} />
            </button>

            <p className="text-center text-sm text-anthracite/50">
              Pas encore partenaire ? Contactez l&apos;équipe AliGo.
            </p>
          </Form>
        </div>
      </div>
    </div>
  );
}

export default CompanyLogin;
