import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import Sidebar from "./components/Sidebar";
import Chat from "./components/Chat";
import Documents from "./components/Documents";
import AdminPanel from "./components/AdminPanel";
import Games from "./components/Games";
import MentionsLegales from "./components/MentionsLegales";
import PolitiqueConfidentialite from "./components/PolitiqueConfidentialite";
import Accessibilite from "./components/Accessibilite";
import PrivateRoute from "./components/PrivateRoute";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Pages légales accessibles sans connexion */}
      <Route path="/mentions-legales" element={<MentionsLegales />} />
      <Route path="/confidentialite" element={<PolitiqueConfidentialite />} />
      <Route path="/accessibilite" element={<Accessibilite />} />

      <Route
        element={
          <PrivateRoute>
            <Sidebar />
          </PrivateRoute>
        }
      >
        <Route path="/" element={<Chat />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/games" element={<Games />} />
        <Route
          path="/admin"
          element={
            <PrivateRoute adminOnly>
              <AdminPanel />
            </PrivateRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
