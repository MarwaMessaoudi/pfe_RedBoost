// team/project/redboost/repositories/InvestmentRepository.java
package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import team.project.redboost.entities.InvestmentRequest;
import team.project.redboost.entities.Projet;

import java.time.LocalDate;
import java.util.List;

public interface InvestmentRepository extends JpaRepository<InvestmentRequest, Long> {
    List<InvestmentRequest> findByInvestorId(Long investorId);

    @Query("SELECT ir.projet, SUM(ir.proposedAmount) as totalAmount, AVG(ir.projet.revenue) as avgRoi " +
            "FROM InvestmentRequest ir " +
            "WHERE ir.investor.id = :investorId AND ir.status = 'ACCEPTED' " +
            "GROUP BY ir.projet")
    List<Object[]> findInvestmentsWithStats(Long investorId);

    @Query("SELECT FUNCTION('DATE_FORMAT', ir.requestDate, '%Y-%m') as month, " +
            "SUM(ir.proposedAmount) as investments, " +
            "AVG(ir.projet.revenue) as roi " +
            "FROM InvestmentRequest ir " +
            "WHERE ir.investor.id = :investorId AND ir.status = 'ACCEPTED' " +
            "GROUP BY FUNCTION('DATE_FORMAT', ir.requestDate, '%Y-%m') " +
            "ORDER BY month")
    List<Object[]> findMonthlyInvestmentData(Long investorId);
}