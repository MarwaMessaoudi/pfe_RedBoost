package team.project.redboost.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;
import java.util.Collections;

@Configuration
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();

        // Allow requests from specific origins
        config.setAllowedOrigins(Collections.singletonList("http://redboost-bucket.s3-website-us-east-1.amazonaws.com"));

        // Allow specific HTTP methods
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));

        // Allow specific headers
        config.setAllowedHeaders(Arrays.asList("Content-Type", "Authorization"));

        // Allow credentials (cookies)
        config.setAllowCredentials(true);

        // Apply this configuration to all URL patterns
        source.registerCorsConfiguration("/**", config);

        return new CorsFilter(source);
    }
}
