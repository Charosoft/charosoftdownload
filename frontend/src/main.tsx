import React from "react";
import ReactDOM from "react-dom/client";

import {
  BrowserRouter,
  Routes,
  Route,
  Outlet,
} from "react-router-dom";

// Page principale du téléchargement
import App from "./App";

// Pages publiques
import HowItWorks from "./pages/HowItWorks";
import About from "./pages/About";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Contact from "./pages/Contact";

// Pages de compte
import Login from "./pages/Login";
import Register from "./pages/Register";

// Composants partagés
import Header from "./components/Header";
import Footer from "./components/Footer";

import "./index.css";

/**
 * Layout public commun.
 * Toutes les pages conservent le même Header et le même Footer.
 */
function PublicLayout() {
  return (
    <div className="min-h-screen bg-[#08090b] text-white">
      <Header />
      <Outlet />
      <Footer />
    </div>
  );
}

/**
 * Point d'entrée principal de CHAROSOFT DOWNLOAD.
 */
ReactDOM.createRoot(
  document.getElementById("root")!
).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          {/* Accueil */}
          <Route path="/" element={<App />} />

          {/* Pages d'information */}
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/about" element={<About />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/contact" element={<Contact />} />

          {/* Connexion et inscription */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);