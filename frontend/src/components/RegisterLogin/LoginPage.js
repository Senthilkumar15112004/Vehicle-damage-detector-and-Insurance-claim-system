import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { jwtDecode } from "jwt-decode";
import './Form.css';

function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth();
    const location = useLocation();
    const [showPassword, setShowPassword] = useState(false);

    const GOOGLE_LOGIN_LINK = "https://my-vehicle-app.eastus.cloudapp.azure.com/oauth2/authorization/google";

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('status') === 'registered_success') {
            setSuccessMsg("🎉 Account created successfully! Please Log In with Google to continue.");
        }
    }, [location]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        try {
            const response = await axios.post('https://my-vehicle-app.eastus.cloudapp.azure.com/api/auth/login', { email, password });
            const token = response.data.jwt;
            
            if (token) {
                console.log("Token Received:", token);
                login(token);
                
                try {
                    const decoded = jwtDecode(token);
                    console.log("Decoded Token:", decoded);

                    const roleAuthority = decoded.roles && decoded.roles[0] ? decoded.roles[0].authority : "";
                    console.log("Extracted Role:", roleAuthority);
                    
                    if (roleAuthority === "ROLE_ADMIN") {
                        console.log("Redirecting to ADMIN...");
                        // 🟢 FIX: Use window.location.href to force reload
                        window.location.href = '/admin';
                    } else {
                        console.log("Redirecting to USER...");
                        // 🟢 FIX: Use window.location.href here too
                        window.location.href = '/new-claim';
                    }
                } catch (e) {
                    console.error("Decoding Error:", e);
                    window.location.href = '/new-claim';
                }
            } else {
                setError('Login failed: No token received.');
            }
        } catch (error) {
            console.error("Login failed:", error);
            setError('Invalid email or password. Please try again.');
        }
    };
    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="form-container">
            <div className="form-split-card">
                <div className="form-image-panel">
                    <h3>Welcome Back!</h3>
                    <p>We missed you! Please log in to view your claims and estimates.</p>
                </div>

                <div className="form-content-panel">
                    {successMsg && (
                        <div style={{ backgroundColor: '#d4edda', color: '#155724', padding: '10px', borderRadius: '5px', marginBottom: '15px', textAlign: 'center', border: '1px solid #c3e6cb' }}>
                            {successMsg}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <h2>Login</h2>
                        <div className="social-login">
                            <a href={GOOGLE_LOGIN_LINK} style={{ textDecoration: 'none', width: '100%' }}>
                                <button type="button" className="social-button google" style={{ width: '100%' }}>
                                    <span className="icon">G</span> Log in with Google
                                </button>
                            </a>
                        </div>
                        <div className="divider">OR</div>
                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <div className="input-wrapper">
                                <span className="input-icon">✉️</span>
                                <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" required />
                            </div>
                        </div>
                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <div className="input-wrapper">
                                <span className="input-icon">🔒</span>
                                <input type={showPassword ? "text" : "password"} id="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required />
                                <button type="button" className="eye-icon" onClick={togglePasswordVisibility}>
                                    {showPassword ? '👁️' : '🙈'}
                                </button>
                            </div>
                        </div>
                        {error && <p className="message error">{error}</p>}
                        <button type="submit" className="form-button">Login</button>
                    </form>
                    <p className="form-switch">
                        Don't have an account? <Link to="/register">Register here</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;
