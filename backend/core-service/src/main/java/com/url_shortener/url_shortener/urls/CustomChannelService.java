package com.url_shortener.url_shortener.urls;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomChannelService {

    private final CustomChannelRepository customChannelRepository;

    public List<CustomChannelDto> getUserCustomChannels(Long userId) {
        return customChannelRepository.findAllByUserIdOrderByIdAsc(userId).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public CustomChannelDto createCustomChannel(CustomChannelRequest request, Long userId) {
        if (customChannelRepository.existsByNameIgnoreCaseAndUserId(request.getName().trim(), userId)) {
            throw new IllegalArgumentException("A channel with this name already exists.");
        }

        CustomChannel channel = CustomChannel.builder()
                .name(request.getName().trim())
                .utmSource(request.getUtmSource().trim())
                .utmMedium(request.getUtmMedium().trim())
                .userId(userId)
                .build();

        CustomChannel saved = customChannelRepository.save(channel);
        return toDto(saved);
    }

    @Transactional
    public void deleteCustomChannel(Long id, Long userId) {
        CustomChannel channel = customChannelRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("Custom channel not found"));
        customChannelRepository.delete(channel);
    }

    private CustomChannelDto toDto(CustomChannel channel) {
        return CustomChannelDto.builder()
                .id(channel.getId())
                .name(channel.getName())
                .utmSource(channel.getUtmSource())
                .utmMedium(channel.getUtmMedium())
                .createdAt(channel.getCreatedAt())
                .build();
    }
}
