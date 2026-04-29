import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { message } from "antd";
import { useDispatch } from "react-redux";
import { SetUser } from "../redux/usersSlice";
import { useSelector } from "react-redux";
import { ShowLoading, HideLoading } from "../redux/alertsSlice";
import DefaultLayout from "./DefaultLayout";

export default function ProtectedRoute({ children }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.users);
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("token")) {
      validateToken();
    } else {
      navigate("/login");
    }
  }, []);

  const validateToken = async () => {
    try {
      dispatch(ShowLoading());
      const token = localStorage.getItem("token");

      const response = await axios.post(
        "/api/users/get-user-by-id",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      dispatch(HideLoading());

      if (response.data.success) {
        dispatch(SetUser(response.data.data));
      } else {
        localStorage.removeItem("token");
        message.error(response.data.message);
        navigate("/login");
      }
    } catch (error) {
      dispatch(HideLoading());
      localStorage.removeItem("token");
      message.error(error.message);
      navigate("/login");
    }
  };

  return <div> {user && <DefaultLayout> {children} </DefaultLayout>} </div>;
}
