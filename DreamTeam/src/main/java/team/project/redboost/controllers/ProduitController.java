package team.project.redboost.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import team.project.redboost.entities.Produit;
import team.project.redboost.services.ProduitService;

import java.io.IOException;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

@RestController
@RequestMapping("/api/produits")
public class ProduitController {

    @Autowired
    private ProduitService produitService;

    @Autowired
    private ObjectMapper objectMapper;

    @PreAuthorize("hasRole('ENTREPRENEUR')")
    @PostMapping(value = "/AddProduit/{projetId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Produit> createProduit(
            @PathVariable Long projetId,
            @RequestPart(name = "produit") String produitJson,
            @RequestPart(value = "image", required = false) MultipartFile image) {
        try {
            Produit produit = objectMapper.readValue(produitJson, Produit.class);
            Produit createdProduit = produitService.createProduit(produit, projetId, image);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdProduit);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        }
    }

    @PreAuthorize("hasAnyRole('ENTREPRENEUR', 'COACH', 'INVESTOR')")
    @GetMapping("/GetAllprod")
    public ResponseEntity<List<Produit>> getAllProduits() {
        try {
            List<Produit> produits = produitService.getAllProduits();
            return ResponseEntity.ok(produits);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        }
    }

    @PreAuthorize("hasAnyRole('ENTREPRENEUR', 'COACH', 'INVESTOR')")
    @GetMapping("/GetProduitById/{id}")
    public ResponseEntity<Produit> getProduitById(@PathVariable Long id) {
        try {
            Optional<Produit> produit = produitService.getProduitById(id);
            return produit.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        }
    }

    @PreAuthorize("hasAnyRole('ENTREPRENEUR', 'COACH', 'INVESTOR')")
    @GetMapping("/getByIdProjet/{idProjet}")
    public ResponseEntity<List<Produit>> getProduitsByProjetId(@PathVariable Long idProjet) {
        try {
            List<Produit> produits = produitService.getProduitsByProjetId(idProjet);
            return ResponseEntity.ok(produits);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        }
    }

    @PreAuthorize("hasRole('ENTREPRENEUR')")
    @PutMapping(value = "/UpdateProd/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Produit> updateProduit(
            @PathVariable Long id,
            @RequestPart(name = "produit") String produitJson,
            @RequestPart(value = "image", required = false) MultipartFile image) {
        try {
            Produit produitDetails = objectMapper.readValue(produitJson, Produit.class);
            Produit updatedProduit = produitService.updateProduit(id, produitDetails, image);
            return ResponseEntity.ok(updatedProduit);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        }
    }

    @PreAuthorize("hasRole('ENTREPRENEUR')")
    @DeleteMapping("/DeleteProd/{id}")
    public ResponseEntity<Void> deleteProduit(@PathVariable Long id) {
        try {
            produitService.deleteProduit(id);
            return ResponseEntity.noContent().build();
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }
}