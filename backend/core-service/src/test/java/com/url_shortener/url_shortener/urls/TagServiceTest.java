package com.url_shortener.url_shortener.urls;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

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
    private UrlRepository urlRepository;

    @InjectMocks
    private TagService tagService;

    @Test
    void getAllTagsForUser_Success() {
        Tag tag1 = Tag.builder().id(10L).name("Marketing").color("#00FF00").userId(1L).build();
        Tag tag2 = Tag.builder().id(20L).name("Dev").color("#0000FF").userId(1L).build();

        when(tagRepository.findByUserId(1L)).thenReturn(List.of(tag1, tag2));
        when(urlRepository.countByTagsId(10L)).thenReturn(5);
        when(urlRepository.countByTagsId(20L)).thenReturn(2);

        List<TagDto> result = tagService.getAllTagsForUser(1L);

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getName()).isEqualTo("Marketing");
        assertThat(result.get(0).getLinkCount()).isEqualTo(5);
    }

    @Test
    void createTag_Success() {
        TagRequest request = new TagRequest();
        request.setName("Important");
        request.setColor("#FF0000");

        when(tagRepository.existsByNameIgnoreCaseAndUserId("Important", 1L)).thenReturn(false);

        Tag savedTag = Tag.builder().id(100L).name("Important").color("#FF0000").userId(1L).build();
        when(tagRepository.save(any(Tag.class))).thenReturn(savedTag);

        TagDto dto = tagService.createTag(request, 1L);

        assertThat(dto.getName()).isEqualTo("Important");
        assertThat(dto.getColor()).isEqualTo("#FF0000");
    }

    @Test
    void createTag_NullColor_Success() {
        TagRequest request = new TagRequest();
        request.setName("PlainTag");
        request.setColor(null);

        when(tagRepository.existsByNameIgnoreCaseAndUserId("PlainTag", 1L)).thenReturn(false);

        Tag savedTag = Tag.builder().id(101L).name("PlainTag").color(null).userId(1L).build();
        when(tagRepository.save(any(Tag.class))).thenReturn(savedTag);

        TagDto dto = tagService.createTag(request, 1L);

        assertThat(dto.getName()).isEqualTo("PlainTag");
        assertThat(dto.getColor()).isNull();
    }

    @Test
    void createTag_Conflict() {
        TagRequest request = new TagRequest();
        request.setName("Duplicate");

        when(tagRepository.existsByNameIgnoreCaseAndUserId("Duplicate", 1L)).thenReturn(true);

        assertThatThrownBy(() -> tagService.createTag(request, 1L))
                .isInstanceOf(TagAlreadyExistsException.class);
    }

    @Test
    void updateTag_Success() {
        Tag tag = Tag.builder().id(100L).name("Old Name").color("#111111").userId(1L).build();
        TagRequest request = new TagRequest();
        request.setName("New Name");
        request.setColor("#222222");

        when(tagRepository.findById(100L)).thenReturn(Optional.of(tag));
        when(tagRepository.existsByNameIgnoreCaseAndUserId("New Name", 1L)).thenReturn(false);
        when(tagRepository.save(tag)).thenReturn(tag);
        when(urlRepository.countByTagsId(100L)).thenReturn(3);

        TagDto result = tagService.updateTag(100L, request, 1L);

        assertThat(result.getName()).isEqualTo("New Name");
        assertThat(result.getColor()).isEqualTo("#222222");
        assertThat(result.getLinkCount()).isEqualTo(3);
    }

    @Test
    void updateTag_NullColor_Success() {
        Tag tag = Tag.builder().id(100L).name("Old Name").color("#111111").userId(1L).build();
        TagRequest request = new TagRequest();
        request.setName("Old Name");
        request.setColor(null);

        when(tagRepository.findById(100L)).thenReturn(Optional.of(tag));
        when(tagRepository.save(tag)).thenReturn(tag);
        when(urlRepository.countByTagsId(100L)).thenReturn(1);

        TagDto result = tagService.updateTag(100L, request, 1L);

        assertThat(result.getName()).isEqualTo("Old Name");
        assertThat(result.getColor()).isNull();
    }

    @Test
    void updateTag_SameName_Success() {
        Tag tag = Tag.builder().id(100L).name("Same Name").color("#111111").userId(1L).build();
        TagRequest request = new TagRequest();
        request.setName("Same Name");
        request.setColor("#333333");

        when(tagRepository.findById(100L)).thenReturn(Optional.of(tag));
        when(tagRepository.save(tag)).thenReturn(tag);
        when(urlRepository.countByTagsId(100L)).thenReturn(1);

        TagDto result = tagService.updateTag(100L, request, 1L);

        assertThat(result.getName()).isEqualTo("Same Name");
        assertThat(result.getColor()).isEqualTo("#333333");
    }

    @Test
    void updateTag_NotFound_ThrowsException() {
        TagRequest request = new TagRequest();
        request.setName("New");
        when(tagRepository.findById(100L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> tagService.updateTag(100L, request, 1L))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Tag not found");
    }

    @Test
    void updateTag_UnauthorizedOwner_ThrowsIllegalArgumentException() {
        Tag tag = Tag.builder().id(100L).name("Tag").userId(2L).build();
        TagRequest request = new TagRequest();
        request.setName("New");

        when(tagRepository.findById(100L)).thenReturn(Optional.of(tag));

        assertThatThrownBy(() -> tagService.updateTag(100L, request, 1L))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void updateTag_NameAlreadyExists_ThrowsException() {
        Tag tag = Tag.builder().id(100L).name("Old").userId(1L).build();
        TagRequest request = new TagRequest();
        request.setName("Existing");

        when(tagRepository.findById(100L)).thenReturn(Optional.of(tag));
        when(tagRepository.existsByNameIgnoreCaseAndUserId("Existing", 1L)).thenReturn(true);

        assertThatThrownBy(() -> tagService.updateTag(100L, request, 1L))
                .isInstanceOf(TagAlreadyExistsException.class);
    }

    @Test
    void deleteTag_Success() {
        Tag tag = Tag.builder().id(100L).userId(1L).build();
        when(tagRepository.findById(100L)).thenReturn(Optional.of(tag));

        tagService.deleteTag(100L, 1L);

        verify(tagRepository).deleteTagAssociations(100L);
        verify(tagRepository).deleteById(100L);
    }

    @Test
    void deleteTag_NotFound_ThrowsException() {
        when(tagRepository.findById(100L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> tagService.deleteTag(100L, 1L))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Tag not found");
    }

    @Test
    void deleteTag_UnauthorizedOwner_ThrowsIllegalArgumentException() {
        Tag tag = Tag.builder().id(100L).userId(2L).build();

        when(tagRepository.findById(100L)).thenReturn(Optional.of(tag));

        assertThatThrownBy(() -> tagService.deleteTag(100L, 1L))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
