package team.project.redboost.dto;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.databind.ser.std.StdSerializer;
import org.springframework.beans.factory.BeanFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import team.project.redboost.dto.CommentDTO;
import team.project.redboost.entities.Comment;
import team.project.redboost.services.UserService;

import java.io.IOException;

@Component
public class CommentSerializer extends StdSerializer<Comment> {

    private static BeanFactory beanFactory;

    @Autowired
    public void setBeanFactory(BeanFactory beanFactory) {
        CommentSerializer.beanFactory = beanFactory;
    }

    public CommentSerializer() {
        this(null);
    }

    public CommentSerializer(Class<Comment> t) {
        super(t);
    }

    @Override
    public void serialize(Comment comment, JsonGenerator gen, SerializerProvider provider) throws IOException {
        UserService userService = beanFactory.getBean(UserService.class);
        CommentDTO commentDTO = new CommentDTO(comment, userService.findById(comment.getUserId()));
        gen.writeObject(commentDTO);
    }
}