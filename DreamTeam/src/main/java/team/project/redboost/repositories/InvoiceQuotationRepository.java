package team.project.redboost.repositories;

import team.project.redboost.entities.InvoiceQuotation;

import org.springframework.data.jpa.repository.JpaRepository;
public interface InvoiceQuotationRepository extends JpaRepository<InvoiceQuotation, Long> {
}