package com.url_shortener.url_shortener.urls;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class QrCodeControllerTest {

    @Mock
    private QrCodeService qrCodeService;

    private QrCodeController qrCodeController;

    @BeforeEach
    void setUp() {
        qrCodeController = new QrCodeController(qrCodeService);
    }

    @Test
    void getQrCodePreview_Success() throws Exception {
        byte[] dummyImage = new byte[]{1, 2, 3, 4};
        when(qrCodeService.generateQrCode("https://test.com", 200, 200)).thenReturn(dummyImage);

        ResponseEntity<byte[]> response = qrCodeController.getQrCodePreview("https://test.com");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo(dummyImage);
        assertThat(response.getHeaders().getContentType()).isEqualTo(MediaType.IMAGE_PNG);
    }

    @Test
    void getQrCodePreview_Exception_Returns500() throws Exception {
        when(qrCodeService.generateQrCode("error-text", 200, 200))
                .thenThrow(new RuntimeException("QR generation failure"));

        ResponseEntity<byte[]> response = qrCodeController.getQrCodePreview("error-text");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).isNull();
    }
}
