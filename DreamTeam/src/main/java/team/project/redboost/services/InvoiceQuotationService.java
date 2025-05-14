package team.project.redboost.services;

import team.project.redboost.entities.InvoiceQuotation;
import team.project.redboost.entities.InvoiceService;
import team.project.redboost.repositories.InvoiceQuotationRepository;
import team.project.redboost.repositories.CustomerRepository;
import team.project.redboost.repositories.ServiceAdminRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class InvoiceQuotationService {
    @Autowired
    private InvoiceQuotationRepository invoiceQuotationRepository;
    @Autowired
    private CustomerRepository customerRepository;
    @Autowired
    private ServiceAdminRepository serviceRepository;

    public List<InvoiceQuotation> getAllInvoicesQuotations() {
        return invoiceQuotationRepository.findAll();
    }

    public InvoiceQuotation getInvoiceQuotationById(Long id) {
        return invoiceQuotationRepository.findById(id).orElseThrow(() -> new RuntimeException("Invoice/Quotation not found"));
    }

    public InvoiceQuotation saveInvoiceQuotation(InvoiceQuotation invoiceQuotation) {
        // Validate customer
        if (invoiceQuotation.getCustomer() == null || invoiceQuotation.getCustomer().getId() == null) {
            throw new IllegalArgumentException("Customer ID must not be null");
        }
        invoiceQuotation.setCustomer(customerRepository.findById(invoiceQuotation.getCustomer().getId())
                .orElseThrow(() -> new RuntimeException("Customer not found")));

        // Ensure invoiceServices is not null
        List<InvoiceService> invoiceServices = invoiceQuotation.getInvoiceServices();
        if (invoiceServices == null) {
            invoiceServices = new ArrayList<>();
            invoiceQuotation.setInvoiceServices(invoiceServices);
        }
        if (invoiceServices.isEmpty()) {
            throw new IllegalArgumentException("At least one service must be provided");
        }

        // Validate and link services
        for (InvoiceService invoiceService : invoiceServices) {
            if (invoiceService.getService() == null || invoiceService.getService().getId() == null) {
                throw new IllegalArgumentException("Service ID must not be null");
            }
            invoiceService.setService(serviceRepository.findById(invoiceService.getService().getId())
                    .orElseThrow(() -> new RuntimeException("Service not found")));
            invoiceService.setInvoice(invoiceQuotation);
        }

        // Calculate total amount
        double total = invoiceServices.stream()
                .mapToDouble(is -> is.getQuantity() * is.getService().getPrice())
                .sum();
        invoiceQuotation.setTotalAmount(total);

        return invoiceQuotationRepository.save(invoiceQuotation);
    }

    public InvoiceQuotation updateInvoiceQuotation(InvoiceQuotation invoiceQuotation) {
        if (invoiceQuotation.getId() == null) {
            throw new IllegalArgumentException("Invoice/Quotation ID must not be null for update");
        }
        return invoiceQuotationRepository.save(invoiceQuotation);
    }

    public void deleteInvoiceQuotation(Long id) {
        invoiceQuotationRepository.deleteById(id);
    }
}