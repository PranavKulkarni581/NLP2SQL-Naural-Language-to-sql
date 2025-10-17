package nl2sql.nl2sql.service;

import nl2sql.nl2sql.dto.Dialect;
import nl2sql.nl2sql.dto.TranslateRequest;
import nl2sql.nl2sql.dto.TranslateResponse;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.util.HashMap;
import java.util.Map;
import java.util.List;

@Service
public class TranslateService {

    private static final String GEMINI_API_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyBIxjSGVjcS5BX2LAM-pxQHuc0SW-jTLaU";

    public TranslateResponse translate(TranslateRequest request) {
        RestTemplate restTemplate = new RestTemplate();
        long start = System.currentTimeMillis();

        // 🔹 Instruction for Gemini: SQL only + short explanation
        Dialect dialect = request.dialect();
        String dialectName = (dialect != null) ? dialect.name() : "MYSQL";

        String text = request.text() != null ? request.text() : "";

        String prompt = String.format(
                "Convert the following natural language into a SQL query for dialect %s.\nReturn output strictly in JSON with two fields: `sql` (SQL query only, no comments, no markdown) and `explanation` (near about 70 to 80 words).\n\nText: %s",
                dialectName,
                text
        );


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

        // Extract response safely
        String sqlQuery = "";
        String explanation = "";
        try {
            var candidates = (List<Map<String, Object>>) response.getBody().get("candidates");
            if (candidates != null && !candidates.isEmpty()) {
                var content = (Map<String, Object>) candidates.get(0).get("content");
                var parts = (List<Map<String, Object>>) content.get("parts");
                String rawText = parts.get(0).get("text").toString();

                // Try to parse Gemini response as JSON
                if (rawText.contains("{") && rawText.contains("}")) {
                    rawText = rawText.trim();
                    rawText = rawText.replace("```json", "").replace("```", "").trim();

                    // Very simple parsing (since Gemini outputs JSON-like text)
                    if (rawText.contains("\"sql\"")) {
                        int sqlStart = rawText.indexOf("\"sql\"");
                        int expStart = rawText.indexOf("\"explanation\"");
                        sqlQuery = rawText.substring(sqlStart, expStart).replaceAll(".*:|\"|,", "").trim();
                        explanation = rawText.substring(expStart).replaceAll(".*:|\"|}", "").trim();
                    } else {
                        sqlQuery = rawText;
                    }
                } else {
                    sqlQuery = rawText;
                }
            }
        } catch (Exception e) {
            sqlQuery = "Error parsing Gemini response: " + e.getMessage();
        }

        long latency = System.currentTimeMillis() - start;

        return new TranslateResponse(
                sqlQuery,
                request.dialect().name(),
                explanation,
                latency,
                null
        );
    }
}
