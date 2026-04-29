import React from "react";
import { Form, message } from "antd";
import { Mail } from "lucide-react";
import { axiosInstance } from "../helpers/axiosInstance";

function ForgotPassword() {
  const onFinish = async (values) => {
    try {
      const response = await axiosInstance.post("/api/users/send-reset-password-email", values);

      if (response.data.success) {
        message.success(response.data.message);
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      message.error("Une erreur est survenue");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-6 text-center">Mot de passe oublié</h2>
        <Form onFinish={onFinish} layout="vertical">
          <Form.Item
            name="email"
            label="Adresse e-mail"
            rules={[{ required: true, message: "Veuillez entrer votre e-mail" }]}
          >
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                className="pl-10 w-full py-2 border rounded"
                placeholder="Votre email"
              />
            </div>
          </Form.Item>
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700"
          >
            Envoyer un lien de réinitialisation
          </button>
        </Form>
      </div>
    </div>
  );
}

export default ForgotPassword;
