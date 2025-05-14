package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import team.project.redboost.entities.ReponseReclamation;

import java.util.List;

@Repository
public interface ReponseReclamationRepository extends JpaRepository<ReponseReclamation, Long> {
    @Query("SELECT r FROM ReponseReclamation r WHERE r.reclamation.idReclamation = :reclamationId ORDER BY r.dateCreation ASC")
    List<ReponseReclamation> findByReclamationId(@Param("reclamationId") Long reclamationId);



    // Ou utilisez une requête JPQL explicite pour plus de clarté
     //@Query("SELECT r FROM ReponseReclamation r WHERE r.reclamation.id = :reclamationId ORDER BY r.dateCreation ASC")
    // List<ReponseReclamation> findByReclamationIdOrdered(@Param("reclamationId") Long reclamationId);
}