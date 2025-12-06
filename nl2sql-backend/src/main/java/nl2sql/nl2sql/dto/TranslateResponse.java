package nl2sql.nl2sql.dto;

import java.util.List;

public record TranslateResponse(
        String sql,
        String dialect,
        String explanation,
        long latency,
        String optimizedSql,
        List<String> suggestions,
        List<String> indexes,
        String complexity,
        String cost
) {}
