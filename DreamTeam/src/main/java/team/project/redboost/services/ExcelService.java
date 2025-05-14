package team.project.redboost.services;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddressList;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import team.project.redboost.entities.Attribute;
import team.project.redboost.entities.Staff;
import team.project.redboost.entities.StaffType;
import team.project.redboost.entities.StaffValue;
import team.project.redboost.repositories.AttributeRepository;
import team.project.redboost.repositories.StaffRepository;
import team.project.redboost.repositories.StaffTypeAttributeRepository;
import team.project.redboost.repositories.StaffTypeRepository;
import team.project.redboost.repositories.StaffValueRepository;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.logging.Logger;
import java.util.stream.Collectors;

@Service
public class ExcelService {

    private static final Logger LOGGER = Logger.getLogger(ExcelService.class.getName());

    @Autowired
    private StaffTypeAttributeRepository staffTypeAttributeRepository;

    @Autowired
    private StaffRepository staffRepository;

    @Autowired
    private StaffValueRepository staffValueRepository;

    @Autowired
    private StaffTypeRepository staffTypeRepository;

    @Autowired
    private AttributeRepository attributeRepository;

    public byte[] generateExcelTemplate(Long staffTypeId) {
        LOGGER.info("Generating Excel template for staff type ID: " + staffTypeId);
        StaffType staffType = staffTypeRepository.findById(staffTypeId)
                .orElseThrow(() -> new IllegalArgumentException("StaffType not found with ID: " + staffTypeId));
        List<Attribute> attributes = staffType.getAttributes();
        LOGGER.info("Found " + attributes.size() + " attributes for staff type: " + staffType.getTypeName());

        List<Staff> staffList = staffRepository.findByStaffTypeId(staffTypeId);
        LOGGER.info("Found " + staffList.size() + " staff entries for staff type ID: " + staffTypeId);

        List<Long> staffIds = staffList.stream().map(Staff::getId).collect(Collectors.toList());
        List<StaffValue> staffValues = staffIds.isEmpty() ? List.of() : staffValueRepository.findByStaffIdIn(staffIds);
        LOGGER.info("Found " + staffValues.size() + " staff values for " + staffIds.size() + " staff entries");

        Map<Long, Map<Long, String>> staffAttributeValues = new HashMap<>();
        for (StaffValue staffValue : staffValues) {
            Long staffId = staffValue.getStaff().getId();
            Long attributeId = staffValue.getAttribute().getId();
            staffAttributeValues.computeIfAbsent(staffId, k -> new HashMap<>()).put(attributeId, staffValue.getValue());
        }

        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Staff Template");
            Row headerRow = sheet.createRow(0);

            // Create headers and set up data validation for all rows
            CreationHelper factory = workbook.getCreationHelper();
            for (int i = 0; i < attributes.size(); i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(attributes.get(i).getAttributeName());

                Attribute attribute = attributes.get(i);
                List<String> defaultValues = attribute.getDefaultValues();
                if (defaultValues != null && !defaultValues.isEmpty()) {
                    // Add comment with default values
                    Drawing<?> drawing = sheet.createDrawingPatriarch();
                    ClientAnchor anchor = factory.createClientAnchor();
                    anchor.setDx1(0);
                    anchor.setDy1(0);
                    anchor.setDx2(0);
                    anchor.setDy2(0);
                    anchor.setCol1(i); // Start column
                    anchor.setRow1(0); // Start row
                    anchor.setCol2(i + 1); // End column
                    anchor.setRow2(1); // End row
                    Comment comment = drawing.createCellComment(anchor);
                    comment.setString(factory.createRichTextString("Allowed values: " + String.join(", ", defaultValues)));
                    cell.setCellComment(comment);

                    // Create hidden sheet for dropdown values
                    Sheet hiddenSheet = workbook.createSheet("Hidden_" + attribute.getAttributeName());
                    workbook.setSheetHidden(workbook.getSheetIndex(hiddenSheet), true);

                    for (int j = 0; j < defaultValues.size(); j++) {
                        Row row = hiddenSheet.createRow(j);
                        row.createCell(0).setCellValue(defaultValues.get(j));
                    }

                    // Define named range for dropdown
                    Name rangeName = workbook.createName();
                    rangeName.setNameName(attribute.getAttributeName() + "_values");
                    String reference = "Hidden_" + attribute.getAttributeName() + "!$A$1:$A$" + defaultValues.size();
                    rangeName.setRefersToFormula(reference);

                    // Apply data validation to the entire column (rows 1 to 1000)
                    DataValidationHelper dvHelper = sheet.getDataValidationHelper();
                    DataValidationConstraint dvConstraint = dvHelper.createFormulaListConstraint(attribute.getAttributeName() + "_values");
                    CellRangeAddressList addressList = new CellRangeAddressList(1, 1000, i, i); // Rows 1-1000
                    DataValidation dataValidation = dvHelper.createValidation(dvConstraint, addressList);
                    dataValidation.setSuppressDropDownArrow(true);
                    dataValidation.setShowErrorBox(true);
                    dataValidation.createErrorBox("Invalid Input", "Please select a value from the dropdown list.");
                    sheet.addValidationData(dataValidation);
                }
            }

            // Populate existing staff data
            int rowNum = 1;
            for (Staff staff : staffList) {
                Row dataRow = sheet.createRow(rowNum++);
                for (int i = 0; i < attributes.size(); i++) {
                    Attribute attribute = attributes.get(i);
                    Map<Long, String> attributeValues = staffAttributeValues.getOrDefault(staff.getId(), new HashMap<>());
                    String value = attributeValues.getOrDefault(attribute.getId(), "");
                    Cell cell = dataRow.createCell(i);
                    if (!value.isEmpty()) {
                        cell.setCellValue(value);
                    } else if (attribute.getDefaultValues() != null && !attribute.getDefaultValues().isEmpty()) {
                        // Pre-populate with the first default value for attributes with defaultValues
                        cell.setCellValue(attribute.getDefaultValues().get(0));
                    }
                }
            }

            // Add extra empty rows with dropdowns (up to 100 rows total)
            while (rowNum <= 500) { // Increase to 500 rows
                Row dataRow = sheet.createRow(rowNum++);
                for (int i = 0; i < attributes.size(); i++) {
                    Attribute attribute = attributes.get(i);
                    Cell cell = dataRow.createCell(i);
                    if (attribute.getDefaultValues() != null && !attribute.getDefaultValues().isEmpty()) {
                        cell.setCellValue(attribute.getDefaultValues().get(0));
                    }
                }
            }

            // Auto-size columns
            for (int i = 0; i < attributes.size(); i++) {
                sheet.autoSizeColumn(i);
            }

            try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
                workbook.write(baos);
                LOGGER.info("Excel template generated successfully for staff type ID: " + staffTypeId);
                return baos.toByteArray();
            }
        } catch (IOException e) {
            LOGGER.severe("Failed to generate Excel template for staff type ID: " + staffTypeId + ": " + e.getMessage());
            throw new RuntimeException("Failed to generate Excel template", e);
        }
    }

    public void importExcelFile(Long staffTypeId, MultipartFile file) throws IOException {
        LOGGER.info("Importing Excel file for staff type ID: " + staffTypeId);
        StaffType staffType = staffTypeRepository.findById(staffTypeId)
                .orElseThrow(() -> new IllegalArgumentException("StaffType not found with ID: " + staffTypeId));
        List<Attribute> attributes = staffType.getAttributes();

        Attribute emailAttribute = attributes.stream()
                .filter(attr -> attr.getAttributeName().equalsIgnoreCase("email"))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Email attribute not found in StaffType"));

        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            Row headerRow = sheet.getRow(0);
            if (headerRow == null) {
                LOGGER.warning("Excel file has no header row for staff type ID: " + staffTypeId);
                throw new IllegalArgumentException("Excel file must have a header row");
            }

            Map<String, Attribute> attributeMap = new HashMap<>();
            for (Attribute attr : attributes) {
                attributeMap.put(attr.getAttributeName(), attr);
                LOGGER.fine("Mapped attribute: " + attr.getAttributeName() + " (ID: " + attr.getId() + ")");
            }

            int emailColumnIndex = -1;
            for (int i = 0; i < headerRow.getLastCellNum(); i++) {
                Cell cell = headerRow.getCell(i);
                String header = cell != null ? cell.getStringCellValue().trim() : "";
                if (header.isEmpty()) {
                    LOGGER.warning("Empty header found at column " + i);
                    throw new IllegalArgumentException("Empty header found at column " + i);
                }
                if (!attributeMap.containsKey(header)) {
                    LOGGER.warning("Invalid header '" + header + "' not found in attributes: " + attributeMap.keySet());
                    throw new IllegalArgumentException("Invalid header: " + header);
                }
                if (header.equalsIgnoreCase("email")) {
                    emailColumnIndex = i;
                }
            }
            if (emailColumnIndex == -1) {
                LOGGER.warning("Email column not found in Excel file for staff type ID: " + staffTypeId);
                throw new IllegalArgumentException("Email column not found in Excel file");
            }

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) {
                    LOGGER.fine("Skipping null row " + i);
                    continue;
                }

                Cell emailCell = row.getCell(emailColumnIndex);
                String emailValue = emailCell != null ? cellToString(emailCell).trim() : "";
                if (emailValue.isEmpty()) {
                    LOGGER.info("Skipping row " + i + " due to missing email value");
                    continue;
                }

                // Updated lookup: Check for Staff with this email AND StaffType
                Optional<Staff> existingStaff = staffRepository.findByStaffTypeIdAndEmailAttributeValue(
                        staffTypeId, emailAttribute.getId(), emailValue);
                Staff staff;

                if (existingStaff.isPresent()) {
                    staff = existingStaff.get();
                    LOGGER.info("Found existing staff with email: " + emailValue + " for StaffType ID: " + staffTypeId + ", updating attributes (Staff ID: " + staff.getId() + ")");
                } else {
                    staff = new Staff();
                    staff.setStaffType(staffType);
                    staff.setCreatedAt(LocalDateTime.now());
                    staffRepository.save(staff);
                    LOGGER.info("Created new staff with ID: " + staff.getId() + " for email: " + emailValue + " and StaffType ID: " + staffTypeId);
                }

                for (int j = 0; j < headerRow.getLastCellNum(); j++) {
                    Cell cell = row.getCell(j);
                    String header = headerRow.getCell(j).getStringCellValue().trim();
                    Attribute attribute = attributeMap.get(header);
                    if (attribute == null) {
                        LOGGER.warning("No attribute mapped for header: " + header + " at row " + (i + 1));
                        continue;
                    }
                    String newValue = cell != null ? cellToString(cell).trim() : "";

                    List<String> defaultValues = attribute.getDefaultValues();
                    if (defaultValues != null && !defaultValues.isEmpty()) {
                        if (newValue.isEmpty()) {
                            LOGGER.fine("Skipping empty value for attribute '" + header + "' with default values at row " + (i + 1));
                            continue;
                        }
                        boolean isValid = defaultValues.stream().anyMatch(dv -> dv.equalsIgnoreCase(newValue));
                        if (!isValid) {
                            LOGGER.warning("Invalid value '" + newValue + "' for attribute '" + attribute.getAttributeName() + "' at row " + (i + 1));
                            throw new IllegalArgumentException("Value '" + newValue + "' for attribute '" + attribute.getAttributeName() + "' must be one of: " + defaultValues);
                        }
                    }

                    List<StaffValue> existingValues = staffValueRepository.findByStaffAndAttributeId(staff, attribute.getId());
                    if (existingValues.isEmpty()) {
                        StaffValue staffValue = new StaffValue();
                        staffValue.setStaff(staff);
                        staffValue.setAttribute(attribute);
                        staffValue.setValue(newValue);
                        staffValueRepository.save(staffValue);
                        LOGGER.info("Added new attribute value for staff ID: " + staff.getId() + ", attribute: " + attribute.getAttributeName() + ", value: " + newValue);
                    } else {
                        StaffValue staffValue = existingValues.get(0);
                        if (!staffValue.getValue().equals(newValue)) {
                            staffValue.setValue(newValue);
                            staffValueRepository.save(staffValue);
                            LOGGER.info("Updated attribute value for staff ID: " + staff.getId() + ", attribute: " + attribute.getAttributeName() + ", new value: " + newValue);
                        } else {
                            LOGGER.fine("No update needed for attribute '" + attribute.getAttributeName() + "' for staff ID: " + staff.getId() + ", value unchanged: " + newValue);
                        }
                    }
                }
            }
            LOGGER.info("Successfully imported Excel file for staff type ID: " + staffTypeId);
        } catch (IOException e) {
            LOGGER.severe("Failed to import Excel file for staff type ID: " + staffTypeId + ": " + e.getMessage());
            throw e;
        }
    }

    // Helper method to safely convert cell value to string
    private String cellToString(Cell cell) {
        if (cell == null) return "";

        // Use DataFormatter to get the cell's value as displayed in Excel
        DataFormatter formatter = new DataFormatter();
        return formatter.formatCellValue(cell).trim();
    }
}