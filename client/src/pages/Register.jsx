import React from 'react';
import { Form, message } from 'antd';
import { Mail, Lock, Users, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { ShowLoading, HideLoading } from '../redux/alertsSlice';

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
        navigate('/login');
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      dispatch(HideLoading());
      message.error(
        error.response?.data?.message || "Une erreur est survenue"
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-indigo-100 rounded-full flex items-center justify-center">
            <Users className="h-8 w-8 text-indigo-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Créer un compte
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Rejoignez Ticket Minute et réservez vos voyages en quelques clics
          </p>
        </div>

        <Form layout="vertical" className="mt-8 space-y-6" onFinish={onFinish}>
          <div className="space-y-4">
            <Form.Item name="name" rules={[{ required: true, message: "Veuillez entrer votre nom" }]}>
              <div className="relative">
                
                <input
                  type="text"
                  placeholder="Nom complet"
                  className="appearance-none rounded-lg block w-full pl-12 pr-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </Form.Item>

            <Form.Item name="email" rules={[{ required: true, message: "Veuillez entrer votre email" }]}>
              <div className="relative">
             
                <input
                  type="email"
                  placeholder="Adresse email"
                  className="appearance-none rounded-lg block w-full pl-12 pr-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </Form.Item>

            <Form.Item name="password" rules={[{ required: true, message: "Veuillez entrer un mot de passe" }]}>
              <div className="relative">
               
                <input
                  type="password"
                  placeholder="Mot de passe"
                  className="appearance-none rounded-lg   block w-full pl-12 pr-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </Form.Item>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Créer un compte
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Vous avez déjà un compte ?{' '}
              <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
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
