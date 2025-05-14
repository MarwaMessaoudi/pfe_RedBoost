package team.project.redboost.services;

import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import team.project.redboost.entities.Produit;
import team.project.redboost.entities.Projet;
import team.project.redboost.entities.User;
import team.project.redboost.repositories.ProduitRepository;
import team.project.redboost.repositories.ProjetRepository;
import team.project.redboost.repositories.UserRepository;

import java.io.IOException;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

@Service
public class ProduitService {

    @Autowired
    private ProduitRepository produitRepository;

    @Autowired
    private ProjetRepository projetRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CloudinaryService cloudinaryService;

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            throw new SecurityException("No authenticated user found");
        }
        String email = auth.getName();
        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new SecurityException("User not found with email: " + email);
        }
        return user;
    }

    private void checkProductAccess(Projet projet, User user, boolean requireFounderOrEntrepreneur) {
        boolean isAuthorized = projet.getFounder().getId().equals(user.getId()) ||
                projet.getEntrepreneurs().contains(user) ||
                projet.getCoaches().contains(user) ||
                projet.getInvestors().contains(user);

        if (requireFounderOrEntrepreneur &&
                !projet.getFounder().getId().equals(user.getId()) &&
                !projet.getEntrepreneurs().contains(user)) {
            throw new SecurityException("Only the project founder or entrepreneurs can perform this action");
        }

        if (!isAuthorized) {
            throw new SecurityException("User is not authorized to access products for project ID: " + projet.getId());
        }
    }

    @Transactional
    public Produit createProduit(Produit produit, Long projetId, MultipartFile image) throws IOException {
        Projet projet = projetRepository.findById(projetId)
                .orElseThrow(() -> new NoSuchElementException("Projet not found with id: " + projetId));
        User currentUser = getCurrentUser();
        checkProductAccess(projet, currentUser, true); // Only founder or entrepreneurs

        if (image != null && !image.isEmpty()) {
            String imageUrl = cloudinaryService.uploadImage(image);
            produit.setImage(imageUrl);
        }

        projet.getProduits().add(produit);
        projetRepository.save(projet);
        return produit;
    }

    public List<Produit> getAllProduits() {
        User currentUser = getCurrentUser();
        List<Projet> userProjects = projetRepository.findByUser(currentUser);
        return userProjects.stream()
                .flatMap(projet -> projet.getProduits().stream())
                .toList();
    }

    public Optional<Produit> getProduitById(Long id) {
        Produit produit = produitRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Produit not found with id: " + id));
        User currentUser = getCurrentUser();
        Projet projet = projetRepository.findByProduitId(id)
                .orElseThrow(() -> new NoSuchElementException("Project not found for product ID: " + id));
        checkProductAccess(projet, currentUser, false); // Any related user
        return Optional.of(produit);
    }

    public List<Produit> getProduitsByProjetId(Long projetId) {
        Projet projet = projetRepository.findById(projetId)
                .orElseThrow(() -> new NoSuchElementException("Projet not found with id: " + projetId));
        User currentUser = getCurrentUser();
        checkProductAccess(projet, currentUser, false); // Any related user
        return projet.getProduits();
    }

    @Transactional
    public Produit updateProduit(Long id, Produit produitDetails, MultipartFile image) throws IOException {
        Produit produit = produitRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Produit not found with id: " + id));
        Projet projet = projetRepository.findByProduitId(id)
                .orElseThrow(() -> new NoSuchElementException("Project not found for product ID: " + id));
        User currentUser = getCurrentUser();
        checkProductAccess(projet, currentUser, true); // Only founder or entrepreneurs

        produit.setName(produitDetails.getName());
        produit.setDescription(produitDetails.getDescription());
        produit.setPrice(produitDetails.getPrice());
        produit.setStock(produitDetails.getStock());
        produit.setVentes(produitDetails.getVentes());
        produit.setPoids(produitDetails.getPoids());
        produit.setCategorie(produitDetails.getCategorie());
        produit.setDateExpiration(produitDetails.getDateExpiration());

        if (image != null && !image.isEmpty()) {
            if (produit.getImage() != null) {
                String publicId = extractPublicIdFromUrl(produit.getImage());
                if (publicId != null) {
                    cloudinaryService.deleteImage(publicId);
                }
            }
            String imageUrl = cloudinaryService.uploadImage(image);
            produit.setImage(imageUrl);
        }

        return produitRepository.save(produit);
    }

    @Transactional
    public void deleteProduit(Long id) throws IOException {
        Produit produit = produitRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Produit not found with id: " + id));
        Projet projet = projetRepository.findByProduitId(id)
                .orElseThrow(() -> new NoSuchElementException("Project not found for product ID: " + id));
        User currentUser = getCurrentUser();
        checkProductAccess(projet, currentUser, true); // Only founder or entrepreneurs

        if (produit.getImage() != null) {
            String publicId = extractPublicIdFromUrl(produit.getImage());
            if (publicId != null) {
                cloudinaryService.deleteImage(publicId);
            }
        }

        produitRepository.deleteById(id);
    }

    private String extractPublicIdFromUrl(String imageUrl) {
        if (imageUrl == null) return null;
        try {
            String[] parts = imageUrl.split("/");
            String fileName = parts[parts.length - 1];
            return fileName.substring(0, fileName.lastIndexOf("."));
        } catch (Exception e) {
            return null;
        }
    }
}