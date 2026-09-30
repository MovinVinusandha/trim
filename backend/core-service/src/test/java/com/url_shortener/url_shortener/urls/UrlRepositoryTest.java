package com.url_shortener.url_shortener.urls;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class UrlRepositoryTest {

    @Autowired
    private UrlRepository urlRepository;

    @Autowired
    private FolderRepository folderRepository;

    @Autowired
    private TagRepository tagRepository;

    private Long testUserId = 1L;

    @BeforeEach
    void setUp() {
        Folder folder = Folder.builder().name("Test Folder").slug("test-folder").userId(testUserId).build();
        folderRepository.save(folder);

        Tag tag = Tag.builder().name("Test Tag").color("#FFF").userId(testUserId).build();
        tagRepository.save(tag);

        Url url = Url.builder().shortUrl("hash123").longUrl("https://example.com")
                .userId(testUserId).folder(folder).tags(Set.of(tag)).build();
        urlRepository.save(url);
    }

    @Test
    void findAllByUserIdWithFilters_Success() {
        List<Url> urls = urlRepository.findAllByUserIdWithFilters(testUserId, null, null, null, null);
        
        assertThat(urls).hasSize(1);
        Url retrieved = urls.get(0);
        
        // Ensure no LazyInitializationException by accessing nested entities
        assertThat(retrieved.getFolder().getName()).isEqualTo("Test Folder");
        assertThat(retrieved.getTags()).hasSize(1);
        assertThat(retrieved.getTags().iterator().next().getName()).isEqualTo("Test Tag");
    }

    @Test
    void findAllByUserIdWithFilters_FilterByFolderSlug() {
        List<Url> urlsMatch = urlRepository.findAllByUserIdWithFilters(testUserId, null, null, "test-folder", null);
        assertThat(urlsMatch).hasSize(1);

        List<Url> urlsNoMatch = urlRepository.findAllByUserIdWithFilters(testUserId, null, null, "non-existent-slug", null);
        assertThat(urlsNoMatch).isEmpty();
    }
}
