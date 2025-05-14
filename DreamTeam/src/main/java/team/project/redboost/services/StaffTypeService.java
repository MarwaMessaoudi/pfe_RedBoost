package team.project.redboost.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import team.project.redboost.entities.*;
import team.project.redboost.repositories.*;
import jakarta.annotation.PostConstruct;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.logging.Logger;
import java.util.stream.Collectors;

@Service
public class StaffTypeService {

    private static final Logger LOGGER = Logger.getLogger(StaffTypeService.class.getName());

    @Autowired
    private StaffTypeRepository staffTypeRepository;

    @Autowired
    private AttributeRepository attributeRepository;

    @Autowired
    private StaffRepository staffRepository;

    @Autowired
    private StaffValueRepository staffValueRepository;

    @Autowired
    private ExcelService excelService;

    private final List<String> defaultAttributeNames = List.of("firstName", "lastName", "email", "phoneNumber");

    @PostConstruct
    public void initDefaultAttributes() {
        for (String attrName : defaultAttributeNames) {
            if (attributeRepository.findByAttributeName(attrName).isEmpty()) {
                Attribute attribute = new Attribute();
                attribute.setAttributeName(attrName);
                attribute.setDataType("STRING");
                try {
                    attributeRepository.save(attribute);
                    LOGGER.info("Initialized default attribute: " + attrName);
                } catch (Exception e) {
                    LOGGER.severe("Failed to initialize default attribute '" + attrName + "': " + e.getMessage());
                }
            }
        }
    }

    public List<StaffType> getAllStaffTypes() {
        List<StaffType> staffTypes = staffTypeRepository.findAll();
        for (StaffType staffType : staffTypes) {
            if (staffType.getAttributes() != null) {
                staffType.setAttributes(staffType.getAttributes().stream()
                        .filter(attr -> attr != null)
                        .collect(Collectors.toList()));
            } else {
                staffType.setAttributes(new ArrayList<>());
            }
        }
        return staffTypes;
    }

    public StaffType getStaffTypeById(Long typeId) {
        StaffType staffType = staffTypeRepository.findById(typeId)
                .orElseThrow(() -> {
                    LOGGER.warning("StaffType not found with ID: " + typeId);
                    return new IllegalArgumentException("StaffType not found");
                });
        if (staffType.getAttributes() != null) {
            staffType.setAttributes(staffType.getAttributes().stream()
                    .filter(attr -> attr != null)
                    .collect(Collectors.toList()));
        } else {
            staffType.setAttributes(new ArrayList<>());
        }
        return staffType;
    }

    public StaffType createStaffType(String typeName, List<Long> attributeIds) {
        StaffType staffType = new StaffType();
        staffType.setTypeName(typeName);
        staffType.setCreatedAt(LocalDateTime.now());

        List<Attribute> defaultAttributes = attributeRepository.findByAttributeNameIn(defaultAttributeNames);
        List<Attribute> attributes = new ArrayList<>(defaultAttributes);

        if (attributeIds != null && !attributeIds.isEmpty()) {
            List<Attribute> selectedAttributes = attributeRepository.findAllById(attributeIds);
            for (Attribute attr : selectedAttributes) {
                if (attr == null) {
                    LOGGER.warning("Null attribute found for ID in: " + attributeIds);
                    continue;
                }
                String attrNameLower = attr.getAttributeName().trim().toLowerCase();
                boolean nameExists = attributes.stream()
                        .anyMatch(existing -> existing.getAttributeName().trim().toLowerCase().equals(attrNameLower));
                if (nameExists) {
                    LOGGER.warning("Duplicate attribute name '" + attr.getAttributeName() + "' detected for StaffType: " + typeName);
                    throw new IllegalArgumentException("Attribute name '" + attr.getAttributeName() + "' already exists in this StaffType.");
                }
                attributes.add(attr);
            }
        }

        staffType.setAttributes(attributes);
        try {
            return staffTypeRepository.save(staffType);
        } catch (Exception e) {
            LOGGER.severe("Failed to save StaffType '" + typeName + "': " + e.getMessage());
            throw new RuntimeException("Failed to create StaffType due to server error", e);
        }
    }

    public StaffType updateStaffType(Long typeId, String typeName, List<Long> attributeIds) {
        StaffType staffType = staffTypeRepository.findById(typeId)
                .orElseThrow(() -> {
                    LOGGER.warning("StaffType not found with ID: " + typeId);
                    return new IllegalArgumentException("StaffType not found with ID: " + typeId);
                });

        if (typeName != null && !typeName.trim().isEmpty()) {
            staffType.setTypeName(typeName.trim());
        }

        if (attributeIds != null) {
            List<Attribute> defaultAttributes = attributeRepository.findByAttributeNameIn(defaultAttributeNames);
            List<Attribute> attributes = new ArrayList<>(defaultAttributes);

            if (!attributeIds.isEmpty()) {
                List<Attribute> selectedAttributes = attributeRepository.findAllById(attributeIds);
                for (Attribute attr : selectedAttributes) {
                    if (attr == null) {
                        LOGGER.warning("Null attribute found for ID in: " + attributeIds);
                        continue;
                    }
                    String attrNameLower = attr.getAttributeName().trim().toLowerCase();
                    boolean nameExists = attributes.stream()
                            .anyMatch(existing -> existing.getAttributeName().trim().toLowerCase().equals(attrNameLower));
                    if (!nameExists) {
                        attributes.add(attr);
                    }
                }
            }
            staffType.setAttributes(attributes);
        }

        try {
            StaffType updatedStaffType = staffTypeRepository.save(staffType);
            LOGGER.info("Updated StaffType ID: " + typeId + " with name: " + typeName + ", attributes: " + attributeIds);
            return updatedStaffType;
        } catch (Exception e) {
            LOGGER.severe("Failed to update StaffType ID " + typeId + ": " + e.getMessage());
            throw new RuntimeException("Failed to update StaffType due to server error", e);
        }
    }

    public void deleteStaffType(Long id) {
        try {
            // Check if there are any staff records associated with this StaffType
            List<Staff> associatedStaff = staffRepository.findByStaffTypeId(id);
            if (!associatedStaff.isEmpty()) {
                LOGGER.warning("Attempted to delete StaffType ID " + id + " which has " + associatedStaff.size() + " associated staff records");
                throw new IllegalStateException("Cannot delete StaffType because it is associated with " + associatedStaff.size() + " staff records.");
            }
            staffTypeRepository.deleteById(id);
            LOGGER.info("Deleted StaffType ID: " + id);
        } catch (IllegalStateException e) {
            throw e; // Re-throw to propagate the specific error message
        } catch (Exception e) {
            LOGGER.severe("Failed to delete StaffType ID " + id + ": " + e.getMessage());
            throw new RuntimeException("Failed to delete StaffType due to server error", e);
        }
    }

    public List<Attribute> getAllAttributes() {
        return attributeRepository.findAll();
    }

    public List<Attribute> getAvailableAttributesForType(Long typeId) {
        StaffType staffType = getStaffTypeById(typeId);
        List<Attribute> allAttributes = attributeRepository.findAll();
        allAttributes.removeAll(staffType.getAttributes());
        return allAttributes;
    }

    public Attribute createAttribute(String attributeName, String dataType, List<String> defaultValues) {
        if (attributeName == null || attributeName.trim().isEmpty()) {
            LOGGER.warning("Attempted to create attribute with null or empty name");
            throw new IllegalArgumentException("Attribute name cannot be null or empty");
        }

        String trimmedAttributeName = attributeName.trim();
        try {
            if (attributeRepository.findByAttributeNameIgnoreCase(trimmedAttributeName).isPresent()) {
                LOGGER.warning("Attempted to create duplicate attribute name '" + trimmedAttributeName + "'");
                throw new IllegalArgumentException("An attribute with the name '" + trimmedAttributeName + "' already exists in the system.");
            }

            Attribute attribute = new Attribute();
            attribute.setAttributeName(trimmedAttributeName);
            attribute.setDataType(dataType != null ? dataType : "STRING");
            attribute.setDefaultValues(defaultValues);
            Attribute savedAttribute = attributeRepository.save(attribute);
            LOGGER.info("Created new attribute '" + trimmedAttributeName + "' with data type: " + attribute.getDataType());
            return savedAttribute;
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            LOGGER.severe("Failed to create attribute '" + trimmedAttributeName + "': " + e.getMessage());
            throw new RuntimeException("Failed to create attribute due to server error", e);
        }
    }

    public Attribute updateAttribute(Long attributeId, String attributeName, String dataType, List<String> defaultValues) {
        Attribute attribute = attributeRepository.findById(attributeId)
                .orElseThrow(() -> {
                    LOGGER.warning("Attribute not found with ID: " + attributeId);
                    return new IllegalArgumentException("Attribute not found with ID: " + attributeId);
                });

        if (attributeName != null && !attributeName.trim().isEmpty()) {
            String trimmedAttributeName = attributeName.trim();
            Optional<Attribute> existingAttr = attributeRepository.findByAttributeNameIgnoreCase(trimmedAttributeName);
            if (existingAttr.isPresent() && !existingAttr.get().getId().equals(attributeId)) {
                LOGGER.warning("Attempted to update attribute to duplicate name '" + trimmedAttributeName + "'");
                throw new IllegalArgumentException("An attribute with the name '" + trimmedAttributeName + "' already exists.");
            }
            attribute.setAttributeName(trimmedAttributeName);
        }

        if (dataType != null && !dataType.trim().isEmpty()) {
            attribute.setDataType(dataType.trim());
        }

        attribute.setDefaultValues(defaultValues);

        try {
            Attribute updatedAttribute = attributeRepository.save(attribute);
            LOGGER.info("Updated attribute ID: " + attributeId + " with name: " + attributeName + ", dataType: " + dataType + ", defaultValues: " + defaultValues);
            return updatedAttribute;
        } catch (Exception e) {
            LOGGER.severe("Failed to update attribute ID " + attributeId + ": " + e.getMessage());
            throw new RuntimeException("Failed to update attribute due to server error", e);
        }
    }

    public void deleteAttribute(Long attributeId) {
        Attribute attribute = attributeRepository.findById(attributeId)
                .orElseThrow(() -> {
                    LOGGER.warning("Attribute not found with ID: " + attributeId);
                    return new IllegalArgumentException("Attribute not found with ID: " + attributeId);
                });

        try {
            attributeRepository.delete(attribute);
            LOGGER.info("Deleted attribute ID: " + attributeId);
        } catch (Exception e) {
            LOGGER.severe("Failed to delete attribute ID " + attributeId + ": " + e.getMessage());
            throw new RuntimeException("Failed to delete attribute due to server error", e);
        }
    }

    public void createNewAttributeForType(Long typeId, Long attributeId) {
        LOGGER.info("Attempting to add attribute ID " + attributeId + " to StaffType ID " + typeId);
        try {
            StaffType staffType = staffTypeRepository.findById(typeId)
                    .orElseThrow(() -> {
                        LOGGER.warning("StaffType not found with ID: " + typeId);
                        return new IllegalArgumentException("StaffType not found with ID: " + typeId);
                    });
            Attribute attribute = attributeRepository.findById(attributeId)
                    .orElseThrow(() -> {
                        LOGGER.warning("Attribute not found with ID: " + attributeId);
                        return new IllegalArgumentException("Attribute not found with ID: " + attributeId);
                    });

            String newAttrNameLower = attribute.getAttributeName().trim().toLowerCase();
            boolean nameExists = staffType.getAttributes().stream()
                    .anyMatch(attr -> attr.getAttributeName().trim().toLowerCase().equals(newAttrNameLower));
            if (nameExists) {
                LOGGER.warning("Attempted to add duplicate attribute name '" + attribute.getAttributeName() + "' to StaffType ID: " + typeId);
                throw new IllegalArgumentException("An attribute with the name '" + attribute.getAttributeName() + "' already exists in this StaffType.");
            }

            staffType.getAttributes().add(attribute);
            staffTypeRepository.save(staffType);
            LOGGER.info("Successfully added attribute '" + attribute.getAttributeName() + "' to StaffType ID: " + typeId);
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            LOGGER.severe("Failed to add attribute ID " + attributeId + " to StaffType ID " + typeId + ": " + e.getMessage());
            throw new RuntimeException("Failed to add attribute to StaffType due to server error", e);
        }
    }

    public byte[] downloadTemplate(Long typeId) {
        return excelService.generateExcelTemplate(typeId);
    }

    public void importStaff(Long typeId, MultipartFile file) {
        try {
            excelService.importExcelFile(typeId, file);
        } catch (IOException e) {
            throw new RuntimeException("Failed to import Excel file", e);
        }
    }

    public List<Staff> getStaffByTypes(List<Long> staffTypeIds) {
        if (staffTypeIds == null || staffTypeIds.isEmpty()) {
            return staffRepository.findAll();
        }
        List<Staff> staffList = staffRepository.findByStaffTypeIdIn(staffTypeIds);
        if (staffList.isEmpty()) {
            return staffList;
        }

        List<Long> staffIds = staffList.stream().map(Staff::getId).collect(Collectors.toList());
        List<StaffValue> staffValues = staffValueRepository.findByStaffIdIn(staffIds);

        Map<Long, List<StaffValue>> staffValuesMap = staffValues.stream()
                .collect(Collectors.groupingBy(sv -> sv.getStaff().getId()));
        for (Staff staff : staffList) {
            staff.setStaffValues(staffValuesMap.getOrDefault(staff.getId(), new ArrayList<>()));
        }

        return staffList;
    }
}