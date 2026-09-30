package com.url_shortener.url_shortener.urls;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FolderServiceTest {

    @Mock
    private FolderRepository folderRepository;
    @Mock
    private UrlRepository urlRepository;

    @InjectMocks
    private FolderService folderService;

    @Test
    void getUserFolders_LinksFolderExists_AutoAssignsUnassignedUrls() {
        Folder linksFolder = Folder.builder().id(10L).name("Links").slug("links").userId(1L).build();
        Folder workFolder = Folder.builder().id(20L).name("Work").slug("work").userId(1L).build();
        Folder alphaFolder = Folder.builder().id(30L).name("Alpha").slug("alpha").userId(1L).build();
        Url unassignedUrl = Url.builder().id(100L).longUrl("https://unassigned.com").build();

        when(folderRepository.findByUserId(1L)).thenReturn(List.of(workFolder, alphaFolder, linksFolder));
        when(urlRepository.findByUserIdAndFolderIsNull(1L)).thenReturn(List.of(unassignedUrl));
        when(urlRepository.countByFolderId(10L)).thenReturn(1);
        when(urlRepository.countByFolderId(20L)).thenReturn(0);
        when(urlRepository.countByFolderId(30L)).thenReturn(0);

        List<FolderDto> result = folderService.getUserFolders(1L);

        assertThat(result).hasSize(3);
        assertThat(result.get(0).getName()).isEqualTo("Links");
        assertThat(result.get(1).getName()).isEqualTo("Alpha");
        assertThat(result.get(2).getName()).isEqualTo("Work");
        assertThat(unassignedUrl.getFolder()).isEqualTo(linksFolder);
        verify(urlRepository).saveAll(List.of(unassignedUrl));
    }

    @Test
    void getUserFolders_LinksFolderMissing_CreatesDefaultLinksFolder() {
        Folder otherFolder = Folder.builder().id(20L).name("Archived").slug("archived").userId(1L).build();
        Folder newLinks = Folder.builder().id(10L).name("Links").slug("links").userId(1L).build();

        when(folderRepository.findByUserId(1L)).thenReturn(new ArrayList<>(List.of(otherFolder)));
        when(folderRepository.save(any(Folder.class))).thenReturn(newLinks);
        when(urlRepository.findByUserIdAndFolderIsNull(1L)).thenReturn(List.of());
        when(urlRepository.countByFolderId(10L)).thenReturn(0);
        when(urlRepository.countByFolderId(20L)).thenReturn(0);

        List<FolderDto> result = folderService.getUserFolders(1L);

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getName()).isEqualTo("Links");
        verify(folderRepository).save(any(Folder.class));
    }

    @Test
    void createFolder_Success() {
        Folder folder = Folder.builder().id(10L).name("My Folder").slug("my-folder").userId(1L).build();

        when(folderRepository.existsByNameIgnoreCaseAndUserId("My Folder", 1L)).thenReturn(false);
        when(folderRepository.existsByUserIdAndSlug(1L, "my-folder")).thenReturn(false);
        when(folderRepository.save(any(Folder.class))).thenReturn(folder);
        when(urlRepository.countByFolderId(10L)).thenReturn(0);

        FolderDto dto = folderService.createFolder("My Folder", 1L);

        assertThat(dto.getName()).isEqualTo("My Folder");
        assertThat(dto.getSlug()).isEqualTo("my-folder");
        verify(folderRepository).save(any(Folder.class));
    }

    @Test
    void createFolder_ConflictName() {
        when(folderRepository.existsByNameIgnoreCaseAndUserId("Duplicate", 1L)).thenReturn(true);

        assertThatThrownBy(() -> folderService.createFolder("Duplicate", 1L))
                .isInstanceOf(FolderAlreadyExistsException.class);
    }

    @Test
    void createFolder_ConflictSlug() {
        when(folderRepository.existsByNameIgnoreCaseAndUserId("My-Folder!", 1L)).thenReturn(false);
        when(folderRepository.existsByUserIdAndSlug(1L, "my-folder")).thenReturn(true);

        assertThatThrownBy(() -> folderService.createFolder("My-Folder!", 1L))
                .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void getFolderBySlug_Success() {
        Folder folder = Folder.builder().id(10L).name("My Folder").slug("my-folder").userId(1L).build();
        when(folderRepository.findByUserIdAndSlug(1L, "my-folder")).thenReturn(Optional.of(folder));
        when(urlRepository.countByFolderId(10L)).thenReturn(3);

        FolderDto dto = folderService.getFolderBySlug("my-folder", 1L);

        assertThat(dto.getName()).isEqualTo("My Folder");
        assertThat(dto.getSlug()).isEqualTo("my-folder");
        assertThat(dto.getLinkCount()).isEqualTo(3);
    }

    @Test
    void getFolderBySlug_NotFound_ThrowsException() {
        when(folderRepository.findByUserIdAndSlug(1L, "unknown")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> folderService.getFolderBySlug("unknown", 1L))
                .isInstanceOf(FolderNotFoundException.class);
    }

    @Test
    void updateFolder_Success() {
        Folder folder = Folder.builder().id(10L).name("Old Name").slug("old-name").userId(1L).build();
        FolderRequestDto request = new FolderRequestDto("New Name");

        when(folderRepository.findById(10L)).thenReturn(Optional.of(folder));
        when(folderRepository.existsByNameIgnoreCaseAndUserId("New Name", 1L)).thenReturn(false);
        when(folderRepository.existsByUserIdAndSlug(1L, "new-name")).thenReturn(false);
        when(folderRepository.save(folder)).thenReturn(folder);
        when(urlRepository.countByFolderId(10L)).thenReturn(0);

        FolderDto result = folderService.updateFolder(10L, request, 1L);

        assertThat(result.getName()).isEqualTo("New Name");
        assertThat(result.getSlug()).isEqualTo("new-name");
    }

    @Test
    void updateFolder_SameName_NoOpRename() {
        Folder folder = Folder.builder().id(10L).name("Same Name").slug("same-name").userId(1L).build();
        FolderRequestDto request = new FolderRequestDto("Same Name");

        when(folderRepository.findById(10L)).thenReturn(Optional.of(folder));
        when(urlRepository.countByFolderId(10L)).thenReturn(0);

        FolderDto result = folderService.updateFolder(10L, request, 1L);

        assertThat(result.getName()).isEqualTo("Same Name");
        verify(folderRepository, never()).save(any());
    }

    @Test
    void updateFolder_UnauthorizedUser_ThrowsIllegalArgumentException() {
        Folder folder = Folder.builder().id(10L).name("Folder").userId(1L).build();
        FolderRequestDto request = new FolderRequestDto("New");

        when(folderRepository.findById(10L)).thenReturn(Optional.of(folder));

        assertThatThrownBy(() -> folderService.updateFolder(10L, request, 2L))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void updateFolder_LinksFolder_ThrowsIllegalArgumentException() {
        Folder folder = Folder.builder().id(10L).name("Links").userId(1L).build();
        FolderRequestDto request = new FolderRequestDto("New Links");

        when(folderRepository.findById(10L)).thenReturn(Optional.of(folder));

        assertThatThrownBy(() -> folderService.updateFolder(10L, request, 1L))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void updateFolder_NameAlreadyExists_ThrowsException() {
        Folder folder = Folder.builder().id(10L).name("Old").userId(1L).build();
        FolderRequestDto request = new FolderRequestDto("Duplicate");

        when(folderRepository.findById(10L)).thenReturn(Optional.of(folder));
        when(folderRepository.existsByNameIgnoreCaseAndUserId("Duplicate", 1L)).thenReturn(true);

        assertThatThrownBy(() -> folderService.updateFolder(10L, request, 1L))
                .isInstanceOf(FolderAlreadyExistsException.class);
    }

    @Test
    void deleteFolder_Success() {
        Folder folder = Folder.builder().id(10L).name("My Folder").userId(1L).build();

        when(folderRepository.findById(10L)).thenReturn(Optional.of(folder));

        folderService.deleteFolder(10L, 1L);

        verify(folderRepository).delete(folder);
    }

    @Test
    void deleteFolder_NotFound_ThrowsException() {
        when(folderRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> folderService.deleteFolder(99L, 1L))
                .isInstanceOf(FolderNotFoundException.class);
    }

    @Test
    void deleteFolder_UnauthorizedUser_ThrowsIllegalArgumentException() {
        Folder folder = Folder.builder().id(10L).name("My Folder").userId(1L).build();

        when(folderRepository.findById(10L)).thenReturn(Optional.of(folder));

        assertThatThrownBy(() -> folderService.deleteFolder(10L, 2L))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void deleteFolder_LinksFolder_ThrowsIllegalArgumentException() {
        Folder folder = Folder.builder().id(10L).name("Links").userId(1L).build();

        when(folderRepository.findById(10L)).thenReturn(Optional.of(folder));

        assertThatThrownBy(() -> folderService.deleteFolder(10L, 1L))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
