package team.project.redboost.config;


import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.Optional;

@Component
public class JwtRequestFilter extends OncePerRequestFilter {

   // private static final long INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {




        // Récupération de l'en-tête Authorization depuis la requête
        final String authorizationHeader = request.getHeader("Authorization");
        String email = null;
        String jwtToken = null;

        // Vérification de la présence et du format correct du token JWT dans l'en-tête
        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            jwtToken = authorizationHeader.substring(7);
            email = jwtUtil.extractEmail(jwtToken);
            String userId = jwtUtil.extractUserId(jwtToken); // Extract the userId

            logger.info("JWT Token extracted. Email: " + email + ", UserId: " + userId); // Log the extracted email and userId
        }

        // 2️⃣ Check Cookies for JWT
        if (jwtToken == null) {
            jwtToken = getJwtFromCookies(request);
        }

        // 3️⃣ Validate Token and Authenticate User
        if (jwtToken != null) {
            email = jwtUtil.extractEmail(jwtToken);
        }


        // Vérification si l'email n'est pas nul et si aucune authentification n'est présente
        if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails = this.userDetailsService.loadUserByUsername(email);
            logger.info("UserDetails loaded: " + userDetails.getUsername()); // Log the loaded user details

            // Validation du token JWT et vérification de la correspondance avec l'utilisateur
            if (jwtUtil.validateToken(jwtToken, userDetails.getUsername())) {
                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // Gestion du délai d'inactivité
                Object details = SecurityContextHolder.getContext().getAuthentication() != null
                        ? SecurityContextHolder.getContext().getAuthentication().getDetails() : null;

//                // Vérification si le délai d'inactivité est dépassé
//                Long lastActivityTime = details instanceof Long ? (Long) details : null;
//
//                if (lastActivityTime != null && (System.currentTimeMillis() - lastActivityTime > INACTIVITY_TIMEOUT)) {
//                    SecurityContextHolder.clearContext();
//                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
//                    response.getWriter().write("{\"message\":\"Session expired\"}");
//                    response.getWriter().flush();
//                    return;
//                }

                // Mise à jour de l'heure de dernière activité et définition de l'authentification
                authToken.setDetails(System.currentTimeMillis());
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }



        // Passage au filtre suivant dans la chaîne
        chain.doFilter(request, response);
    }

    // Extract JWT from Cookies
    private String getJwtFromCookies(HttpServletRequest request) {
        if (request.getCookies() != null) {
            Optional<Cookie> jwtCookie = Arrays.stream(request.getCookies())
                    .filter(cookie -> "jwt".equals(cookie.getName()))
                    .findFirst();

            return jwtCookie.map(Cookie::getValue).orElse(null);
        }
        return null;
    }
}
