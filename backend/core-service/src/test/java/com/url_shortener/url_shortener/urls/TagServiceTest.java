package com.url_shortener.url_shortener.urls;

import com.url_shortener.url_shortener.users.User;
import com.url_shortener.url_shortener.users.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TagServiceTest {

    @Mock
    private TagRepository tagRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private UrlRepository urlRepository;

    @InjectMocks
    private TagService tagService;

    private User user;

    @BeforeEach
    void setUp() {
        user = User.builder().id(1L).build();
        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken(1L, null, List.of())
        );
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void getAllTagsForUser_Success() {
        Tag tag1 = Tag.builder().id(10L).name("Marketing").color("#00FF00").user(user).build();
        Tag tag2 = Tag.builder().id(20L).name("Dev").color("#0000FF").user(user).build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(tagRepository.findByUser(user)).thenReturn(List.of(tag1, tag2));
        when(urlRepository.countByTagsId(10L)).thenReturn(5);
        when(urlRepository.countByTagsId(20L)).thenReturn(2);

        List<TagDto> result = tagService.getAllTagsForUser();

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getName()).isEqualTo("Marketing");
        assertThat(result.get(0).getLinkCount()).isEqualTo(5);
    }

    @Test
    void getAllTagsForUser_Unauthenticated_ThrowsAccessDenied() {
        SecurityContextHolder.clearContext();

        assertThatThrownBy(() -> tagService.getAllTagsForUser())
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void getAllTagsForUser_AnonymousUser_ThrowsAccessDenied() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("anonymousUser", null, List.of())
        );

        assertThatThrownBy(() -> tagService.getAllTagsForUser())
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void getAllTagsForUser_UserNotFound_ThrowsException() {
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> tagService.getAllTagsForUser())
                .isInstanceOf(RuntimeException.class)
                .hasMessage("User not found");
    }

    @Test
    void createTag_Success() {
        TagRequest request = new TagRequest();
        request.setName("Important");
        request.setColor("#FF0000");

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(tagRepository.existsByNameIgnoreCaseAndUserId("Important", 1L)).thenReturn(false);

        Tag savedTag = Tag.builder().id(100L).name("Important").color("#FF0000").user(user).build();
        when(tagRepository.save(any(Tag.class))).thenReturn(savedTag);

        TagDto dto = tagService.createTag(request);

        assertThat(dto.getName()).isEqualTo("Important");
        assertThat(dto.getColor()).isEqualTo("#FF0000");
    }

    @Test
    void createTag_NullColor_Success() {
        TagRequest request = new TagRequest();
        request.setName("PlainTag");
        request.setColor(null);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(tagRepository.existsByNameIgnoreCaseAndUserId("PlainTag", 1L)).thenReturn(false);

        Tag savedTag = Tag.builder().id(101L).name("PlainTag").color(null).user(user).build();
        when(tagRepository.save(any(Tag.class))).thenReturn(savedTag);

        TagDto dto = tagService.createTag(request);

        assertThat(dto.getName()).isEqualTo("PlainTag");
        assertThat(dto.getColor()).isNull();
    }

    @Test
    void createTag_Unauthenticated_ThrowsAccessDenied() {
        SecurityContextHolder.clearContext();
        TagRequest request = new TagRequest();
        request.setName("Important");

        assertThatThrownBy(() -> tagService.createTag(request))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void createTag_AnonymousUser_ThrowsAccessDenied() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("anonymousUser", null, List.of())
        );
        TagRequest request = new TagRequest();
        request.setName("Important");

        assertThatThrownBy(() -> tagService.createTag(request))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void createTag_Conflict() {
        TagRequest request = new TagRequest();
        request.setName("Duplicate");

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(tagRepository.existsByNameIgnoreCaseAndUserId("Duplicate", 1L)).thenReturn(true);

        assertThatThrownBy(() -> tagService.createTag(request))
                .isInstanceOf(TagAlreadyExistsException.class);
    }

    @Test
    void updateTag_Success() {
        Tag tag = Tag.builder().id(100L).name("Old Name").color("#111111").user(user).build();
        TagRequest request = new TagRequest();
        request.setName("New Name");
        request.setColor("#222222");

        when(tagRepository.findById(100L)).thenReturn(Optional.of(tag));
        when(tagRepository.existsByNameIgnoreCaseAndUserId("New Name", 1L)).thenReturn(false);
        when(tagRepository.save(tag)).thenReturn(tag);
        when(urlRepository.countByTagsId(100L)).thenReturn(3);

        TagDto result = tagService.updateTag(100L, request);

        assertThat(result.getName()).isEqualTo("New Name");
        assertThat(result.getColor()).isEqualTo("#222222");
        assertThat(result.getLinkCount()).isEqualTo(3);
    }

    @Test
    void updateTag_NullColor_Success() {
        Tag tag = Tag.builder().id(100L).name("Old Name").color("#111111").user(user).build();
        TagRequest request = new TagRequest();
        request.setName("Old Name");
        request.setColor(null);

        when(tagRepository.findById(100L)).thenReturn(Optional.of(tag));
        when(tagRepository.save(tag)).thenReturn(tag);
        when(urlRepository.countByTagsId(100L)).thenReturn(1);

        TagDto result = tagService.updateTag(100L, request);

        assertThat(result.getName()).isEqualTo("Old Name");
        assertThat(result.getColor()).isNull();
    }

    @Test
    void updateTag_SameName_Success() {
        Tag tag = Tag.builder().id(100L).name("Same Name").color("#111111").user(user).build();
        TagRequest request = new TagRequest();
        request.setName("Same Name");
        request.setColor("#333333");

        when(tagRepository.findById(100L)).thenReturn(Optional.of(tag));
        when(tagRepository.save(tag)).thenReturn(tag);
        when(urlRepository.countByTagsId(100L)).thenReturn(1);

        TagDto result = tagService.updateTag(100L, request);

        assertThat(result.getName()).isEqualTo("Same Name");
        assertThat(result.getColor()).isEqualTo("#333333");
    }

    @Test
    void updateTag_Unauthenticated_ThrowsAccessDenied() {
        SecurityContextHolder.clearContext();
        TagRequest request = new TagRequest();
        request.setName("New");

        assertThatThrownBy(() -> tagService.updateTag(100L, request))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void updateTag_AnonymousUser_ThrowsAccessDenied() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("anonymousUser", null, List.of())
        );
        TagRequest request = new TagRequest();
        request.setName("New");

        assertThatThrownBy(() -> tagService.updateTag(100L, request))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void updateTag_NotFound_ThrowsException() {
        TagRequest request = new TagRequest();
        request.setName("New");
        when(tagRepository.findById(100L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> tagService.updateTag(100L, request))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Tag not found");
    }

    @Test
    void updateTag_UnauthorizedOwner_ThrowsAccessDenied() {
        User otherUser = User.builder().id(2L).build();
        Tag tag = Tag.builder().id(100L).name("Tag").user(otherUser).build();
        TagRequest request = new TagRequest();
        request.setName("New");

        when(tagRepository.findById(100L)).thenReturn(Optional.of(tag));

        assertThatThrownBy(() -> tagService.updateTag(100L, request))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void updateTag_NameAlreadyExists_ThrowsException() {
        Tag tag = Tag.builder().id(100L).name("Old").user(user).build();
        TagRequest request = new TagRequest();
        request.setName("Existing");

        when(tagRepository.findById(100L)).thenReturn(Optional.of(tag));
        when(tagRepository.existsByNameIgnoreCaseAndUserId("Existing", 1L)).thenReturn(true);

        assertThatThrownBy(() -> tagService.updateTag(100L, request))
                .isInstanceOf(TagAlreadyExistsException.class);
    }

    @Test
    void deleteTag_Success() {
        Tag tag = Tag.builder().id(100L).user(user).build();
        when(tagRepository.findById(100L)).thenReturn(Optional.of(tag));

        tagService.deleteTag(100L);

        verify(tagRepository).deleteTagAssociations(100L);
        verify(tagRepository).deleteById(100L);
    }

    @Test
    void deleteTag_Unauthenticated_ThrowsAccessDenied() {
        SecurityContextHolder.clearContext();

        assertThatThrownBy(() -> tagService.deleteTag(100L))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void deleteTag_AnonymousUser_ThrowsAccessDenied() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("anonymousUser", null, List.of())
        );

        assertThatThrownBy(() -> tagService.deleteTag(100L))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void deleteTag_NotFound_ThrowsException() {
        when(tagRepository.findById(100L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> tagService.deleteTag(100L))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Tag not found");
    }

    @Test
    void deleteTag_UnauthorizedOwner_ThrowsAccessDenied() {
        User otherUser = User.builder().id(2L).build();
        Tag tag = Tag.builder().id(100L).user(otherUser).build();

        when(tagRepository.findById(100L)).thenReturn(Optional.of(tag));

        assertThatThrownBy(() -> tagService.deleteTag(100L))
                .isInstanceOf(AccessDeniedException.class);
    }
}
