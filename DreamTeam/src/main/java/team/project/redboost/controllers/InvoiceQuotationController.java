package team.project.redboost.controllers;

import team.project.redboost.entities.InvoiceQuotation;
import team.project.redboost.services.InvoiceQuotationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/invoices-quotations")
public class InvoiceQuotationController {
    @Autowired
    private InvoiceQuotationService invoiceQuotationService;

    @GetMapping
    public List<InvoiceQuotation> getAllInvoicesQuotations() {
        return invoiceQuotationService.getAllInvoicesQuotations();
    }

    @GetMapping("/{id}")
    public ResponseEntity<InvoiceQuotation> getInvoiceQuotationById(@PathVariable Long id) {
        InvoiceQuotation invoiceQuotation = invoiceQuotationService.getInvoiceQuotationById(id);
        return ResponseEntity.ok(invoiceQuotation);
    }

    @PostMapping
    public ResponseEntity<InvoiceQuotation> createInvoiceQuotation(@RequestBody InvoiceQuotation invoiceQuotation) {
        InvoiceQuotation saved = invoiceQuotationService.saveInvoiceQuotation(invoiceQuotation);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<InvoiceQuotation> updateInvoiceQuotation(@PathVariable Long id, @RequestBody InvoiceQuotation invoiceQuotation) {
        invoiceQuotation.setId(id);
        InvoiceQuotation updated = invoiceQuotationService.updateInvoiceQuotation(invoiceQuotation);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteInvoiceQuotation(@PathVariable Long id) {
        invoiceQuotationService.deleteInvoiceQuotation(id);
        return ResponseEntity.noContent().build();
    }
}