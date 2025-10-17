package nl2sql.nl2sql.service;

import nl2sql.nl2sql.dto.ExecuteRequest;
import nl2sql.nl2sql.dto.ExecuteResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.sql.*;
import java.util.*;

@Service
public class ExecuteService {

    @Autowired
    private DatabaseService dbConnectionService;

    // ✅ Executes SQL on the user’s DB
    public ExecuteResponse executeQuery(ExecuteRequest req) {
        List<Map<String, Object>> rows = new ArrayList<>();
        boolean success = false;
        String message = "";

        try (Connection conn = dbConnectionService.getConnection(
                req.host(),
                req.port(),
                req.database(),
                req.username(),
                req.password());
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(req.sql())) {

            ResultSetMetaData meta = rs.getMetaData();
            int colCount = meta.getColumnCount();

            while (rs.next()) {
                Map<String, Object> row = new LinkedHashMap<>();
                for (int i = 1; i <= colCount; i++) {
                    row.put(meta.getColumnLabel(i), rs.getObject(i));
                }
                rows.add(row);
            }

            success = true;
        } catch (SQLException e) {
            message = e.getMessage();
        }

        return new ExecuteResponse(success, message, rows);
    }
}
