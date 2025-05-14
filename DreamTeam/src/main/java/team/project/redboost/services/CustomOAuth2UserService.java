package team.project.redboost.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import team.project.redboost.entities.Role;
import team.project.redboost.entities.User;
import team.project.redboost.repositories.UserRepository;

import java.util.Collections;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        // Load the default OAuth2 user details
        OAuth2User oauth2User = super.loadUser(userRequest);

        // Extract user details
        String provider = userRequest.getClientRegistration().getRegistrationId(); // e.g. "linkedin"
        String providerId = oauth2User.getAttribute("sub"); // LinkedIn's unique ID


        String email = oauth2User.getAttribute("email");
        if (email == null) {
            throw new OAuth2AuthenticationException("Email not found in OAuth2 user details");
        }


        // Check if the user already exists in your database
        User user = userRepository.findByEmail(email);
        if (user == null) {
            // Create a new user if they don't exist
            user = new User();
            user.setEmail(email);
            user.setProvider(provider);
            user.setProviderId(providerId);
            user.setRole(Role.USER); // Assign default role
            userRepository.save(user);
        }

        // Return the OAuth2 user
        return oauth2User;
    }
}