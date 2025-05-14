package team.project.redboost.repositories;

import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import team.project.redboost.entities.Role;
import team.project.redboost.entities.User;

import java.util.List;
import java.util.Optional;


@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    User findByEmail(String email);
    User findByProviderId(String providerId); // Add this method
    List<User> findByRole(Role roleEnum);
    // Method to find the refresh token by user ID
    @Query("SELECT u.refreshToken FROM User u WHERE u.id = :userId")
    String findRefreshTokenById(@Param("userId") Long userId);
    List<User> findByRoleIn(List<Role> roles);

    // Method to update the refresh token for a user
    @Modifying
    @Transactional
    @Query("UPDATE User u SET u.refreshToken = :refreshToken WHERE u.id = :userId")
    void updateRefreshToken(@Param("userId") Long userId, @Param("refreshToken") String refreshToken);

    Optional<User> findByResetToken(String resetToken);

}


