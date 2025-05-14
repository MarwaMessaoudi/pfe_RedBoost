package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import team.project.redboost.entities.Attribute;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AttributeRepository extends JpaRepository<Attribute, Long> {
    Optional<Attribute> findByAttributeName(String attributeName);

    // Add this method to fetch attributes by a list of names
    List<Attribute> findByAttributeNameIn(List<String> attributeNames);

    // Method to find an attribute by name, case-insensitive
    @Query("SELECT a FROM Attribute a WHERE LOWER(a.attributeName) = LOWER(:attributeName)")
    Optional<Attribute> findByAttributeNameIgnoreCase(@Param("attributeName") String attributeName);
}