import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Form, message } from "antd";
import axios from "axios";

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate(); // pour redirection

  const onFinish = async (values) => {
    try {
      const response = await axios.post(`/api/users/reset-password/${token}`, values);
      if (response.data.success) {
        message.success(response.data.message);
        setTimeout(() => {
          navigate("/login"); // redirection vers la page de connexion
        }, 1500); // petite pause pour laisser apparaître le message
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      message.error("Erreur lors de la réinitialisation");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-6 text-center">Réinitialiser le mot de passe</h2>
        <Form onFinish={onFinish} layout="vertical">
          <Form.Item
            name="password"
            label="Nouveau mot de passe"
            rules={[{ required: true, message: "Veuillez entrer un mot de passe" }]}
          >
            <input type="password" className="w-full border py-2 px-3 rounded" />
          </Form.Item>
          <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded">
            Réinitialiser
          </button>
        </Form>
      </div>
    </div>
  );
}

export default ResetPassword;
