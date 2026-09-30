package com.url_shortener.url_shortener.urls;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UtmTemplateServiceTest {

    @Mock
    private UtmTemplateRepository utmTemplateRepository;

    @InjectMocks
    private UtmTemplateService utmTemplateService;

    private UtmTemplate template;

    @BeforeEach
    void setUp() {
        template = UtmTemplate.builder()
                .id(10L)
                .name("Summer Promo")
                .source("google")
                .medium("cpc")
                .campaign("summer_sale")
                .term("shoes")
                .content("ad_1")
                .ref("mysite.com")
                .createdAt(LocalDateTime.now())
                .userId(1L)
                .build();
    }

    @Test
    void getUserTemplates_Success() {
        when(utmTemplateRepository.findByUserIdOrderByCreatedAtDesc(1L)).thenReturn(List.of(template));

        List<UtmTemplateDto> dtos = utmTemplateService.getUserTemplates(1L);

        assertEquals(1, dtos.size());
        assertEquals("Summer Promo", dtos.get(0).getName());
        assertEquals("google", dtos.get(0).getSource());
    }

    @Test
    void createTemplate_Success() {
        UtmTemplateRequest request = UtmTemplateRequest.builder()
                .name("New Promo")
                .source("twitter")
                .medium("social")
                .campaign("launch")
                .build();

        when(utmTemplateRepository.existsByNameIgnoreCaseAndUserId("New Promo", 1L)).thenReturn(false);
        when(utmTemplateRepository.save(any(UtmTemplate.class))).thenAnswer(invocation -> {
            UtmTemplate t = invocation.getArgument(0);
            t.setId(11L);
            return t;
        });

        UtmTemplateDto result = utmTemplateService.createTemplate(request, 1L);

        assertNotNull(result);
        assertEquals(11L, result.getId());
        assertEquals("New Promo", result.getName());
        assertEquals("twitter", result.getSource());
    }

    @Test
    void createTemplate_DuplicateName_ThrowsException() {
        UtmTemplateRequest request = UtmTemplateRequest.builder()
                .name("Summer Promo")
                .build();

        when(utmTemplateRepository.existsByNameIgnoreCaseAndUserId("Summer Promo", 1L)).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> utmTemplateService.createTemplate(request, 1L));
    }

    @Test
    void updateTemplate_Success() {
        UtmTemplateRequest request = UtmTemplateRequest.builder()
                .name("Updated Promo")
                .source("facebook")
                .build();

        when(utmTemplateRepository.findById(10L)).thenReturn(Optional.of(template));
        when(utmTemplateRepository.existsByNameIgnoreCaseAndUserId("Updated Promo", 1L)).thenReturn(false);
        when(utmTemplateRepository.save(any(UtmTemplate.class))).thenReturn(template);

        UtmTemplateDto result = utmTemplateService.updateTemplate(10L, request, 1L);

        assertNotNull(result);
        assertEquals("Updated Promo", result.getName());
        assertEquals("facebook", result.getSource());
    }

    @Test
    void updateTemplate_NotOwner_ThrowsIllegalArgumentException() {
        template.setUserId(2L);

        UtmTemplateRequest request = UtmTemplateRequest.builder()
                .name("Updated Promo")
                .build();

        when(utmTemplateRepository.findById(10L)).thenReturn(Optional.of(template));

        assertThrows(IllegalArgumentException.class, () -> utmTemplateService.updateTemplate(10L, request, 1L));
    }

    @Test
    void deleteTemplate_Success() {
        when(utmTemplateRepository.findById(10L)).thenReturn(Optional.of(template));

        utmTemplateService.deleteTemplate(10L, 1L);

        verify(utmTemplateRepository, times(1)).delete(template);
    }

    @Test
    void toggleDefaultTemplate_SetsToTrue_ClearsOldDefaults() {
        UtmTemplate oldDefault = UtmTemplate.builder()
                .id(20L)
                .name("Old Default")
                .isDefault(true)
                .userId(1L)
                .build();

        when(utmTemplateRepository.findById(10L)).thenReturn(Optional.of(template));
        when(utmTemplateRepository.findByUserIdAndIsDefaultTrue(1L)).thenReturn(List.of(oldDefault));
        when(utmTemplateRepository.save(any(UtmTemplate.class))).thenAnswer(i -> i.getArgument(0));

        UtmTemplateDto result = utmTemplateService.toggleDefaultTemplate(10L, 1L);

        assertTrue(result.getIsDefault());
        assertFalse(oldDefault.getIsDefault());
        verify(utmTemplateRepository, atLeastOnce()).save(oldDefault);
    }

    @Test
    void toggleDefaultTemplate_AlreadyDefault_TogglesToFalse() {
        template.setIsDefault(true);
        when(utmTemplateRepository.findById(10L)).thenReturn(Optional.of(template));
        when(utmTemplateRepository.save(any(UtmTemplate.class))).thenAnswer(i -> i.getArgument(0));

        UtmTemplateDto result = utmTemplateService.toggleDefaultTemplate(10L, 1L);

        assertFalse(result.getIsDefault());
    }
}
