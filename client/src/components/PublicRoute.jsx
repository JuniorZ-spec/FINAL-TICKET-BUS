import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { axiosInstance } from "../helpers/axiosInstance";

export default function PublicRoute({ children }) {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setChecking(false);
      return;
    }

    // Déjà connecté : on redirige vers le bon espace selon le rôle réel du
    // token actuel (jamais un rôle mis en cache, qui peut dater d'une
    // session précédente sur ce navigateur).
    axiosInstance
      .get("/api/users/profile")
      .then((response) => {
        if (response.data.success) {
          const userType = response.data.data.userType;
          if (userType === "COMPANY_MEMBER") navigate("/company");
          else if (userType === "ADMIN") navigate("/admin");
          else navigate("/");
        } else {
          setChecking(false);
        }
      })
      .catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        setChecking(false);
      });
  }, []);

  if (checking && localStorage.getItem("token")) return null;

  return <div>{children}</div>;
}
