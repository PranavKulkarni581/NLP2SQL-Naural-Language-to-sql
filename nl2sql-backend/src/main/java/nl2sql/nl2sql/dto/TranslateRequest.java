package nl2sql.nl2sql.dto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record TranslateRequest(
        @NotBlank @Size(max = 1000) String text,
        @NotNull Dialect dialect
) {}