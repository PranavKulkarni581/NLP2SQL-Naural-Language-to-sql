package nl2sql.nl2sql.dto;
public record TranslateResponse(
        String sql,
        String dialect,
        String model,
        long latencyMs,
        String warning
) {}