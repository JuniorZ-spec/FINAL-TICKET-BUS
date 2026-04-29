import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function PublicRoute({ children }) {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (token) {
      // Redirection selon le rôle
      if (role === "company") {
        navigate("/company");
      } else {
        navigate("/");
      }
    } else {
      navigate("/roleselector");
    }
  }, []);

  return <div>{children}</div>;
}
