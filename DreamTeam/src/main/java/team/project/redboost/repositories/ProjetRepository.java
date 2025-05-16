package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import team.project.redboost.entities.Projet;
import team.project.redboost.entities.Phase;
import team.project.redboost.entities.User;
import team.project.redboost.entities.Coach;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public interface ProjetRepository extends JpaRepository<Projet, Long> {

    @Query("SELECT p.name, p.logoUrl, p.sector, p.location, p.creationDate, p.websiteUrl, p.globalScore, p.id " +
            "FROM Projet p JOIN p.entrepreneurs e WHERE e.id = :userId")
    List<Object[]> findProjetCardByUserId(@Param("userId") Long userId);

    boolean existsByNameIgnoreCase(String name);

    @Query("SELECT p FROM Projet p LEFT JOIN FETCH p.pendingCollaborator LEFT JOIN FETCH p.founder")
    List<Projet> findAllWithPendingCollaborator();

    @Query("SELECT p.name AS name, p.logoUrl AS logoUrl, p.websiteUrl AS websiteUrl, p.creationDate AS creationDate " +
            "FROM Projet p")
    List<Projet> findAllProjectsLimited();

    List<Projet> findByEntrepreneursId(Long entrepreneurId);

    long countByFounder(User founder);

    @Query("SELECT p FROM Projet p JOIN p.phases ph WHERE ph = :phase")
    Optional<Projet> findProjetByPhase(@Param("phase") Phase phase);

    @Query(value = """
    SELECT pe.projet_id, 
           GROUP_CONCAT(
               CONCAT(
                   u.id, '|', 
                   u.first_name, '|', 
                   u.last_name, '|', 
                   u.email, '|', 
                   u.phone_number, '|', 
                   u.role, '|', 
                   COALESCE(u.profile_picture_url, '')
               ) SEPARATOR '; '
           ) AS entrepreneurs_info
    FROM projet_entrepreneur pe
    JOIN user u ON pe.user_id = u.id
    WHERE pe.projet_id = :projetId
    GROUP BY pe.projet_id
""", nativeQuery = true)
    List<Map<String, Object>> findEntrepreneursByProject(@Param("projetId") Long projetId);

    @Query("SELECT DISTINCT c FROM Projet p " +
            "JOIN p.entrepreneurs e " +
            "JOIN p.coaches pc " +
            "JOIN Coach c ON c.id = pc.id " +
            "WHERE e.id = :userId")
    List<Coach> findCoachesByEntrepreneurId(@Param("userId") Long userId);

    @Query("SELECT p FROM Projet p JOIN p.coaches c WHERE c.id = :userId")
    List<Projet> findByCoachesId(@Param("userId") Long userId);




    @Query("SELECT p FROM Projet p WHERE p.founder = :user OR :user MEMBER OF p.entrepreneurs OR :user MEMBER OF p.coaches OR :user MEMBER OF p.investors OR p.pendingCollaborator = :user")
    List<Projet> findByUser(@Param("user") User user);

    @Query("SELECT p FROM Projet p JOIN p.produits pr WHERE pr.id = :produitId")
    Optional<Projet> findByProduitId(@Param("produitId") Long produitId);

    @Query("SELECT p FROM Projet p JOIN p.services s WHERE s.id = :serviceId")
    Optional<Projet> findByServiceId(@Param("serviceId") Long serviceId);


}