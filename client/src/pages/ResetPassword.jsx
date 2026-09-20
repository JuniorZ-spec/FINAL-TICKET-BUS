import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Form, message } from "antd";
import { ArrowLeft, Lock, KeyRound } from "lucide-react";
import { axiosInstance } from "../helpers/axiosInstance";
import WaxPattern from "../components/WaxPattern";

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      const response = await axiosInstance.post(`/api/users/reset-password/${token}`, values);
      if (response.data.success) {
        message.success(response.data.message);
        setTimeout(() => {
          navigate("/login");
        }, 1500);
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      message.error(error.response?.data?.message || "Erreur lors de la réinitialisation");
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
            <KeyRound className="h-9 w-9 text-brand-green" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-anthracite">Nouveau mot de passe</h2>
          <p className="mt-2 text-lg text-anthracite/60">
            Choisissez un mot de passe pour votre compte
          </p>
        </div>

        <Form onFinish={onFinish} layout="vertical" className="space-y-5">
          <div className="relative">
            <Lock className="absolute z-10 left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-anthracite/30" />
            <Form.Item
              name="password"
              initialValue=""
              rules={[{ required: true, message: "Veuillez entrer un mot de passe" }]}
              className="!mb-0"
            >
              <input
                type="password"
                autoComplete="new-password"
                placeholder="Nouveau mot de passe"
                className="w-full pl-12 pr-3 py-3 border border-gray-200 rounded-xl placeholder-anthracite/30 text-anthracite focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green text-base"
              />
            </Form.Item>
          </div>

          <button
            type="submit"
            className="w-full py-4 rounded-2xl text-white text-lg font-bold bg-brand-green hover:bg-brand-green-dark transition-colors"
          >
            Réinitialiser le mot de passe
          </button>
        </Form>
      </div>
    </div>
  );
}

export default ResetPassword;
