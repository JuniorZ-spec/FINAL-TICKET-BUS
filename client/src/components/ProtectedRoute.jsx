import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { message } from "antd";
import { useDispatch } from "react-redux";
import { SetUser } from "../redux/usersSlice";
import { useSelector } from "react-redux";
import { ShowLoading, HideLoading } from "../redux/alertsSlice";
import DefaultLayout from "./DefaultLayout";
import { normalizeUser } from "../helpers/normalizeUser";
import { axiosInstance } from "../helpers/axiosInstance";

export default function ProtectedRoute({ children }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.users);
  const navigate = useNavigate();
  const location = useLocation();
  const loginPath = location.pathname.startsWith("/admin")
    ? "/admin/login"
    : location.pathname.startsWith("/company")
      ? "/company/login"
      : "/login";

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

      const response = await axiosInstance.get("/api/users/profile");

      dispatch(HideLoading());

      if (response.data.success) {
        dispatch(SetUser(normalizeUser(response.data.data)));
      } else {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        message.error(response.data.message);
        navigate(loginPath);
      }
    } catch (error) {
      dispatch(HideLoading());
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      message.error(error.message);
      navigate(loginPath);
    }
  };

  return <div> {user && <DefaultLayout> {children} </DefaultLayout>} </div>;
}
