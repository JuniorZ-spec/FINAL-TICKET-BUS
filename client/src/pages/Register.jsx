import React from "react";
import { Form, message } from "antd";
import { ArrowLeft, Mail, Lock, User as UserIcon, Users } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useDispatch } from "react-redux";
import { ShowLoading, HideLoading } from "../redux/alertsSlice";
import WaxPattern from "../components/WaxPattern";

function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      dispatch(ShowLoading());
      const response = await axios.post("/api/users/register", values);
      dispatch(HideLoading());
      if (response.data.success) {
        message.success(response.data.message);
        navigate("/login");
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      dispatch(HideLoading());
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
          <div className="mx-auto h-20 w-20 bg-brand-green/10 rounded-full flex items-center justify-center">
            <Users className="h-9 w-9 text-brand-green" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-anthracite">Créer un compte</h2>
          <p className="mt-2 text-lg text-anthracite/60">
            Rejoignez AliGo et réservez vos voyages en quelques clics
          </p>
        </div>

        <Form layout="vertical" className="space-y-5" onFinish={onFinish}>
          <div className="space-y-4">
            <div className="relative">
              <UserIcon className="absolute z-10 left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-anthracite/30" />
              <Form.Item
                name="name"
                rules={[{ required: true, message: "Veuillez entrer votre nom" }]}
                className="!mb-0"
              >
                <input
                  type="text"
                  placeholder="Nom complet"
                  className="w-full pl-12 pr-3 py-3 border border-gray-200 rounded-xl placeholder-anthracite/30 text-anthracite focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green text-base"
                />
              </Form.Item>
            </div>

            <div className="relative">
              <Mail className="absolute z-10 left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-anthracite/30" />
              <Form.Item
                name="email"
                rules={[{ required: true, message: "Veuillez entrer votre email" }]}
                className="!mb-0"
              >
                <input
                  type="email"
                  placeholder="Adresse email"
                  className="w-full pl-12 pr-3 py-3 border border-gray-200 rounded-xl placeholder-anthracite/30 text-anthracite focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green text-base"
                />
              </Form.Item>
            </div>

            <div className="relative">
              <Lock className="absolute z-10 left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-anthracite/30" />
              <Form.Item
                name="password"
                rules={[{ required: true, message: "Veuillez entrer un mot de passe" }]}
                className="!mb-0"
              >
                <input
                  type="password"
                  placeholder="Mot de passe"
                  className="w-full pl-12 pr-3 py-3 border border-gray-200 rounded-xl placeholder-anthracite/30 text-anthracite focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green text-base"
                />
              </Form.Item>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 rounded-2xl text-white text-lg font-bold bg-brand-green hover:bg-brand-green-dark transition-colors"
          >
            Créer un compte
          </button>

          <div className="text-center">
            <p className="text-sm text-anthracite/60">
              Vous avez déjà un compte ?{" "}
              <Link
                to="/login"
                className="font-semibold text-terracotta hover:text-terracotta-dark"
              >
                Connectez-vous
              </Link>
            </p>
          </div>
        </Form>
      </div>
    </div>
  );
}

export default Register;
