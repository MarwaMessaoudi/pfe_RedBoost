package team.project.redboost.entities;

public class CategoryWithoutRelationDTO {

    private Long id;
    private String categoryName;
    private String description;

    public CategoryWithoutRelationDTO() {
    }

    public CategoryWithoutRelationDTO(Long id, String categoryName, String description) {
        this.id = id;
        this.categoryName = categoryName;
        this.description = description;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
