import React from "react";
import { ArrowLeft, Mail, Lock, Users } from "lucide-react";
import { Form, message } from "antd";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useDispatch } from "react-redux";
import { ShowLoading, HideLoading } from "../redux/alertsSlice";

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
        const token = response.data.data;
        localStorage.setItem("token", token);

        const decodedToken = JSON.parse(atob(token.split(".")[1]));
        if (decodedToken.role === "admin") {
          window.location.href = "/admin";
        } else {
          window.location.href = "/";
        }
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 py-12 px-4 sm:px-6 lg:px-8">
      <button
        onClick={() => navigate(-1)}
        className="absolute top-8 left-8 flex items-center text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        Retour
      </button>

      <div className="max-w-md w-full mx-auto">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-indigo-100 rounded-full flex items-center justify-center">
            <Users className="h-8 w-8 text-indigo-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Espace Voyageur</h2>
          <p className="mt-2 text-sm text-gray-600">Connectez-vous pour réserver vos billets</p>
        </div>

        <Form onFinish={onFinish} layout="vertical" className="mt-8 space-y-6">
          <div className="space-y-4">
            <Form.Item
              name="email"
              rules={[{ required: true, message: "Veuillez entrer votre email" }]}
            >
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  autoComplete="on"
                  placeholder="Adresse email"
                  className="appearance-none rounded-lg relative block w-full pl-12 pr-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: "Veuillez entrer votre mot de passe" }]}
            >
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  name="password"
                  placeholder="Mot de passe"
                  className="appearance-none rounded-lg relative block w-full pl-12 pr-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </Form.Item>
          </div>

          <div className="flex items-center justify-between w-full">
            <div className="flex items-center ">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="w-4 h-4 accent-primary"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Se souvenir de moi
              </label>
            </div>

            <div className="text-sm">
              <Link
                to="/forgot-password"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Mot de passe oublié ?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              style={{ borderRadius: "12px" }}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Se connecter
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Pas encore de compte ?{" "}
              <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
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
