package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import team.project.redboost.entities.Produit;

public interface ProduitRepository extends JpaRepository<Produit, Long> {
}
