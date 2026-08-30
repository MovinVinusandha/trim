package com.url_shortener.url_shortener.urls;

import com.url_shortener.url_shortener.users.User;
import com.url_shortener.url_shortener.users.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FolderService {

    private final FolderRepository folderRepository;
    private final UrlRepository urlRepository;
    private final UserRepository userRepository;

    public List<FolderDto> getUserFolders(Long userId) {
        List<Folder> folders = new ArrayList<>(folderRepository.findByUserId(userId));
        Folder linksFolder = folders.stream()
                .filter(f -> f.getName().equalsIgnoreCase("Links"))
                .findFirst()
                .orElse(null);

        if (linksFolder == null) {
            var user = userRepository.findById(userId).orElse(null);
            if (user != null) {
                Folder defaultFolder = Folder.builder()
                        .name("Links")
                        .slug("links")
                        .user(user)
                        .build();
                linksFolder = folderRepository.save(defaultFolder);
                folders.add(0, linksFolder);
            }
        }

        if (linksFolder != null) {
            List<Url> unassignedUrls = urlRepository.findByUserIdAndFolderIsNull(userId);
            if (!unassignedUrls.isEmpty()) {
                final Folder targetFolder = linksFolder;
                unassignedUrls.forEach(url -> url.setFolder(targetFolder));
                urlRepository.saveAll(unassignedUrls);
            }
        }

        // Ensure "Links" folder is always sorted first
        folders.sort((a, b) -> {
            if (a.getName().equalsIgnoreCase("Links")) return -1;
            if (b.getName().equalsIgnoreCase("Links")) return 1;
            return a.getName().compareToIgnoreCase(b.getName());
        });

        return folders.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public FolderDto createFolder(String name, User user) {
        if (folderRepository.existsByNameIgnoreCaseAndUserId(name, user.getId())) {
            throw new FolderAlreadyExistsException();
        }

        String slug = generateSlug(name, user.getId());

        Folder folder = Folder.builder()
                .name(name)
                .slug(slug)
                .user(user)
                .build();

        Folder savedFolder = folderRepository.save(folder);
        return toDto(savedFolder);
    }

    public void deleteFolder(Long folderId, User user) {
        Folder folder = folderRepository.findById(folderId)
                .orElseThrow(FolderNotFoundException::new);

        if (!folder.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("You do not have permission to delete this folder.");
        }

        if (folder.getName().equalsIgnoreCase("Links")) {
            throw new AccessDeniedException("The default Links folder cannot be deleted.");
        }

        // Deleting the folder will trigger the DB ON DELETE SET NULL cascade for the urls table
        folderRepository.delete(folder);
    }

    public FolderDto updateFolder(Long id, FolderRequestDto request, User user) {
        Folder folder = folderRepository.findById(id)
                .orElseThrow(FolderNotFoundException::new);

        if (!folder.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("You do not have permission to edit this folder.");
        }

        if (folder.getName().equalsIgnoreCase("Links")) {
            throw new AccessDeniedException("The default Links folder cannot be renamed.");
        }

        String newName = request.getName().trim();
        if (!folder.getName().equalsIgnoreCase(newName)) {
            if (folderRepository.existsByNameIgnoreCaseAndUserId(newName, user.getId())) {
                throw new FolderAlreadyExistsException();
            }
            folder.setName(newName);
            folder.setSlug(generateSlug(newName, user.getId()));
            folder = folderRepository.save(folder);
        }

        return toDto(folder);
    }

    private FolderDto toDto(Folder folder) {
        return new FolderDto(
                folder.getId(),
                folder.getName(),
                folder.getSlug(),
                folder.getCreatedAt(),
                urlRepository.countByFolderId(folder.getId())
        );
    }

    public FolderDto getFolderBySlug(String slug, Long userId) {
        Folder folder = folderRepository.findByUserIdAndSlug(userId, slug)
                .orElseThrow(FolderNotFoundException::new);
        return toDto(folder);
    }

    private String generateSlug(String name, Long userId) {
        String baseSlug = name.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("(^-)|(-$)", "");
        if (folderRepository.existsByUserIdAndSlug(userId, baseSlug)) {
             throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.CONFLICT, "A folder with a similar name already exists");
        }
        return baseSlug;
    }
}
