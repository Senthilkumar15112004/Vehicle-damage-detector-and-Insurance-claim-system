import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { jwtDecode } from "jwt-decode"; 

const OAuthRedirect = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const auth = useAuth();
    const login = auth ? auth.login : null;

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const token = params.get('token');

        // 🟢 THIS IS THE LOG YOU WANTED
        console.log("OAuth Success! Token received:", token);

        if (token) {
            localStorage.setItem('authToken', token);

            if (login) {
                login(token);
            }

            try {
                let isAdmin = false;

                // Case 1: Simulated Token (Look for the role string)
                if (token.startsWith("SIMULATED_TOKEN_")) {
                    // Check if the token string literally contains the word ADMIN
                    if (token.includes("ADMIN")) isAdmin = true;
                } 
                // Case 2: Real JWT (Decode it)
                else {
                    const decoded = jwtDecode(token);
                    const roleAuthority = decoded.roles && decoded.roles[0] ? decoded.roles[0].authority : "";
                    if (roleAuthority === "ROLE_ADMIN") isAdmin = true;
                }

                console.log("Is user Admin?", isAdmin); // 🟢 Added this debug log too

                // Redirect based on the check
                if (isAdmin) {
                    setTimeout(() => { window.location.href = '/admin'; }, 100);
                } else {
                    setTimeout(() => { window.location.href = '/new-claim'; }, 100);
                }

            } catch (e) {
                console.error("Error decoding token during redirect:", e);
                setTimeout(() => { window.location.href = '/new-claim'; }, 100);
            }

        } else {
            console.error("OAuth Failed: No token found.");
            navigate('/login');
        }
    }, [navigate, location, login]);

    return (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <h2>Logging in...</h2>
            <div className="spinner"></div>
        </div>
    );
};

export default OAuthRedirect;
