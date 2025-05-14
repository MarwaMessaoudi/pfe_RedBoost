package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import team.project.redboost.entities.Investor;

public interface InvestorRepository extends JpaRepository<Investor, Long> {
}
