package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import team.project.redboost.entities.Staff;
import team.project.redboost.entities.StaffValue;

import java.util.List;
import java.util.Optional;

public interface StaffRepository extends JpaRepository<Staff, Long> {
    List<Staff> findByStaffTypeId(Long staffTypeId);
    List<Staff> findByStaffTypeIdIn(List<Long> staffTypeIds);

    @Query("SELECT sv FROM StaffValue sv WHERE sv.staff.id IN :staffIds")
    List<StaffValue> findStaffValuesByStaffIds(@Param("staffIds") List<Long> staffIds);

    @Query("SELECT s FROM Staff s JOIN s.staffValues sv WHERE s.staffType.id = :staffTypeId AND sv.attribute.id = :emailAttributeId AND sv.value = :email")
    Optional<Staff> findByStaffTypeIdAndEmailAttributeValue(@Param("staffTypeId") Long staffTypeId, @Param("emailAttributeId") Long emailAttributeId, @Param("email") String email);
}