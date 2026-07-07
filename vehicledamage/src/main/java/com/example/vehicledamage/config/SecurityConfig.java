package com.example.vehicledamage.config;

import com.example.vehicledamage.model.Role;
import com.example.vehicledamage.model.User;
import com.example.vehicledamage.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.util.Optional;
import java.util.UUID;

import static org.springframework.security.config.Customizer.withDefaults;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final AuthenticationProvider authenticationProvider;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(withDefaults())
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/uploads/**").permitAll()
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/login/**", "/oauth2/**").permitAll()
                        .requestMatchers("/api/v1/admin/**").hasRole(Role.ROLE_ADMIN.name().replace("ROLE_", ""))
                        .requestMatchers("/api/v1/users/**").hasRole(Role.ROLE_USER.name().replace("ROLE_", ""))
                        .requestMatchers("/api/v1/claims/**").hasAnyRole(
                                Role.ROLE_USER.name().replace("ROLE_", ""),
                                Role.ROLE_ADMIN.name().replace("ROLE_", "")
                        )
                        .anyRequest().authenticated()
                )
                .oauth2Login(oauth2 -> oauth2
                        .successHandler(oauthSuccessHandler())
                        .authorizationEndpoint(authorization -> authorization
                                .baseUri("/oauth2/authorization")
                        )
                        .redirectionEndpoint(redirection -> redirection
                                .baseUri("/login/oauth2/code/*")
                        )
                )
                .sessionManagement(sess -> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authenticationProvider(authenticationProvider)
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    private AuthenticationSuccessHandler oauthSuccessHandler() {
        return (request, response, authentication) -> {
            OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
            String email = oAuth2User.getAttribute("email");
            String name = oAuth2User.getAttribute("name");

            System.out.println("🔥 Google OAuth Event: " + email);

            Optional<User> existingUser = userRepository.findByEmail(email);
            
            if (existingUser.isEmpty()) {
                // NEW USER -> REGISTER
                System.out.println("🆕 New User Detected. Registering...");
                
                User newUser = new User();
                newUser.setEmail(email);
                newUser.setName(name != null ? name : "Google User");
                newUser.setRole(Role.ROLE_USER);
                newUser.setPassword(passwordEncoder.encode(UUID.randomUUID().toString())); 
                
                userRepository.save(newUser);
                
                response.sendRedirect(frontendUrl + "/login?status=registered_success");

            } else {
                // EXISTING USER -> LOGIN
                User user = existingUser.get();
                String role = user.getRole().name(); // Get ROLE_ADMIN or ROLE_USER
                System.out.println("👋 User Found. Role: " + role);

                // 🟢 FIX: Append the ROLE to the token so Frontend knows who we are
                // Format: SIMULATED_TOKEN_email_SEPARATOR_role

                String token = "SIMULATED_TOKEN_" + email + "_ROLES_" + role;

                String targetUrl = frontendUrl + "/oauth/redirect?token=" + token;
                response.sendRedirect(targetUrl);
            }
        };
    }
}
