import React from "react";
import { ArrowLeft, Mail, Lock, Users } from "lucide-react";
import { Form, message } from "antd";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useDispatch } from "react-redux";
import { ShowLoading, HideLoading } from "../redux/alertsSlice";
import WaxPattern from "../components/WaxPattern";

function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const onFinish = async (values) => {
    try {
      dispatch(ShowLoading());
      const response = await axios.post("/api/users/login", values);
      dispatch(HideLoading());

      if (response.data.success) {
        message.success(response.data.message);
        const { accessToken, refreshToken } = response.data.data;
        localStorage.setItem("token", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        window.location.href = "/";
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      dispatch(HideLoading());
      if (error.response) {
        message.error(error.response.data.message || "Une erreur est survenue");
      } else {
        message.error(error.message);
      }
    }
  };

  return (
    <div className="relative min-h-screen bg-offwhite py-12 px-4 sm:px-6 lg:px-8">
      <WaxPattern />
      <button
        onClick={() => navigate(-1)}
        className="absolute z-10 top-8 left-8 flex items-center text-anthracite/60 hover:text-anthracite font-medium"
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        Retour
      </button>

      <div className="relative z-10 max-w-md w-full mx-auto bg-white rounded-2xl border border-gray-200 shadow-sm p-8 mt-16">
        <div className="text-center mb-8">
          <div className="mx-auto h-20 w-20 bg-terracotta/10 rounded-full flex items-center justify-center">
            <Users className="h-9 w-9 text-terracotta" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-anthracite">Espace Voyageur</h2>
          <p className="mt-2 text-lg text-anthracite/60">
            Connectez-vous pour réserver vos billets
          </p>
        </div>

        <Form onFinish={onFinish} layout="vertical" className="space-y-5">
          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute z-10 left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-anthracite/30" />
              <Form.Item
                name="email"
                rules={[{ required: true, message: "Veuillez entrer votre email" }]}
                className="!mb-0"
              >
                <input
                  type="email"
                  autoComplete="on"
                  placeholder="Adresse email"
                  className="w-full pl-12 pr-3 py-3 border border-gray-200 rounded-xl placeholder-anthracite/30 text-anthracite focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta text-base"
                />
              </Form.Item>
            </div>

            <div className="relative">
              <Lock className="absolute z-10 left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-anthracite/30" />
              <Form.Item
                name="password"
                rules={[{ required: true, message: "Veuillez entrer votre mot de passe" }]}
                className="!mb-0"
              >
                <input
                  type="password"
                  placeholder="Mot de passe"
                  className="w-full pl-12 pr-3 py-3 border border-gray-200 rounded-xl placeholder-anthracite/30 text-anthracite focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta text-base"
                />
              </Form.Item>
            </div>
          </div>

          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="w-4 h-4 accent-terracotta"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-anthracite/70">
                Se souvenir de moi
              </label>
            </div>

            <Link
              to="/forgot-password"
              className="text-sm font-medium text-terracotta hover:text-terracotta-dark"
            >
              Mot de passe oublié ?
            </Link>
          </div>

          <button
            type="submit"
            className="w-full py-4 rounded-2xl text-white text-lg font-bold bg-terracotta hover:bg-terracotta-dark transition-colors"
          >
            Se connecter
          </button>

          <div className="text-center">
            <p className="text-sm text-anthracite/60">
              Pas encore de compte ?{" "}
              <Link
                to="/register"
                className="font-semibold text-terracotta hover:text-terracotta-dark"
              >
                {"S'inscrire"}
              </Link>
            </p>
          </div>
        </Form>
      </div>
    </div>
  );
}

export default Login;
