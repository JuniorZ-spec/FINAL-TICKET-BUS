import React from "react";
import { Form, message } from "antd";
import { ArrowLeft, Mail, KeyRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { axiosInstance } from "../helpers/axiosInstance";
import WaxPattern from "../components/WaxPattern";

function ForgotPassword() {
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      const response = await axiosInstance.post("/api/users/send-reset-password-email", values);

      if (response.data.success) {
        message.success(response.data.message);
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      message.error(error.response?.data?.message || "Une erreur est survenue");
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
            <KeyRound className="h-9 w-9 text-terracotta" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-anthracite">Mot de passe oublié</h2>
          <p className="mt-2 text-lg text-anthracite/60">
            On vous envoie un lien pour le réinitialiser
          </p>
        </div>

        <Form onFinish={onFinish} layout="vertical" className="space-y-5">
          <div className="relative">
            <Mail className="absolute z-10 left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-anthracite/30" />
            <Form.Item
              name="email"
              initialValue=""
              rules={[{ required: true, message: "Veuillez entrer votre email" }]}
              className="!mb-0"
            >
              <input
                type="email"
                autoComplete="email"
                placeholder="Adresse email"
                className="w-full pl-12 pr-3 py-3 border border-gray-200 rounded-xl placeholder-anthracite/30 text-anthracite focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta text-base"
              />
            </Form.Item>
          </div>

          <button
            type="submit"
            className="w-full py-4 rounded-2xl text-white text-lg font-bold bg-terracotta hover:bg-terracotta-dark transition-colors"
          >
            Envoyer le lien
          </button>

          <div className="text-center">
            <p className="text-sm text-anthracite/60">
              <Link
                to="/login"
                className="font-semibold text-terracotta hover:text-terracotta-dark"
              >
                Retour à la connexion
              </Link>
            </p>
          </div>
        </Form>
      </div>
    </div>
  );
}

export default ForgotPassword;
