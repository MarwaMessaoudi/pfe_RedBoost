package team.project.redboost.controllers;

import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import jakarta.mail.MessagingException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import team.project.redboost.config.JwtUtil;
import team.project.redboost.entities.*;
import team.project.redboost.repositories.CoachRepository;
import team.project.redboost.repositories.EntrepreneurRepository;
import team.project.redboost.repositories.InvestorRepository;
import team.project.redboost.services.CustomUserDetailsService;
import team.project.redboost.services.EmailService;
import team.project.redboost.services.FirebaseService;
import team.project.redboost.services.UserService;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/Auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;
    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private JwtUtil jwtUtil;


    @Autowired
    private EmailService emailService;

    @Autowired
    private FirebaseService firebaseService;

    @Autowired
    private CustomUserDetailsService customUserDetailsService;

    @Autowired
    private UserDetailsService userDetailsService;

    @Autowired
    private UserService userService; // Use UserService directly

    @Autowired
    private CoachRepository coachRepository;

    @Autowired
    private EntrepreneurRepository entrepreneurRepository;

    @Autowired
    private InvestorRepository investorRepository;



    @Autowired
    public AuthController(FirebaseService firebaseService, UserService userService, JwtUtil jwtUtil) {
        this.firebaseService = firebaseService;
        this.userService = userService;
        this.jwtUtil = jwtUtil;
    }


    @PostMapping("/firebase")
    public ResponseEntity<?> firebaseLogin(@RequestBody Map<String, String> request, HttpServletResponse response) {
        String idToken = request.get("idToken");
        String role = request.get("role"); // Get the role from the request body

        // Default role if not provided
        if (role == null || role.isEmpty()) {
            role = "USER"; // Default role
        }

        try {
            FirebaseToken decodedToken = firebaseService.verifyIdToken(idToken);
            String email = decodedToken.getEmail();
            String uid = decodedToken.getUid();

            // Check if user exists
            User user = userService.findByEmail(email);

            if (user == null) {
                // Create the user (Coach, Entrepreneur, or User) based on the role
                if (role.equals(Role.COACH.name())) {
                    user = new Coach(); // Create a Coach entity
                } else if (role.equals(Role.ENTREPRENEUR.name())) {
                    user = new Entrepreneur(); // Create an Entrepreneur entity
                }
                else if (role.equals(Role.INVESTOR.name())) {
                    user = new Investor(); // Create an Investor entity
                }else {
                    user = new User(); // Create a regular User entity
                }

                // Set common user fields
                user.setEmail(email);
                user.setProvider("google");
                user.setProviderId(uid);
                user.setRole(Role.valueOf(role)); // Set the role from the request body

                // Set default values for firstName and lastName if not available
                user.setFirstName("Unknown"); // Default value
                user.setLastName("Unknown");  // Default value
                user.setPassword("unknown");
                user.setPhoneNumber("Unknown");
                user.setActive(true);
                // Save the new user
                User savedUser = userService.addUser(user);

                // Assign the saved user to the `user` variable for token generation
                user = savedUser;
            }

            // Generate JWT tokens
            final String accessToken = jwtUtil.generateToken(user.getEmail(), String.valueOf(user.getId()), user.getAuthorities());
            final String refreshToken = jwtUtil.generateRefreshToken(user.getEmail(), String.valueOf(user.getId()), user.getAuthorities());


            // Set tokens as HTTP-only cookies
            Cookie accessTokenCookie = new Cookie("accessToken", accessToken);
            accessTokenCookie.setHttpOnly(true);
            accessTokenCookie.setSecure(true); // Use HTTPS
            accessTokenCookie.setPath("/");
            accessTokenCookie.setMaxAge(7 * 24 * 60 * 60); // 7 days
            response.addCookie(accessTokenCookie);

            Cookie refreshTokenCookie = new Cookie("refreshToken", refreshToken);
            refreshTokenCookie.setHttpOnly(true);
            refreshTokenCookie.setSecure(true); // Use HTTPS
            refreshTokenCookie.setPath("/");
            refreshTokenCookie.setMaxAge(30 * 24 * 60 * 60); // 7 days
            response.addCookie(refreshTokenCookie);

            // Return the tokens in the response body
            return ResponseEntity.ok(Map.of(
                    "accessToken", accessToken,
                    "refreshToken", refreshToken,
                    "roles", user.getAuthorities().stream()
                            .map(GrantedAuthority::getAuthority)
                            .collect(Collectors.toList()),
                    "user", user
            ));
        } catch (FirebaseAuthException e) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid ID token", "error", e.getMessage()));
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }





    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> loginRequest, HttpServletResponse response) {
        String email = loginRequest.get("email");
        String password = loginRequest.get("password");
        log.info("Authenticating user with email: {}", email);



        try {
            // Check if user exists before authentication
            User user = userService.findByEmail(email);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                        "message", "User not found with email: " + email,
                        "errorCode", "AUTH008"
                ));
            }

            // Check if user is active (email confirmed)
            if (!user.isActive()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                        "message", "Please confirm your email before logging in!",
                        "errorCode", "AUTH017"
                ));
            }

            // Authenticate user
            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, password));

            // Load user details (which includes authorities/roles)
            final UserDetails userDetails = userDetailsService.loadUserByUsername(email);

            // Generate JWT token
            final String accessToken = jwtUtil.generateToken(userDetails.getUsername(), String.valueOf(user.getId()), userDetails.getAuthorities());
            final String refreshToken = jwtUtil.generateRefreshToken(userDetails.getUsername(), String.valueOf(user.getId()), userDetails.getAuthorities());

            // Set tokens as HTTP-only cookies
            Cookie accessTokenCookie = new Cookie("accessToken", accessToken);
            accessTokenCookie.setHttpOnly(true);
            accessTokenCookie.setSecure(true); // Use HTTPS
            accessTokenCookie.setPath("/");
            accessTokenCookie.setMaxAge(7 * 24 * 60 * 60); // 7 days
            response.addCookie(accessTokenCookie);

            Cookie refreshTokenCookie = new Cookie("refreshToken", refreshToken);
            refreshTokenCookie.setHttpOnly(true);
            refreshTokenCookie.setSecure(true); // Use HTTPS
            refreshTokenCookie.setPath("/");
            refreshTokenCookie.setMaxAge(30 * 24 * 60 * 60); // 30 days
            response.addCookie(refreshTokenCookie);

            // Return the tokens in the response body
            System.out.println("Current server time: " + LocalDateTime.now());
            return ResponseEntity.ok(Map.of(
                    "accessToken", accessToken,
                    "refreshToken", refreshToken,
                    "message", "Login successful"
            ));

        } catch (BadCredentialsException e) {
            // Specific case for incorrect password
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "message", "Password incorrect",
                    "errorCode", "AUTH010"
            ));
        } catch (AuthenticationException e) {
            // Other authentication errors (e.g., account locked, disabled)
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "message", e.getMessage(),
                    "errorCode", "AUTH009"
            ));
        }
    }


    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(
            @RequestBody(required = false) Map<String, String> refreshRequest,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        String refreshToken = null;

        // 1. Check for refresh token in the request body
        if (refreshRequest != null && refreshRequest.containsKey("refreshToken")) {
            refreshToken = refreshRequest.get("refreshToken");
        }

        // 2. Check for refresh token in cookies if not in body
        if (refreshToken == null) {
            Cookie[] cookies = request.getCookies();
            if (cookies != null) {
                for (Cookie cookie : cookies) {
                    if ("refreshToken".equals(cookie.getName())) {
                        refreshToken = cookie.getValue();
                        break;
                    }
                }
            }
        }

        // 3. Return error if no refresh token is found
        if (refreshToken == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "message", "Refresh token not found",
                    "errorCode", "AUTH003"
            ));
        }

        try {
            // 4. Validate refresh token (ensure it’s a refresh token)
            if (!jwtUtil.validateToken(refreshToken)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                        "message", "Invalid or expired refresh token",
                        "errorCode", "AUTH005"
                ));
            }

            // 5. Extract email and userId
            String email = jwtUtil.extractEmail(refreshToken);
            String userId = jwtUtil.extractUserId(refreshToken);

            // 6. Load user details
            UserDetails userDetails;
            try {
                userDetails = userDetailsService.loadUserByUsername(email);
            } catch (UsernameNotFoundException e) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                        "message", "User not found",
                        "errorCode", "AUTH008"
                ));
            }

            // 7. Generate new access token
            String newAccessToken = jwtUtil.generateToken(email, userId, userDetails.getAuthorities());


            // 9. Set new access token as HTTP-only cookie
            Cookie accessTokenCookie = new Cookie("accessToken", newAccessToken);
            accessTokenCookie.setHttpOnly(true);
            accessTokenCookie.setSecure(true);
            accessTokenCookie.setPath("/");
            accessTokenCookie.setMaxAge(7 * 24 * 60 * 60); // 7 days
            response.addCookie(accessTokenCookie);

            // 10. Set new refresh token as HTTP-only cookie
            Cookie refreshTokenCookie = new Cookie("refreshToken", refreshToken);
            refreshTokenCookie.setHttpOnly(true);
            refreshTokenCookie.setSecure(true);
            refreshTokenCookie.setPath("/");
            refreshTokenCookie.setMaxAge(30 * 24 * 60 * 60); // 30 days
            response.addCookie(refreshTokenCookie);

            // 11. Return new tokens
            return ResponseEntity.ok(Map.of(
                    "accessToken", newAccessToken,
                    "refreshToken", refreshToken,
                    "message", "Token refreshed successfully"
            ));

        } catch (Exception e) {
            log.error("Error refreshing token: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "message", "Failed to refresh token",
                    "errorCode", "AUTH007"
            ));
        }
    }


    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody Map<String, String> registrationRequest) {
        try {
            String email = registrationRequest.get("email");
            String password = registrationRequest.get("password");
            String firstName = registrationRequest.get("firstName");
            String lastName = registrationRequest.get("lastName");
            String phoneNumber = registrationRequest.get("phoneNumber");
            Role role = Role.valueOf(registrationRequest.get("role"));


            // Validate required fields
            if (email == null || password == null || firstName == null || lastName == null || phoneNumber == null || role == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                        "message", "All fields are required!",
                        "errorCode", "AUTH010"
                ));
            }

            if (!email.matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
                return ResponseEntity.badRequest().body(Map.of(
                        "message", "Invalid email format!",
                        "errorCode", "AUTH012"
                ));
            }

            // Check if user already exists
            if (userService.findByEmail(email) != null) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                        "message", "User already exists!",
                        "errorCode", "AUTH011"
                ));
            }

            // Create the user (Coach, Entrepreneur, or User)
            User user;
            if (role == Role.COACH) {
                user = new Coach();
            } else if (role == Role.ENTREPRENEUR) {
                user = new Entrepreneur();
            }
            else if (role == Role.INVESTOR) {
                user = new Investor();
            }
            else {
                user = new User();
            }

            user.setEmail(email);
            user.setPassword(password); // Hash password before saving
            user.setFirstName(firstName);
            user.setLastName(lastName);
            user.setPhoneNumber(phoneNumber);
            user.setRole(role);

            String confirmationCode = user.generateConfirmationCode();
            user.setConfirm_code(confirmationCode);
            user.setActive(false);
            // Log the confirmation code
            System.out.println("Generated confirmation code: " + confirmationCode);

            User savedUser = userService.addUser(user);
            // Log the saved user's confirmation code
            System.out.println("Saved user confirmation code: " + savedUser.getConfirm_code());
            // If user is a coach, save additional details
            if (role == Role.COACH) {
                Coach coach = new Coach();
                coach.setId(savedUser.getId());
                coach.setEmail(savedUser.getEmail());
                coach.setFirstName(savedUser.getFirstName());
                coach.setLastName(savedUser.getLastName());
                coach.setPhoneNumber(savedUser.getPhoneNumber());
                coach.setRole(savedUser.getRole());
                coach.setConfirm_code(savedUser.getConfirm_code()); // Copy confirm code here!
                coach.setPassword(savedUser.getPassword());
                coachRepository.save(coach);
            }


            // If user is an entrepreneur, save additional details
            if (role == Role.ENTREPRENEUR) {


                Entrepreneur entrepreneur = new Entrepreneur();
                entrepreneur.setId(savedUser.getId());
                entrepreneur.setEmail(savedUser.getEmail());
                entrepreneur.setFirstName(savedUser.getFirstName());
                entrepreneur.setLastName(savedUser.getLastName());
                entrepreneur.setPhoneNumber(savedUser.getPhoneNumber());
                entrepreneur.setRole(savedUser.getRole());
                entrepreneur.setConfirm_code(savedUser.getConfirm_code()); // Copy confirm code here!
                entrepreneur.setPassword(savedUser.getPassword());
                entrepreneurRepository.save(entrepreneur);
            }


            if (role == Role.INVESTOR) {


                Investor investor = new Investor();
                investor.setId(savedUser.getId());
                investor.setEmail(savedUser.getEmail());
                investor.setFirstName(savedUser.getFirstName());
                investor.setLastName(savedUser.getLastName());
                investor.setPhoneNumber(savedUser.getPhoneNumber());
                investor.setRole(savedUser.getRole());
                investor.setConfirm_code(savedUser.getConfirm_code()); // Copy confirm code here!
                investor.setPassword(savedUser.getPassword());
                investorRepository.save(investor);
            }

            // Send confirmation email with link to confirm-email component
            String confirmationLink = "http://localhost:4200/confirm-email?email=" + email + "&code=" + confirmationCode;
            String subject = "Confirm your email";
            String body = "Hello " + firstName + " " + lastName + ",\n\n" +
                    "Thank you for registering!\n\n" +
                    "Please confirm your email by clicking the following link:\n" +
                    confirmationLink + "\n\n" +
                    "Alternatively, use this confirmation code: " + confirmationCode + "\n\n" +
                    "Best regards,\nRedboost Team";
            emailService.sendEmail(email, subject, body);

            return ResponseEntity.ok(Map.of("message", "Registration successful! A confirmation email has been sent."));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "message", "Registration failed",
                    "error", e.getMessage()
            ));
        }
    }


    @PostMapping("/confirm-email")
    public ResponseEntity<?> confirmEmail(@RequestBody Map<String, String> confirmationRequest) {
        try {
            String email = confirmationRequest.get("email");
            String code = confirmationRequest.get("code");

            User user = userService.findByEmail(email);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                        "message", "User not found!",
                        "errorCode", "AUTH013"
                ));
            }

            if (user.getConfirm_code().equals(code)) {
                user.setActive(true);
                userService.updateUser(user);
                return ResponseEntity.ok(Map.of("message", "Email confirmed successfully!"));
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                        "message", "Invalid confirmation code!",
                        "errorCode", "AUTH014"
                ));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "message", "Email confirmation failed",
                    "error", e.getMessage()
            ));
        }
    }

    @PostMapping("/resend-confirmation")
    public ResponseEntity<?> resendConfirmationEmail(@RequestBody Map<String, String> resendRequest) {
        try {
            String email = resendRequest.get("email");

            // Validate email
            if (email == null || email.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                        "message", "Email is required!",
                        "errorCode", "AUTH015"
                ));
            }

            // Check if user exists
            User user = userService.findByEmail(email);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                        "message", "User not found!",
                        "errorCode", "AUTH013"
                ));
            }

            // Check if user is already active
            if (user.isActive()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                        "message", "Email is already confirmed!",
                        "errorCode", "AUTH016"
                ));
            }

            // Optionally generate a new confirmation code
            String confirmationCode = user.getConfirm_code(); // Use existing code
            // If you want to generate a new code:
            // String confirmationCode = user.generateConfirmationCode();
            // user.setConfirm_code(confirmationCode);
            // userService.updateUser(user);

            // Send confirmation email
            String confirmationLink = "http://localhost:4200/confirm-email?email=" + email + "&code=" + confirmationCode;
            String subject = "Confirm your email";
            String body = "Hello " + user.getFirstName() + " " + user.getLastName() + ",\n\n" +
                    "Thank you for registering!\n\n" +
                    "Please confirm your email by clicking the following link:\n" +
                    confirmationLink + "\n\n" +
                    "Alternatively, use this confirmation code: " + confirmationCode + "\n\n" +
                    "Best regards,\nRedboost Team";
            emailService.sendEmail(email, subject, body);

            return ResponseEntity.ok(Map.of("message", "Confirmation email resent successfully!"));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "message", "Failed to resend confirmation email",
                    "error", e.getMessage()
            ));
        }
    }

    @GetMapping("/verifyToken")
    public ResponseEntity<?> verifyToken(@RequestHeader("Authorization") String token) {
        try {
            // Remove the "Bearer " prefix from the token
            if (token != null && token.startsWith("Bearer ")) {
                token = token.substring(7);
            }

            // Validate the token
            if (jwtUtil.validateToken(token)) {
                return ResponseEntity.ok(Map.of(
                        "message", "Token is valid",
                        "email", jwtUtil.extractEmail(token),
                        "userId", jwtUtil.extractUserId(token)
                ));
            } else {
                return ResponseEntity.status(401).body(Map.of(
                        "message", "Invalid or expired token"
                ));
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                    "message", "Failed to verify token",
                    "error", e.getMessage()
            ));
        }
    }


    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        // Clear accessToken cookie
        Cookie accessTokenCookie = new Cookie("accessToken", null);
        accessTokenCookie.setHttpOnly(true);
        accessTokenCookie.setSecure(true); // Use HTTPS
        accessTokenCookie.setPath("/");
        accessTokenCookie.setDomain("localhost");
        accessTokenCookie.setMaxAge(0); // Set expiration to 0 to delete the cookie
        response.addCookie(accessTokenCookie);

        // Clear refreshToken cookie
        Cookie refreshTokenCookie = new Cookie("refreshToken", null);
        refreshTokenCookie.setHttpOnly(true);
        refreshTokenCookie.setSecure(true); // Use HTTPS
        refreshTokenCookie.setPath("/");
        accessTokenCookie.setDomain("localhost");
        refreshTokenCookie.setMaxAge(0); // Set expiration to 0 to delete the cookie
        response.addCookie(refreshTokenCookie);

        return ResponseEntity.ok().body(Map.of("message", "Logout successful"));
    }


    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            if (email == null || email.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "message", "Email is required",
                        "errorCode", "AUTH015"
                ));
            }

            User user = userService.findByEmail(email);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                        "message", "User not found",
                        "errorCode", "AUTH013"
                ));
            }

            String resetToken = userService.generatePasswordResetToken(user);
            String resetLink = "http://localhost:4200"+ "/reset-password?token=" + resetToken;
            String subject = "Password Reset Request";
            String body = "Hello " + user.getFirstName() + ",\n\n" +
                    "You requested to reset your password. Please click the link below to reset your password:\n\n" +
                    resetLink + "\n\n" +
                    "If you didn't request this, please ignore this email.\n\n" +
                    "Best regards,\nRedboost Team";

            emailService.sendEmail(email, subject, body);

            return ResponseEntity.ok(Map.of("message", "Password reset email sent successfully"));

        } catch (IOException | MessagingException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "message", "Failed to send reset email. Please try again later.",
                    "errorCode", "AUTH018",
                    "error", e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "message", "Failed to process password reset request",
                    "error", e.getMessage()
            ));
        }
    }


    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        try {
            String token = request.get("token");
            String newPassword = request.get("newPassword");

            if (token == null || token.isEmpty() || newPassword == null || newPassword.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "message", "Token and new password are required",
                        "errorCode", "AUTH016"
                ));
            }

            // Validate token and get user
            User user = userService.findByResetToken(token);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                        "message", "Invalid or expired token",
                        "errorCode", "AUTH017"
                ));
            }
// Update password and activate user
            userService.updatePassword(user, newPassword);
            user.setActive(true);
            userService.updateUser(user);
            // Update password
            userService.updatePassword(user, newPassword);

            return ResponseEntity.ok(Map.of("message", "Password updated successfully"));

        } catch (UserService.InvalidTokenException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "message", e.getMessage(),
                    "errorCode", "AUTH017"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "message", "Failed to reset password",
                    "error", e.getMessage()
            ));
        }
    }



}