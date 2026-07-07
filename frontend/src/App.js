import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import HomePage from "./components/HomePage/HomePage";
import LoginPage from "./components/RegisterLogin/LoginPage";
import RegisterPage from "./components/RegisterLogin/RegisterPage";
import AboutPage from "./components/About/AboutPage";
import Navbar from "./components/navbar/Navbar";
import ProfilePage from "./components/ProfilePage/ProfilePage";
import ClaimDetailPage from "./components/ClaimDetailPage/ClaimDetailPage";
import LandingPage from "./components/LandingPage/LandingPage";
import ContactPage from "./components/ContactPage/ContactPage";
import OAuthRedirect from './components/RegisterLogin/OAuthRedirect';
import AdminDashboard from "./components/AdminDashboard/AdminDashboard";
import "./App.css";
import {
  UserRoute,
  AdminRoute,
  PublicRoute,
  AuthenticatedRoute,
} from "./components/AuthRoutes";

const LayoutContainer = ({ children }) => {
  const location = useLocation();
  const fullWidthRoutes = ["/", "/login", "/register", "/contact"];
  if (
    fullWidthRoutes.includes(location.pathname) ||
    location.pathname.startsWith("/#") ||
    location.pathname.startsWith("/claim/")
  ) {
    return children;
  }
  return <div className="internal-page-wrapper">{children}</div>;
};

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <main>
          <LayoutContainer>
            <Routes>
              {/* 1. Special Route for Google Login Redirect (Keep this outside Public/Private checks) */}
              <Route path="/oauth/redirect" element={<OAuthRedirect />} />

              {/* 2. Public Routes (Only for logged-out users) */}
              <Route element={<PublicRoute />}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/contact" element={<ContactPage />} />
              </Route>

              {/* 3. Protected USER Routes */}
              <Route element={<UserRoute />}>
                <Route path="/new-claim" element={<HomePage />} />
                <Route path="/claims" element={<div>My Claims List Page Placeholder</div>} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>

              {/* 4. Protected ADMIN Routes */}
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<AdminDashboard />} />
              </Route>

              {/* 5. Shared Authenticated Routes */}
              <Route element={<AuthenticatedRoute />}>
                <Route path="/claim/:id" element={<ClaimDetailPage />} />
              </Route>

              {/* 6. Fallback for unknown paths */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </LayoutContainer>
        </main>
      </div>
    </Router>
  );
}

export default App;
