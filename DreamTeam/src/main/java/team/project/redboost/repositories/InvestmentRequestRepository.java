package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import team.project.redboost.entities.InvestmentRequest;

import java.util.List;

@Repository
public interface InvestmentRequestRepository extends JpaRepository<InvestmentRequest, Long> {

    @Query("SELECT ir FROM InvestmentRequest ir JOIN FETCH ir.projet JOIN FETCH ir.investor WHERE ir.investor.id = :investorId")
    List<InvestmentRequest> findByInvestorId(@Param("investorId") Long investorId);

    @Query("SELECT ir FROM InvestmentRequest ir JOIN FETCH ir.projet JOIN FETCH ir.investor WHERE ir.projet.id = :projetId")
    List<InvestmentRequest> findByProjetId(@Param("projetId") Long projetId);

    @Query("SELECT ir FROM InvestmentRequest ir JOIN FETCH ir.projet JOIN FETCH ir.investor WHERE ir.projet.id IN :projetIds")
    List<InvestmentRequest> findByProjetIdIn(@Param("projetIds") List<Long> projetIds);
}