package team.project.redboost.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.util.Date;

@Data
@AllArgsConstructor
public class ReponseReclamationDTO {

    private Long idReponse;
    private Long idReclamation;
    private String message;
    private Date dateReponse;
}
