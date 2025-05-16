package team.project.redboost.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtBuilder;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;
import team.project.redboost.controllers.RendezVousController;
import team.project.redboost.entities.Role;

import java.security.Key;
import java.util.Collection;
import java.util.Date;
import java.util.function.Function;

@Component
public class JwtUtil {


    @Value("${jwt.secret.key}")
    private String secretKey;


   // private static final Logger logger = LoggerFactory.getLogger(RendezVousController.class);


  //  private static final long ACCESS_TOKEN_EXPIRATION = 2 * 60 * 1000; // 2 minutes
    private static final long ACCESS_TOKEN_EXPIRATION = 7 * 24 * 60 * 60 * 1000; // 7 days
    private static final long REFRESH_TOKEN_EXPIRATION = 30L * 24 * 60 * 60 * 1000; // 30 days


    // Add method to get the secret key
    public String getSecretKey() {
        return secretKey;
    }

    // Extract a claim from the token
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        Key key = Keys.hmacShaKeyFor(getSecretKey().getBytes());
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    // Retrieve email from JWT token
    public String extractEmail(String token) {

        return extractClaim(token, Claims::getSubject);
    }

    // Retrieve expiration date from JWT token
    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    /**
     * Generates a JWT token for email/password users (no provider or providerId).
     */
    
    public String generateToken(String email, String userId, Collection<? extends GrantedAuthority> authorities) {
        return generateToken(email, userId, null, null, authorities);
    }



    public String generateToken(String email, String userId, String provider, String providerId, Collection<? extends GrantedAuthority> authorities) {
        // Extract the single role from authorities
        String role = authorities.stream()
                .map(GrantedAuthority::getAuthority)
                .map(this::removeRolePrefix) // Remove the ROLE_ prefix
                .findFirst() // Get the first (and only) role
                .orElseThrow(() -> new IllegalArgumentException("User must have at least one role."));

        Key key = Keys.hmacShaKeyFor(getSecretKey().getBytes());

        JwtBuilder builder = Jwts.builder()
                .setSubject(email)
                .claim("role", role) // Store the role as a single string
                .claim("userId", userId) // Store the userId as a custom claim
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + ACCESS_TOKEN_EXPIRATION)) // 10 hours
                .signWith(key); // Use the Key object directly

        // Add provider and providerId only if they are not null
        if (provider != null) {
            builder.claim("provider", provider);
        }
        if (providerId != null) {
            builder.claim("providerId", providerId);
        }
        Date expirationDate = new Date(System.currentTimeMillis() + ACCESS_TOKEN_EXPIRATION);
        System.out.println("access Token Expiration: " + expirationDate);
        return builder.compact();
    }


    // Generate a refresh token for the user
    public String generateRefreshToken(String email, String userId, Collection<? extends GrantedAuthority> authorities) {
        // Extract the single role from authorities
        String role = authorities.stream()
                .map(GrantedAuthority::getAuthority)
                .map(this::removeRolePrefix) // Remove the ROLE_ prefix
                .findFirst() // Get the first (and only) role
                .orElseThrow(() -> new IllegalArgumentException("User must have at least one role."));

        Key key = Keys.hmacShaKeyFor(getSecretKey().getBytes());
        Date expirationDate = new Date(System.currentTimeMillis() + REFRESH_TOKEN_EXPIRATION);
        System.out.println(" refresh Token Expiration: " + expirationDate);
        return Jwts.builder()
                .setSubject(email)
                .claim("role", role) // Store the role as a single string
                .claim("userId", userId) // Add userId as a custom claim
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + REFRESH_TOKEN_EXPIRATION)) // 7 days
                .signWith(key) // Use the Key object directly
                .compact();
    }




    public String extractUserId(String token) {
        return extractClaim(token, claims -> claims.get("userId", String.class));
    }


    // Helper method to remove the ROLE_ prefix
    private String removeRolePrefix(String authority) {
        if (authority.startsWith("ROLE_")) {
            return authority.substring(5); // Remove the first 5 characters (ROLE_)
        }
        return authority;
    }

    // Check if the token has expired
    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    // Validate token
    public Boolean validateToken(String token, String email) {
        final String emailFromToken = extractEmail(token);
        return (emailFromToken.equals(email) && !isTokenExpired(token));
    }

    public Boolean validateToken(String token) {
        try {
            Claims claims = extractAllClaims(token);
            return !isTokenExpired(token); // Check if the token is expired
        } catch (Exception e) {
            return false; // Token is invalid
        }
    }


    // Get the role from the token
    public Role getRoleFromToken(String token) {
        Key key = Keys.hmacShaKeyFor(getSecretKey().getBytes());

        Claims claims = Jwts.parserBuilder()
                .setSigningKey(key) // Use the Key object directly
                .build()
                .parseClaimsJws(token)
                .getBody();

        String roleName = claims.get("role", String.class); // Extract the role as a string
        return Role.valueOf(roleName); // Convert the string to the Role enum
    }

}