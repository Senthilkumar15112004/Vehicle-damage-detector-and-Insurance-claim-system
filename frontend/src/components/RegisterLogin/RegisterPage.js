import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Form.css";

// 🟢 FIX: Correct OAuth URL (No /api prefix)
const GOOGLE_AUTH_URL = "https://my-vehicle-app.eastus.cloudapp.azure.com/oauth2/authorization/google";

function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    try {
      const registrationData = { name, email, password };
      // 🟢 FIX: Use live backend API URL
      await axios.post(
        "https://my-vehicle-app.eastus.cloudapp.azure.com/api/auth/register",
        registrationData
      );

      setMessage("Registration successful! Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      if (error.response && error.response.data) {
        setMessage(error.response.data);
      } else {
        setMessage("Registration failed. Please try again later.");
      }
      console.error("Registration failed:", error);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleGoogleLogin = () => {
    // 🟢 Redirect to Google for Signup
    // The backend logic determines if it's a new user or existing user
    window.location.href = GOOGLE_AUTH_URL;
  };

  return (
    <div className="form-container">
      <div className="form-split-card">
        {/* 1. Left Panel */}
        <div className="form-image-panel">
          <h3>Welcome to AI Estimator!</h3>
          <p>
            Get instant repair estimates and simplify your claim process.
            Register now to begin.
          </p>
        </div>

        {/* 2. Right Panel */}
        <div className="form-content-panel">
          <form onSubmit={handleSubmit}>
            <h2>Create Account</h2>

            {/* Social Login - GOOGLE ONLY */}
            <div className="social-login">
              <button
                type="button"
                className="social-button google"
                onClick={handleGoogleLogin}
                style={{ width: "100%" }}
              >
                <span className="icon">G</span> Sign up with Google
              </button>
            </div>

            <div className="divider">OR</div>

            {/* Fields with Icons */}
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <div className="input-wrapper">
                <span className="input-icon">👤</span>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <div className="input-wrapper">
                <span className="input-icon">✉️</span>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  required
                />
                <button
                  type="button"
                  className="eye-icon"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? "👁️" : "🙈"}
                </button>
              </div>
            </div>

            {message && (
              <p
                className={`message ${
                  message.includes("successful") ? "success" : "error"
                }`}
              >
                {message}
              </p>
            )}

            <button type="submit" className="form-button">
              Register
            </button>
          </form>

          <p className="form-switch">
            Already have an account? <Link to="/login">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
