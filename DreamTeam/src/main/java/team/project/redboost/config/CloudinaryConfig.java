package team.project.redboost.config;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CloudinaryConfig {
    @Bean
    public Cloudinary cloudinary() {
        return new Cloudinary(ObjectUtils.asMap(
                "cloud_name", "dfsd9mfbs",
                "api_key", "263428674296821",
                "api_secret", "3iSK04qvOBY5HPFLjx8oYNuA5Ik",
                "secure", true                    // Use HTTPS for secure delivery

        ));
    }
}




