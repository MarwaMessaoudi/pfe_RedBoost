package team.project.redboost.services;

import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import team.project.redboost.entities.Projet;
import team.project.redboost.entities.ServiceP;
import team.project.redboost.entities.User;
import team.project.redboost.repositories.ProjetRepository;
import team.project.redboost.repositories.ServiceRepository;
import team.project.redboost.repositories.UserRepository;

import java.util.Arrays;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

@Service
public class ServicePService {

    @Autowired
    private ServiceRepository serviceRepository;

    @Autowired
    private ProjetRepository projetRepository;

    @Autowired
    private UserRepository userRepository;

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

    private void checkServiceAccess(Projet projet, User user, boolean requireFounderOrEntrepreneur) {
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
            throw new SecurityException("User is not authorized to access services for project ID: " + projet.getId());
        }
    }

    @Transactional
    public ServiceP createService(ServiceP service, Long projetId) {
        Projet projet = projetRepository.findById(projetId)
                .orElseThrow(() -> new NoSuchElementException("Project not found with id: " + projetId));
        User currentUser = getCurrentUser();
        checkServiceAccess(projet, currentUser, true); // Only founder or entrepreneurs

        ServiceP savedService = serviceRepository.save(service);
        projet.getServices().add(savedService);
        projetRepository.save(projet);
        return savedService;
    }

    @Transactional
    public List<ServiceP> createStandardPacks(Long projetId) {
        Projet projet = projetRepository.findById(projetId)
                .orElseThrow(() -> new NoSuchElementException("Project not found with id: " + projetId));
        User currentUser = getCurrentUser();
        checkServiceAccess(projet, currentUser, true); // Only founder or entrepreneurs

        ServiceP freePack = new ServiceP();
        freePack.setName("Free Standard");
        freePack.setDescription("Basic offering with standard features");
        freePack.setPrice(0.0);
        freePack.setTypeservice("Free");
        freePack.setSubServices(Arrays.asList("Basic Support", "Limited Access"));

        ServiceP premiumPack = new ServiceP();
        premiumPack.setName("Premium Standard");
        premiumPack.setDescription("Enhanced offering with additional benefits");
        premiumPack.setPrice(99.99);
        premiumPack.setTypeservice("Premium");
        premiumPack.setSubServices(Arrays.asList("Priority Support", "Extended Access", "Weekly Reports"));

        ServiceP goldPack = new ServiceP();
        goldPack.setName("Gold Standard");
        goldPack.setDescription("Top-tier offering with premium advantages");
        goldPack.setPrice(199.99);
        goldPack.setTypeservice("Gold");
        goldPack.setSubServices(Arrays.asList("Dedicated Support", "Full Access", "Daily Reports", "Custom Analytics"));

        List<ServiceP> standardPacks = List.of(freePack, premiumPack, goldPack);
        List<ServiceP> savedPacks = serviceRepository.saveAll(standardPacks);
        projet.getServices().addAll(savedPacks);
        projetRepository.save(projet);

        return savedPacks;
    }

    public List<ServiceP> getAllServices() {
        User currentUser = getCurrentUser();
        List<Projet> userProjects = projetRepository.findByUser(currentUser);
        return userProjects.stream()
                .flatMap(projet -> projet.getServices().stream())
                .toList();
    }

    public List<ServiceP> getServicesByProjectId(Long projetId) {
        Projet projet = projetRepository.findById(projetId)
                .orElseThrow(() -> new NoSuchElementException("Project not found with id: " + projetId));
        User currentUser = getCurrentUser();
        checkServiceAccess(projet, currentUser, false); // Any related user
        return projet.getServices();
    }

    public Optional<ServiceP> getServiceById(Long id) {
        ServiceP service = serviceRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Service not found with id: " + id));
        User currentUser = getCurrentUser();
        Projet projet = projetRepository.findByServiceId(id)
                .orElseThrow(() -> new NoSuchElementException("Project not found for service ID: " + id));
        checkServiceAccess(projet, currentUser, false); // Any related user
        return Optional.of(service);
    }

    @Transactional
    public ServiceP updateService(Long id, ServiceP serviceDetails) {
        ServiceP service = serviceRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Service not found with id: " + id));
        Projet projet = projetRepository.findByServiceId(id)
                .orElseThrow(() -> new NoSuchElementException("Project not found for service ID: " + id));
        User currentUser = getCurrentUser();
        checkServiceAccess(projet, currentUser, true); // Only founder or entrepreneurs

        service.setName(serviceDetails.getName());
        service.setDescription(serviceDetails.getDescription());
        service.setPrice(serviceDetails.getPrice());
        service.setTypeservice(serviceDetails.getTypeservice());
        service.setSubServices(serviceDetails.getSubServices());
        return serviceRepository.save(service);
    }

    @Transactional
    public void deleteService(Long id) {
        ServiceP service = serviceRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Service not found with id: " + id));
        Projet projet = projetRepository.findByServiceId(id)
                .orElseThrow(() -> new NoSuchElementException("Project not found for service ID: " + id));
        User currentUser = getCurrentUser();
        checkServiceAccess(projet, currentUser, true); // Only founder or entrepreneurs

        serviceRepository.deleteById(id);
    }

    public List<ServiceP> getServicesByProjetId(Long projetId) {
        Projet projet = projetRepository.findById(projetId)
                .orElseThrow(() -> new NoSuchElementException("Projet not found with id: " + projetId));
        User currentUser = getCurrentUser();
        checkServiceAccess(projet, currentUser, false); // Any related user
        return projet.getServices();
    }
}