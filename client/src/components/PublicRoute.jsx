import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function PublicRoute({ children }) {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (token) {
      // Déjà connecté : inutile de revoir une page publique (login/register)
      if (role === "company") {
        navigate("/company");
      } else if (role === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    }
  }, []);

  return <div>{children}</div>;
}
