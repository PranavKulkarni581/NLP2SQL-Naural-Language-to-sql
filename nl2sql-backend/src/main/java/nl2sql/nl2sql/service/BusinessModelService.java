package nl2sql.nl2sql.service;

import nl2sql.nl2sql.dto.BusinessModelRequest;
import nl2sql.nl2sql.dto.BusinessModelResponse;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.util.*;

@Service
public class BusinessModelService {

    private static final String GEMINI_API_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyBIxjSGVjcS5BX2LAM-pxQHuc0SW-jTLaU";

    public BusinessModelResponse generateSchema(BusinessModelRequest request) {
        RestTemplate restTemplate = new RestTemplate();
        long start = System.currentTimeMillis();

        // 🔹 Prompt for database schema generation
        String prompt =
                "You are a database architect. Generate a full relational database schema for the following business model: "
                        + request.modelName()
                        + ".\nOutput must be STRICTLY in JSON format with the following fields:\n"
                        + "{\n"
                        + "  \"entities\": [ { \"name\": \"EntityName\", \"attributes\": [\"attr1 TYPE\", \"attr2 TYPE\"] } ],\n"
                        + "  \"relationships\": [ { \"from\": \"Entity1\", \"to\": \"Entity2\", \"type\": \"one-to-many\" } ],\n"
                        + "  \"description\": \"Explain the schema in 100-120 words\",\n"
                        + "  \"erDiagram\": \"Textual ER diagram representation\"\n"
                        + "}\n"
                        + "Do not add markdown or extra formatting. Ensure valid JSON.";

        // Prepare request body
        Map<String, Object> body = new HashMap<>();
        body.put("contents", new Object[]{
                Map.of("parts", new Object[]{
                        Map.of("text", prompt)
                })
        });

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        // Call Gemini API
        ResponseEntity<Map> response = restTemplate.postForEntity(GEMINI_API_URL, entity, Map.class);

        String schemaDescription = "";
        String erDiagram = "";

        try {
            var candidates = (List<Map<String, Object>>) response.getBody().get("candidates");
            if (candidates != null && !candidates.isEmpty()) {
                var content = (Map<String, Object>) candidates.get(0).get("content");
                var parts = (List<Map<String, Object>>) content.get("parts");
                String rawText = parts.get(0).get("text").toString();

                // Clean Gemini response
                rawText = rawText.replace("```json", "").replace("```", "").trim();
                schemaDescription = rawText; // Keep full JSON schema for frontend parsing
            }
        } catch (Exception e) {
            schemaDescription = "Error parsing Gemini response: " + e.getMessage();
        }

        long latency = System.currentTimeMillis() - start;

        return new BusinessModelResponse(
                request.modelName(),
                schemaDescription,
                erDiagram,
                latency,
                null
        );
    }
}
