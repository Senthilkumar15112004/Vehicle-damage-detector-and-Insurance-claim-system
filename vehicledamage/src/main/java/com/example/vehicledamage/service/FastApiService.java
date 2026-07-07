package com.example.vehicledamage.service;

import com.example.vehicledamage.dto.AnalysisResponse;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import java.io.IOException;

@Service
public class FastApiService {

    private final WebClient webClient;

    // 🟢 FORCE FIX: We hardcode the URL here to stop it from looking at localhost
    public FastApiService(WebClient.Builder webClientBuilder) {
        String containerUrl = "http://python-api:8000";
        this.webClient = webClientBuilder.baseUrl(containerUrl).build();
    }

    public AnalysisResponse getAnalysis(MultipartFile imageFile) throws IOException {
        MultipartBodyBuilder builder = new MultipartBodyBuilder();
        builder.part("file", imageFile.getResource());

        return this.webClient.post()
                .uri("/ml/analyze")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData(builder.build()))
                .retrieve()
                .bodyToMono(AnalysisResponse.class)
                .block();
    }
}
