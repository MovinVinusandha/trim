package com.url_shortener.url_shortener.urls;

import com.url_shortener.url_shortener.users.User;
import com.url_shortener.url_shortener.users.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
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
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private FolderService folderService;

    @Test
    void getUserFolders_LinksFolderExists_AutoAssignsUnassignedUrls() {
        User user = User.builder().id(1L).build();
        Folder linksFolder = Folder.builder().id(10L).name("Links").slug("links").user(user).build();
        Folder workFolder = Folder.builder().id(20L).name("Work").slug("work").user(user).build();
        Url unassignedUrl = Url.builder().id(100L).longUrl("https://unassigned.com").build();

        when(folderRepository.findByUserId(1L)).thenReturn(List.of(workFolder, linksFolder));
        when(urlRepository.findByUserIdAndFolderIsNull(1L)).thenReturn(List.of(unassignedUrl));
        when(urlRepository.countByFolderId(10L)).thenReturn(1);
        when(urlRepository.countByFolderId(20L)).thenReturn(0);

        List<FolderDto> result = folderService.getUserFolders(1L);

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getName()).isEqualTo("Links");
        assertThat(result.get(1).getName()).isEqualTo("Work");
        assertThat(unassignedUrl.getFolder()).isEqualTo(linksFolder);
        verify(urlRepository).saveAll(List.of(unassignedUrl));
    }

    @Test
    void getUserFolders_LinksFolderMissing_CreatesDefaultLinksFolder() {
        User user = User.builder().id(1L).build();
        Folder otherFolder = Folder.builder().id(20L).name("Archived").slug("archived").user(user).build();
        Folder newLinks = Folder.builder().id(10L).name("Links").slug("links").user(user).build();

        when(folderRepository.findByUserId(1L)).thenReturn(new ArrayList<>(List.of(otherFolder)));
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
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
        User user = User.builder().id(1L).build();
        Folder folder = Folder.builder().id(10L).name("My Folder").slug("my-folder").user(user).build();

        when(folderRepository.existsByNameIgnoreCaseAndUserId("My Folder", 1L)).thenReturn(false);
        when(folderRepository.existsByUserIdAndSlug(1L, "my-folder")).thenReturn(false);
        when(folderRepository.save(any(Folder.class))).thenReturn(folder);
        when(urlRepository.countByFolderId(10L)).thenReturn(0);

        FolderDto dto = folderService.createFolder("My Folder", user);

        assertThat(dto.getName()).isEqualTo("My Folder");
        assertThat(dto.getSlug()).isEqualTo("my-folder");
        verify(folderRepository).save(any(Folder.class));
    }

    @Test
    void createFolder_ConflictName() {
        User user = User.builder().id(1L).build();
        when(folderRepository.existsByNameIgnoreCaseAndUserId("Duplicate", 1L)).thenReturn(true);

        assertThatThrownBy(() -> folderService.createFolder("Duplicate", user))
                .isInstanceOf(FolderAlreadyExistsException.class);
    }

    @Test
    void createFolder_ConflictSlug() {
        User user = User.builder().id(1L).build();
        when(folderRepository.existsByNameIgnoreCaseAndUserId("My-Folder!", 1L)).thenReturn(false);
        when(folderRepository.existsByUserIdAndSlug(1L, "my-folder")).thenReturn(true);

        assertThatThrownBy(() -> folderService.createFolder("My-Folder!", user))
                .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void getFolderBySlug_Success() {
        Folder folder = Folder.builder().id(10L).name("My Folder").slug("my-folder").build();
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
        User user = User.builder().id(1L).build();
        Folder folder = Folder.builder().id(10L).name("Old Name").slug("old-name").user(user).build();
        FolderRequestDto request = new FolderRequestDto("New Name");

        when(folderRepository.findById(10L)).thenReturn(Optional.of(folder));
        when(folderRepository.existsByNameIgnoreCaseAndUserId("New Name", 1L)).thenReturn(false);
        when(folderRepository.existsByUserIdAndSlug(1L, "new-name")).thenReturn(false);
        when(folderRepository.save(folder)).thenReturn(folder);
        when(urlRepository.countByFolderId(10L)).thenReturn(0);

        FolderDto result = folderService.updateFolder(10L, request, user);

        assertThat(result.getName()).isEqualTo("New Name");
        assertThat(result.getSlug()).isEqualTo("new-name");
    }

    @Test
    void updateFolder_SameName_NoOpRename() {
        User user = User.builder().id(1L).build();
        Folder folder = Folder.builder().id(10L).name("Same Name").slug("same-name").user(user).build();
        FolderRequestDto request = new FolderRequestDto("Same Name");

        when(folderRepository.findById(10L)).thenReturn(Optional.of(folder));
        when(urlRepository.countByFolderId(10L)).thenReturn(0);

        FolderDto result = folderService.updateFolder(10L, request, user);

        assertThat(result.getName()).isEqualTo("Same Name");
        verify(folderRepository, never()).save(any());
    }

    @Test
    void updateFolder_UnauthorizedUser_ThrowsAccessDenied() {
        User owner = User.builder().id(1L).build();
        User otherUser = User.builder().id(2L).build();
        Folder folder = Folder.builder().id(10L).name("Folder").user(owner).build();
        FolderRequestDto request = new FolderRequestDto("New");

        when(folderRepository.findById(10L)).thenReturn(Optional.of(folder));

        assertThatThrownBy(() -> folderService.updateFolder(10L, request, otherUser))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void updateFolder_LinksFolder_ThrowsAccessDenied() {
        User user = User.builder().id(1L).build();
        Folder folder = Folder.builder().id(10L).name("Links").user(user).build();
        FolderRequestDto request = new FolderRequestDto("New Links");

        when(folderRepository.findById(10L)).thenReturn(Optional.of(folder));

        assertThatThrownBy(() -> folderService.updateFolder(10L, request, user))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void updateFolder_NameAlreadyExists_ThrowsException() {
        User user = User.builder().id(1L).build();
        Folder folder = Folder.builder().id(10L).name("Old").user(user).build();
        FolderRequestDto request = new FolderRequestDto("Duplicate");

        when(folderRepository.findById(10L)).thenReturn(Optional.of(folder));
        when(folderRepository.existsByNameIgnoreCaseAndUserId("Duplicate", 1L)).thenReturn(true);

        assertThatThrownBy(() -> folderService.updateFolder(10L, request, user))
                .isInstanceOf(FolderAlreadyExistsException.class);
    }

    @Test
    void deleteFolder_Success() {
        User user = User.builder().id(1L).build();
        Folder folder = Folder.builder().id(10L).name("My Folder").user(user).build();

        when(folderRepository.findById(10L)).thenReturn(Optional.of(folder));

        folderService.deleteFolder(10L, user);

        verify(folderRepository).delete(folder);
    }

    @Test
    void deleteFolder_NotFound_ThrowsException() {
        User user = User.builder().id(1L).build();
        when(folderRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> folderService.deleteFolder(99L, user))
                .isInstanceOf(FolderNotFoundException.class);
    }

    @Test
    void deleteFolder_UnauthorizedUser_ThrowsAccessDenied() {
        User owner = User.builder().id(1L).build();
        User otherUser = User.builder().id(2L).build();
        Folder folder = Folder.builder().id(10L).name("My Folder").user(owner).build();

        when(folderRepository.findById(10L)).thenReturn(Optional.of(folder));

        assertThatThrownBy(() -> folderService.deleteFolder(10L, otherUser))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void deleteFolder_LinksFolder_ThrowsAccessDenied() {
        User user = User.builder().id(1L).build();
        Folder folder = Folder.builder().id(10L).name("Links").user(user).build();

        when(folderRepository.findById(10L)).thenReturn(Optional.of(folder));

        assertThatThrownBy(() -> folderService.deleteFolder(10L, user))
                .isInstanceOf(AccessDeniedException.class);
    }
}
