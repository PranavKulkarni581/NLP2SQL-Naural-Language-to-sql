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

        // Prompt for database schema generation in JSON only (no Mermaid)
        String prompt =
                "You are an expert database architect and designer. Generate a complete relational database schema for the following business model: "
                        + request.modelName()
                        + ". STRICTLY output in JSON format with the following fields: \"entities\", \"relationships\", \"description\".\n\n"
                        + "Requirements:\n"
                        + "1. \"entities\": List all tables (entities) with detailed attributes. For each attribute, include name, data type, primary key (PK), foreign key (FK) references, uniqueness, auto-increment (AI), not-null constraints, and default values if applicable.\n"
                        + "2. \"relationships\": Clearly define all relationships between entities, specifying type (one-to-one, one-to-many, many-to-many), foreign keys, and a textual explanation of the cardinality.\n"
                        + "3. \"description\": Provide a detailed textual explanation of the database schema, including the purpose of each entity, how entities relate to each other, and any design considerations. Make it clear and professional for someone reviewing the database structure.\n"
                        + "Additional instructions: Ensure consistency, meaningful attribute names, and realistic data types.";

        // Prepare request body
        Map<String, Object> body = new HashMap<>();
        body.put("contents", new Object[] {
                Map.of("parts", new Object[] { Map.of("text", prompt) })
        });

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        String schemaJson = "";

        try {
            // Call Gemini API
            ResponseEntity<Map> response = restTemplate.postForEntity(GEMINI_API_URL, entity, Map.class);
            var candidates = (List<Map<String, Object>>) response.getBody().get("candidates");

            if (candidates != null && !candidates.isEmpty()) {
                var content = (Map<String, Object>) candidates.get(0).get("content");
                var parts = (List<Map<String, Object>>) content.get("parts");
                String rawText = parts.get(0).get("text").toString();

                // Clean any leftover formatting
                rawText = rawText.replace("```json", "").replace("```", "").trim();
                schemaJson = rawText;

            } else {
                schemaJson = "{\"entities\":[],\"relationships\":[],\"description\":\"No schema generated.\"}";
            }

        } catch (Exception e) {
            schemaJson = "{\"entities\":[],\"relationships\":[],\"description\":\"Error generating schema: "
                    + e.getMessage() + "\"}";
            e.printStackTrace();
        }

        long latency = System.currentTimeMillis() - start;

        return new BusinessModelResponse(
                request.modelName(),
                schemaJson,
                "", // no Mermaid ERD
                latency,
                null
        );
    }
}
