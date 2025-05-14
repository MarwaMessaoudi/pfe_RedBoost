package team.project.redboost.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import team.project.redboost.entities.Attribute;
import team.project.redboost.entities.Staff;
import team.project.redboost.entities.StaffType;
import team.project.redboost.services.StaffTypeService;

import java.util.List;

@RestController
@RequestMapping("/api/staff")
public class StaffController {

    @Autowired
    private StaffTypeService staffTypeService;

    @GetMapping("/types")
    public ResponseEntity<List<StaffType>> getAllStaffTypes() {
        return ResponseEntity.ok(staffTypeService.getAllStaffTypes());
    }

    @PostMapping("/types")
    public ResponseEntity<StaffType> createStaffType(@RequestBody StaffTypeRequest request) {
        StaffType staffType = staffTypeService.createStaffType(request.getTypeName(), request.getAttributeIds());
        return ResponseEntity.ok(staffType);
    }

    @GetMapping("/types/{typeId}")
    public ResponseEntity<StaffType> getStaffTypeById(@PathVariable Long typeId) {
        StaffType staffType = staffTypeService.getStaffTypeById(typeId);
        return ResponseEntity.ok(staffType);
    }

    @PutMapping("/types/{id}")
    public ResponseEntity<StaffType> updateStaffType(
            @PathVariable Long id,
            @RequestBody StaffTypeRequest request) {
        StaffType updatedStaffType = staffTypeService.updateStaffType(
                id,
                request.getTypeName(),
                request.getAttributeIds());
        return ResponseEntity.ok(updatedStaffType);
    }

    @DeleteMapping("/types/{id}")
    public ResponseEntity<Void> deleteStaffType(@PathVariable Long id) {
        staffTypeService.deleteStaffType(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/types/{typeId}/attributes")
    public ResponseEntity<Void> createNewAttributeForType(@PathVariable Long typeId, @RequestBody AttributeRequest request) {
        staffTypeService.createNewAttributeForType(typeId, request.getAttributeId());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/types/{typeId}/available-attributes")
    public ResponseEntity<List<Attribute>> getAvailableAttributesForType(@PathVariable Long typeId) {
        List<Attribute> attributes = staffTypeService.getAvailableAttributesForType(typeId);
        return ResponseEntity.ok(attributes);
    }

    @GetMapping("/attributes")
    public ResponseEntity<List<Attribute>> getAllAttributes() {
        return ResponseEntity.ok(staffTypeService.getAllAttributes());
    }

    @PostMapping("/attributes")
    public ResponseEntity<Attribute> createAttribute(@RequestBody AttributeRequest request) {
        Attribute attribute = staffTypeService.createAttribute(request.getAttributeName(), request.getDataType(), request.getDefaultValues());
        return ResponseEntity.ok(attribute);
    }

    @PutMapping("/attributes/{id}")
    public ResponseEntity<Attribute> updateAttribute(
            @PathVariable Long id,
            @RequestBody AttributeRequest request) {
        Attribute updatedAttribute = staffTypeService.updateAttribute(
                id,
                request.getAttributeName(),
                request.getDataType(),
                request.getDefaultValues());
        return ResponseEntity.ok(updatedAttribute);
    }

    @DeleteMapping("/attributes/{id}")
    public ResponseEntity<Void> deleteAttribute(@PathVariable Long id) {
        staffTypeService.deleteAttribute(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/types/{typeId}/template")
    public ResponseEntity<byte[]> downloadTemplate(@PathVariable Long typeId) {
        byte[] template = staffTypeService.downloadTemplate(typeId);
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=template.xlsx")
                .body(template);
    }

    @PostMapping(value = "/types/{typeId}/import", consumes = "multipart/form-data")
    public ResponseEntity<Void> importStaff(@PathVariable Long typeId, @RequestParam("file") MultipartFile file) {
        staffTypeService.importStaff(typeId, file);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/filter")
    public ResponseEntity<List<Staff>> filterStaff(@RequestParam(required = false) List<Long> typeIds) {
        List<Staff> staffList = staffTypeService.getStaffByTypes(typeIds);
        return ResponseEntity.ok(staffList);
    }

    // DTO classes
    public static class StaffTypeRequest {
        private String typeName;
        private List<Long> attributeIds;

        public String getTypeName() {
            return typeName;
        }

        public void setTypeName(String typeName) {
            this.typeName = typeName;
        }

        public List<Long> getAttributeIds() {
            return attributeIds;
        }

        public void setAttributeIds(List<Long> attributeIds) {
            this.attributeIds = attributeIds;
        }
    }

    public static class AttributeRequest {
        private Long attributeId;
        private String attributeName;
        private String dataType;
        private List<String> defaultValues;

        public Long getAttributeId() {
            return attributeId;
        }

        public void setAttributeId(Long attributeId) {
            this.attributeId = attributeId;
        }

        public String getAttributeName() {
            return attributeName;
        }

        public void setAttributeName(String attributeName) {
            this.attributeName = attributeName;
        }

        public String getDataType() {
            return dataType;
        }

        public void setDataType(String dataType) {
            this.dataType = dataType;
        }

        public List<String> getDefaultValues() {
            return defaultValues;
        }

        public void setDefaultValues(List<String> defaultValues) {
            this.defaultValues = defaultValues;
        }
    }
}