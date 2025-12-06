package nl2sql.nl2sql.service;

import nl2sql.nl2sql.dto.BusinessModelRequest;
import nl2sql.nl2sql.dto.BusinessModelResponse;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.*;

@Service
public class BusinessModelService {

    private static final String GEMINI_API_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyBIxjSGVjcS5BX2LAM-pxQHuc0SW-jTLaU";

    private final ObjectMapper mapper = new ObjectMapper();

    public BusinessModelResponse generateSchema(BusinessModelRequest request) {

        RestTemplate restTemplate = new RestTemplate();
        long start = System.currentTimeMillis();

        // ✅ Updated prompt
        String prompt =
                """
                You are an expert database architect.

                Generate a COMPLETE database schema for the following business model:

                """ + request.modelName() + """

                OUTPUT MUST BE STRICT JSON WITH FIELDS:
                {
                  "entities": [...],
                  "relationships": [...],
                  "description": "...",
                  "sql_script": "..."      // ✅ FULL CREATE TABLE SQL (DDL)
                }

                RULES:
                ✅ Entities must include:
                   - name
                   - attributes → name, data_type, PK, FK, unique, AI, not_null, default

                ✅ Relationships must include:
                   - from_entity
                   - to_entity
                   - type (one-to-one, one-to-many, many-to-many)
                   - FK details

                ✅ sql_script MUST:
                   - Contain ONLY SQL (no comments, no markdown)
                   - Use proper MySQL syntax
                   - Include CREATE TABLE statements
                   - Include PRIMARY KEY, FOREIGN KEY, UNIQUE, NOT NULL, AUTO_INCREMENT
                   - Be ordered correctly so FK references do not break

                Ensure output is valid JSON with no text outside the JSON.
                """;

        Map<String, Object> body = new HashMap<>();
        body.put("contents", List.of(
                Map.of("parts", List.of(Map.of("text", prompt)))
        ));
        body.put("generationConfig", Map.of(
                "responseMimeType", "application/json"
        ));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        String schemaDescription = "";
        String sqlScript = "";
        String error = null;

        try {
            ResponseEntity<Map> response =
                    restTemplate.postForEntity(GEMINI_API_URL, entity, Map.class);

            var candidates = (List<Map<String, Object>>) response.getBody().get("candidates");

            if (candidates == null || candidates.isEmpty()) {
                throw new RuntimeException("Empty response from Gemini");
            }

            var content = (Map<String, Object>) candidates.get(0).get("content");
            var parts = (List<Map<String, Object>>) content.get("parts");

            String raw = parts.get(0).get("text").toString();
            raw = raw.replace("```json", "").replace("```", "").trim();

            // ✅ Parse full JSON
            var root = mapper.readTree(raw);

            // ✅ Extract SQL separately
            sqlScript = root.path("sql_script").asText("");

            // ✅ Remove sql_script before sending to frontend
            ((com.fasterxml.jackson.databind.node.ObjectNode) root).remove("sql_script");

            // ✅ Now schemaDescription contains only entities + relationships + description
            schemaDescription = root.toString();

        } catch (Exception e) {
            e.printStackTrace();
            schemaDescription = "{\"entities\":[],\"relationships\":[],\"description\":\"Error generating schema\"}";
            sqlScript = "";
            error = e.getMessage();
        }

        long latency = System.currentTimeMillis() - start;

        return new BusinessModelResponse(
                request.modelName(),
                schemaDescription,
                null,            // You are not generating ER diagrams anymore
                latency,
                error,
                sqlScript        // ✅ FIXED — SQL always returned
        );
    }
}

