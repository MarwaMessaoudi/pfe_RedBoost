package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import team.project.redboost.entities.StaffValue;
import team.project.redboost.entities.Staff;

import java.util.List;
import java.util.Optional;

public interface StaffValueRepository extends JpaRepository<StaffValue, Long> {
    List<StaffValue> findByStaffIdIn(List<Long> staffIds);

    // Find StaffValue entries by staff and attribute ID
    List<StaffValue> findByStaffAndAttributeId(Staff staff, Long attributeId);

    // Find a StaffValue by attribute ID and value (to identify duplicates)
    @Query("SELECT sv FROM StaffValue sv WHERE sv.attribute.id = :attributeId AND sv.value = :value")
    Optional<StaffValue> findByAttributeIdAndValue(@Param("attributeId") Long attributeId, @Param("value") String value);
}