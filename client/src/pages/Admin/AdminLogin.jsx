import React from "react";
import { Form, message } from "antd";
import { Mail, Lock, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useDispatch } from "react-redux";
import { ShowLoading, HideLoading } from "../../redux/alertsSlice";

function AdminLogin() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const onFinish = async (values) => {
    try {
      dispatch(ShowLoading());
      const response = await axios.post("/api/users/login-admin", values);
      dispatch(HideLoading());

      if (response.data.success) {
        const { accessToken, refreshToken } = response.data.data;
        localStorage.setItem("token", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        localStorage.setItem("role", "admin");
        window.location.href = "/admin";
      } else {
        message.error("Identifiants incorrects");
      }
    } catch {
      dispatch(HideLoading());
      // Message générique volontaire : ne jamais révéler si l'email existe ou son rôle
      message.error("Identifiants incorrects");
    }
  };

  return (
    <div className="min-h-screen bg-anthracite flex items-center justify-center px-4">
      <div className="max-w-sm w-full bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        <div className="text-center mb-8">
          <div className="mx-auto h-14 w-14 bg-anthracite/5 rounded-full flex items-center justify-center">
            <ShieldCheck className="h-7 w-7 text-anthracite/70" />
          </div>
          <h2 className="mt-5 text-xl font-extrabold text-anthracite">Administration</h2>
        </div>

        <Form onFinish={onFinish} layout="vertical" className="space-y-4">
          <div className="relative">
            <Mail className="absolute z-10 left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-anthracite/30" />
            <Form.Item
              name="email"
              rules={[{ required: true, message: "Email requis" }]}
              className="!mb-0"
            >
              <input
                type="email"
                autoComplete="off"
                placeholder="Email"
                className="w-full pl-12 pr-3 py-3 border border-gray-200 rounded-xl placeholder-anthracite/30 text-anthracite focus:outline-none focus:ring-2 focus:ring-anthracite/20 focus:border-anthracite/40 text-base"
              />
            </Form.Item>
          </div>

          <div className="relative">
            <Lock className="absolute z-10 left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-anthracite/30" />
            <Form.Item
              name="password"
              rules={[{ required: true, message: "Mot de passe requis" }]}
              className="!mb-0"
            >
              <input
                type="password"
                autoComplete="off"
                placeholder="Mot de passe"
                className="w-full pl-12 pr-3 py-3 border border-gray-200 rounded-xl placeholder-anthracite/30 text-anthracite focus:outline-none focus:ring-2 focus:ring-anthracite/20 focus:border-anthracite/40 text-base"
              />
            </Form.Item>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl text-white font-bold bg-anthracite hover:bg-black transition-colors"
          >
            Se connecter
          </button>
        </Form>
      </div>
    </div>
  );
}

export default AdminLogin;
