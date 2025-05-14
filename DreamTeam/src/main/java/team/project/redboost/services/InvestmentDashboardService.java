// team/project/redboost/services/InvestmentDashboardService.java
package team.project.redboost.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import team.project.redboost.dto.InvestmentDTO;
import team.project.redboost.dto.InvestmentKpisDTO;
import team.project.redboost.dto.MonthlyDataDTO;
import team.project.redboost.entities.InvestmentRequest;
import team.project.redboost.entities.InvestmentStatus;
import team.project.redboost.entities.Phase;
import team.project.redboost.entities.Projet;
import team.project.redboost.repositories.InvestmentRepository;

import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class InvestmentDashboardService {

    @Autowired
    private InvestmentRepository investmentRepository;

    public List<InvestmentDTO> getInvestmentsByInvestor(Long investorId) {
        List<InvestmentRequest> investments = investmentRepository.findByInvestorId(investorId);

        return investments.stream()
                .map(investment -> {
                    Projet projet = investment.getProjet();
                    double roi = projet.getRevenue() != null ? projet.getRevenue() : 0.0;
                    int progress = calculateProgress(projet);

                    return new InvestmentDTO(
                            investment.getId(),
                            projet,
                            investment.getProposedAmount(),
                            roi,
                            progress,
                            investment.getRequestDate() != null ?
                                    Date.from(investment.getRequestDate().atZone(java.time.ZoneId.systemDefault()).toInstant()) :
                                    new Date()
                    );
                })
                .collect(Collectors.toList());
    }

    public InvestmentKpisDTO getInvestmentKpis(Long investorId) {
        List<Object[]> results = investmentRepository.findInvestmentsWithStats(investorId);

        double totalInvestments = results.stream()
                .mapToDouble(row -> (Double) row[1])
                .sum();

        double averageRoi = results.stream()
                .mapToDouble(row -> (Double) row[2])
                .average()
                .orElse(0.0);

        int activeInvestments = (int) results.stream()
                .filter(row -> {
                    Projet projet = (Projet) row[0];
                    return projet.getStatus() == Projet.Statut.EN_DEVELOPPEMENT ||
                            projet.getStatus() == Projet.Statut.EN_RECHERCHE_FINANCEMENT;
                })
                .count();

        return new InvestmentKpisDTO(totalInvestments, averageRoi, activeInvestments);
    }

    public List<MonthlyDataDTO> getMonthlyInvestmentData(Long investorId) {
        List<Object[]> results = investmentRepository.findMonthlyInvestmentData(investorId);

        return results.stream()
                .map(row -> new MonthlyDataDTO(
                        (String) row[0],
                        (Double) row[2],
                        (Double) row[1]
                ))
                .collect(Collectors.toList());
    }

    private int calculateProgress(Projet projet) {
        // Calculate progress based on project phases
        if (projet.getPhases() == null || projet.getPhases().isEmpty()) {
            return 0;
        }

        long totalPhases = projet.getPhases().size();
        long completedPhases = projet.getPhases().stream()
                .filter(phase -> phase.getStatus() == Phase.Status.COMPLETED)
                .count();

        return (int) ((completedPhases * 100) / totalPhases);
    }
}