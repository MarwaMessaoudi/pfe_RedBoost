package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import team.project.redboost.entities.StaffTypeAttribute;
import team.project.redboost.entities.StaffType;
import team.project.redboost.entities.Attribute;

import java.util.List;
import java.util.Optional;

@Repository
public interface StaffTypeAttributeRepository extends JpaRepository<StaffTypeAttribute, Long> {
    List<StaffTypeAttribute> findByStaffTypeId(Long staffTypeId);
    Optional<StaffTypeAttribute> findByStaffTypeAndAttribute(StaffType staffType, Attribute attribute);
}