package com.url_shortener.url_shortener.urls;

import lombok.RequiredArgsConstructor;


import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TagService {

    private final TagRepository tagRepository;
        private final UrlRepository urlRepository;

    public List<TagDto> getAllTagsForUser(Long userId) {
        
                
        
        return tagRepository.findByUserId(userId).stream()
                .map(t -> new TagDto(t.getId(), t.getName(), t.getColor(), urlRepository.countByTagsId(t.getId())))
                .collect(Collectors.toList());
    }

    public TagDto createTag(TagRequest request, Long userId) {

                

        if (tagRepository.existsByNameIgnoreCaseAndUserId(request.getName().trim(), userId)) {
            throw new TagAlreadyExistsException("A tag with this name already exists.");
        }

        Tag tag = Tag.builder()
                .name(request.getName().trim())
                .color(request.getColor() != null ? request.getColor().trim() : null)
                .userId(userId)
                .build();

        Tag savedTag = tagRepository.save(tag);
        return new TagDto(savedTag.getId(), savedTag.getName(), savedTag.getColor(), 0);
    }

    @Transactional
    public TagDto updateTag(Long id, TagRequest request, Long userId) {

                Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tag not found"));

        if (!tag.getUserId().equals(userId)) {
            throw new IllegalArgumentException("You cannot update a tag you do not own.");
        }

        String newName = request.getName().trim();
        if (!tag.getName().equalsIgnoreCase(newName)) {
            if (tagRepository.existsByNameIgnoreCaseAndUserId(newName, userId)) {
                throw new TagAlreadyExistsException("A tag with this name already exists.");
            }
            tag.setName(newName);
        }

        tag.setColor(request.getColor() != null ? request.getColor().trim() : null);

        Tag savedTag = tagRepository.save(tag);
        int linkCount = urlRepository.countByTagsId(savedTag.getId());
        
        return new TagDto(savedTag.getId(), savedTag.getName(), savedTag.getColor(), linkCount);
    }

    @Transactional
    public void deleteTag(Long id, Long userId) {

                Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tag not found"));

        if (!tag.getUserId().equals(userId)) {
            throw new IllegalArgumentException("You cannot delete a tag you do not own.");
        }

        tagRepository.deleteTagAssociations(id);
        tagRepository.deleteById(id);
    }
}
