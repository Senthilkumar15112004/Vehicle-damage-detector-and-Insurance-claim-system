package com.example.vehicledamage.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.List;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    // 🟢 NEW: serving static files (Images) from the uploads folder
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // This tells Spring: "If someone asks for /uploads/xyz.jpg, look in /uploads/ folder"
        // Note: "file:/uploads/" refers to the path INSIDE the Docker container
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:/uploads/");
    }

    // 🟢 EXISTING: CORS Configuration
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        configuration.setAllowedOrigins(List.of(
            "http://localhost:3000",
            "https://my-vehicle-app.eastus.cloudapp.azure.com"
        ));

        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);

        return source;
    }
}
