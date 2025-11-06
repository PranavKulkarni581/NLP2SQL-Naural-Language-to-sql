package nl2sql.nl2sql.service;

import nl2sql.nl2sql.dto.Dialect;
import nl2sql.nl2sql.dto.TranslateRequest;
import nl2sql.nl2sql.dto.TranslateResponse;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.*;

@Service
public class TranslateService {

    private static final String GEMINI_API_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyBIxjSGVjcS5BX2LAM-pxQHuc0SW-jTLaU";

    private final ObjectMapper mapper = new ObjectMapper();

    public TranslateResponse translate(TranslateRequest request) {

        RestTemplate restTemplate = new RestTemplate();
        long start = System.currentTimeMillis();

        String dialect = request.dialect() != null ? request.dialect().name() : "MYSQL";
        String text = request.text() != null ? request.text() : "";

        // ✅ Build prompt
        String prompt;
        if (request.optimize()) {

            prompt =
                    "You are a SQL optimization engine.\n" +
                            "Return a STRICT JSON object with ALL of the following fields ALWAYS present:\n" +
                            "  optimized_sql: string\n" +
                            "  suggestions: array of strings (must be at least 2 suggestions)\n" +
                            "  indexes: array of strings (must be at least 1 index recommendation)\n" +
                            "  complexity: string (Big-O notation)\n" +
                            "  cost: string (Low/Medium/High)\n" +
                            "  explanation: string\n\n" +
                            "If the original SQL is already optimal, still provide suggestions and indexes.\n" +
                            "DO NOT OMIT ANY FIELD.\n\n" +
                            "SQL Query:\n" + text;

        } else {

            prompt = """
                Convert this natural language into SQL (%s).
                Return STRICT JSON ONLY:

                {
                  "sql": "...",
                  "explanation": "..."
                }

                Text:
                """.formatted(dialect) + text;
        }

        // ✅ Build Gemini request with strict JSON schema enforcement
        Map<String, Object> body = new HashMap<>();
        body.put("contents", List.of(
                Map.of("parts", List.of(
                        Map.of("text", prompt)
                ))
        ));

        // ✅ Force Gemini to output JSON
        body.put("generationConfig", Map.of(
                "responseMimeType", "application/json"
        ));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        ResponseEntity<Map> response =
                restTemplate.postForEntity(GEMINI_API_URL, entity, Map.class);

        String rawJson = "";

        try {
            var candidates = (List<Map<String, Object>>) response.getBody().get("candidates");
            var content = (Map<String, Object>) candidates.get(0).get("content");
            var parts = (List<Map<String, Object>>) content.get("parts");

            rawJson = parts.get(0).get("text").toString().trim();

        } catch (Exception e) {
            return new TranslateResponse(
                    "Gemini response error: " + e.getMessage(),
                    dialect,
                    "",
                    System.currentTimeMillis() - start,
                    null,
                    null,
                    null,
                    null,
                    null
            );
        }

        // ✅ Strip Markdown fences
        rawJson = rawJson.replace("```json", "").replace("```", "").trim();

        JsonNode root;

        try {
            root = mapper.readTree(rawJson);
        } catch (Exception e) {
            return new TranslateResponse(
                    "JSON Parse Error: " + e.getMessage() + "\nRAW: " + rawJson,
                    dialect,
                    "",
                    System.currentTimeMillis() - start,
                    null,
                    null,
                    null,
                    null,
                    null
            );
        }

        // ✅ Normal mode
        if (!request.optimize()) {
            return new TranslateResponse(
                    root.path("sql").asText(""),
                    dialect,
                    root.path("explanation").asText(""),
                    System.currentTimeMillis() - start,
                    null,
                    null,
                    null,
                    null,
                    null
            );
        }

        // ✅ Optimization mode (fixed list extraction)
        List<String> suggestions = new ArrayList<>();
        List<String> indexes = new ArrayList<>();

        if (root.has("suggestions") && root.get("suggestions").isArray()) {
            root.get("suggestions").forEach(node -> suggestions.add(node.asText()));
        }

        if (root.has("indexes") && root.get("indexes").isArray()) {
            root.get("indexes").forEach(node -> indexes.add(node.asText()));
        }

        return new TranslateResponse(
                root.path("sql").asText(null),
                dialect,
                root.path("explanation").asText(""),
                System.currentTimeMillis() - start,

                root.path("optimized_sql").asText(""),

                suggestions,
                indexes,
                root.path("complexity").asText("Unknown"),
                root.path("cost").asText("Unknown")
        );
    }
}
