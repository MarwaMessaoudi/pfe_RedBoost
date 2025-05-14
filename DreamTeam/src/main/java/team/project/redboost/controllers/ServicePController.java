package team.project.redboost.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import team.project.redboost.entities.ServiceP;
import team.project.redboost.services.ServicePService;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

@RestController
@RequestMapping("/api/services")
public class ServicePController {

    @Autowired
    private ServicePService servicePService;

    @PreAuthorize("hasRole('ENTREPRENEUR')")
    @PostMapping("")
    public ResponseEntity<ServiceP> createService(
            @RequestBody ServiceP service,
            @RequestParam Long projetId) {
        try {
            ServiceP newService = servicePService.createService(service, projetId);
            return new ResponseEntity<>(newService, HttpStatus.CREATED);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        }
    }

    @PreAuthorize("hasRole('ENTREPRENEUR')")
    @PostMapping("/standard/{projetId}")
    public ResponseEntity<List<ServiceP>> createStandardPacks(@PathVariable Long projetId) {
        try {
            List<ServiceP> standardPacks = servicePService.createStandardPacks(projetId);
            return new ResponseEntity<>(standardPacks, HttpStatus.CREATED);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        }
    }

    @PreAuthorize("hasAnyRole('ENTREPRENEUR', 'COACH', 'INVESTOR')")
    @GetMapping
    public ResponseEntity<List<ServiceP>> getAllServices() {
        try {
            List<ServiceP> services = servicePService.getAllServices();
            return new ResponseEntity<>(services, HttpStatus.OK);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        }
    }

    @PreAuthorize("hasAnyRole('ENTREPRENEUR', 'COACH', 'INVESTOR')")
    @GetMapping("/project/{projetId}")
    public ResponseEntity<List<ServiceP>> getServicesByProjectId(@PathVariable Long projetId) {
        try {
            List<ServiceP> services = servicePService.getServicesByProjectId(projetId);
            return new ResponseEntity<>(services, HttpStatus.OK);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        }
    }

    @PreAuthorize("hasAnyRole('ENTREPRENEUR', 'COACH', 'INVESTOR')")
    @GetMapping("/{id}")
    public ResponseEntity<ServiceP> getServiceById(@PathVariable Long id) {
        try {
            Optional<ServiceP> service = servicePService.getServiceById(id);
            return service.map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        }
    }

    @PreAuthorize("hasRole('ENTREPRENEUR')")
    @PutMapping("/{id}")
    public ResponseEntity<ServiceP> updateService(
            @PathVariable Long id,
            @RequestBody ServiceP serviceDetails) {
        try {
            ServiceP updatedService = servicePService.updateService(id, serviceDetails);
            return new ResponseEntity<>(updatedService, HttpStatus.OK);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    @PreAuthorize("hasRole('ENTREPRENEUR')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteService(@PathVariable Long id) {
        try {
            servicePService.deleteService(id);
            return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    @PreAuthorize("hasAnyRole('ENTREPRENEUR', 'COACH', 'INVESTOR')")
    @GetMapping("/getByIdProjet/{idProjet}")
    public ResponseEntity<List<ServiceP>> getServicesByProjetId(@PathVariable Long idProjet) {
        try {
            List<ServiceP> services = servicePService.getServicesByProjetId(idProjet);
            return ResponseEntity.ok(services);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        }
    }
}