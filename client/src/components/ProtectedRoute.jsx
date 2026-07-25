import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { message } from "antd";
import { useDispatch } from "react-redux";
import { SetUser } from "../redux/usersSlice";
import { useSelector } from "react-redux";
import { ShowLoading, HideLoading } from "../redux/alertsSlice";
import DefaultLayout from "./DefaultLayout";
import { normalizeUser } from "../helpers/normalizeUser";

export default function ProtectedRoute({ children }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.users);
  const navigate = useNavigate();
  const location = useLocation();
  const loginPath = location.pathname.startsWith("/admin") ? "/admin/login" : "/login";

  useEffect(() => {
    if (localStorage.getItem("token")) {
      validateToken();
    } else {
      navigate(loginPath);
    }
  }, []);

  const validateToken = async () => {
    try {
      dispatch(ShowLoading());
      const token = localStorage.getItem("token");

      const response = await axios.get("/api/users/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      dispatch(HideLoading());

      if (response.data.success) {
        dispatch(SetUser(normalizeUser(response.data.data)));
      } else {
        localStorage.removeItem("token");
        message.error(response.data.message);
        navigate(loginPath);
      }
    } catch (error) {
      dispatch(HideLoading());
      localStorage.removeItem("token");
      message.error(error.message);
      navigate(loginPath);
    }
  };

  return <div> {user && <DefaultLayout> {children} </DefaultLayout>} </div>;
}
