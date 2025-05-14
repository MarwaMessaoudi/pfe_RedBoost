package team.project.redboost.services;


import team.project.redboost.entities.CategorieLanding;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import team.project.redboost.entities.CategorieLanding;
import team.project.redboost.repositories.CategorieLandingRepo;

import java.util.List;
import java.util.Optional;

@Service
public class CategorieLandingService {

    @Autowired
    private CategorieLandingRepo categoryRepository;

    public List<CategorieLanding> getAllCategories() {
        return categoryRepository.findAll();
    }

    public Optional<CategorieLanding> getCategoryById(Long id) {
        return categoryRepository.findById(id);
    }

    public CategorieLanding createCategory(String title) {
        CategorieLanding category = new CategorieLanding();
        category.setTitle(title);
        return categoryRepository.save(category);
    }

    public Optional<CategorieLanding> updateCategory(Long id, String title) {
        Optional<CategorieLanding> categoryOptional = categoryRepository.findById(id);
        if (categoryOptional.isPresent()) {
            CategorieLanding category = categoryOptional.get();
            category.setTitle(title);
            return Optional.of(categoryRepository.save(category));
        }
        return Optional.empty();
    }

    public boolean deleteCategory(Long id) {
        if (categoryRepository.existsById(id)) {
            categoryRepository.deleteById(id);
            return true;
        }
        return false;
    }
}