import "./resourses/global.css";
import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Colis from "./pages/Colis";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import DefaultLayout from "./components/DefaultLayout";
import Loader from "./components/Loader";
import { useSelector, useDispatch } from "react-redux";
import { SetUser } from "./redux/usersSlice";
import { normalizeUser } from "./helpers/normalizeUser";
import AdminHome from "./pages/Admin/AdminHome";
import AdminBuses from "./pages/Admin/AdminBuses";
import AdminUsers from "./pages/Admin/AdminUsers";
import AdminCompanys from "./pages/Admin/AdminCompanys";
import AdminBooking from "./pages/Admin/AdminBooking";
import AdminTrips from "./pages/Admin/AdminTrips";
import AdminSchema from "./pages/Admin/AdminSchema";
import AdminLogin from "./pages/Admin/AdminLogin";
import CompanyHome from "./pages/Company/CompanyHome";
import CompanyBuses from "./pages/Company/CompanyBuses";
import CompanyTrips from "./pages/Company/CompanyTrips";
import CompanyLogin from "./pages/Company/CompanyLogin";
import CompanyBookings from "./pages/Company/CompanyBookings";
import CompanyStations from "./pages/Company/CompanyStations";
import BookNow from "./pages/BookNow";
import Bookings from "./pages/Bookings";
import Profile from "./pages/Profile";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
// Assure-toi d'importer la page AdminTrajets

function App() {
  const { loading } = useSelector((state) => state.alerts);
  const dispatch = useDispatch();

  // Restaure la session (si un token existe) sans bloquer l'affichage des pages publiques
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    axios
      .get("/api/users/profile", { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => {
        if (response.data.success) {
          dispatch(SetUser(normalizeUser(response.data.data)));
        } else {
          localStorage.removeItem("token");
        }
      })
      .catch(() => localStorage.removeItem("token"));
  }, []);

  return (
    <div>
      {loading && <Loader />}
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <DefaultLayout>
                <Home />
              </DefaultLayout>
            }
          />
          <Route
            path="/colis"
            element={
              <DefaultLayout>
                <Colis />
              </DefaultLayout>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                {" "}
                <Profile />{" "}
              </ProtectedRoute>
            }
          />
          <Route
            path="/bookings"
            element={
              <ProtectedRoute>
                {" "}
                <Bookings />{" "}
              </ProtectedRoute>
            }
          />
          <Route
            path="/book-now/:id"
            element={
              <ProtectedRoute>
                {" "}
                <BookNow />{" "}
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/login"
            element={
              <PublicRoute>
                {" "}
                <AdminLogin />{" "}
              </PublicRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                {" "}
                <AdminHome />{" "}
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/schema"
            element={
              <ProtectedRoute>
                {" "}
                <AdminSchema />{" "}
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/buses"
            element={
              <ProtectedRoute>
                {" "}
                <AdminBuses />{" "}
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute>
                {" "}
                <AdminUsers />{" "}
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/trips"
            element={
              <ProtectedRoute>
                {" "}
                <AdminTrips />{" "}
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/bookings"
            element={
              <ProtectedRoute>
                {" "}
                <AdminBooking />{" "}
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/companys"
            element={
              <ProtectedRoute>
                {" "}
                <AdminCompanys />{" "}
              </ProtectedRoute>
            }
          />
          <Route
            path="/company/buses"
            element={
              <ProtectedRoute>
                {" "}
                <CompanyBuses />{" "}
              </ProtectedRoute>
            }
          />
          <Route
            path="/company"
            element={
              <ProtectedRoute>
                {" "}
                <CompanyHome />{" "}
              </ProtectedRoute>
            }
          />
          <Route
            path="/company/trips"
            element={
              <ProtectedRoute>
                {" "}
                <CompanyTrips />{" "}
              </ProtectedRoute>
            }
          />
          <Route
            path="/company/stations"
            element={
              <ProtectedRoute>
                {" "}
                <CompanyStations />{" "}
              </ProtectedRoute>
            }
          />
          <Route
            path="/company/bookings"
            element={
              <ProtectedRoute>
                {" "}
                <CompanyBookings />{" "}
              </ProtectedRoute>
            }
          />
          <Route
            path="/company/login"
            element={
              <PublicRoute>
                {" "}
                <CompanyLogin />{" "}
              </PublicRoute>
            }
          />
          {/* Ajout de cette route */}
          <Route
            path="/Register"
            element={
              <PublicRoute>
                {" "}
                <Register />{" "}
              </PublicRoute>
            }
          />
          <Route
            path="/Login"
            element={
              <PublicRoute>
                {" "}
                <Login />{" "}
              </PublicRoute>
            }
          />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
