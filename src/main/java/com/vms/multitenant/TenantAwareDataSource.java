package com.vms.multitenant;

import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.datasource.DelegatingDataSource;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import javax.sql.DataSource;

@Slf4j
public class TenantAwareDataSource extends DelegatingDataSource {

    public TenantAwareDataSource(DataSource targetDataSource) {
        super(targetDataSource);
    }

    @Override
    public Connection getConnection() throws SQLException {
        Connection conn = super.getConnection();
        applySearchPath(conn);
        logConnectionSchema(conn);
        return conn;
    }

    @Override
    public Connection getConnection(String username, String password) throws SQLException {
        Connection conn = super.getConnection(username, password);
        applySearchPath(conn);
        logConnectionSchema(conn);
        return conn;
    }

    private void applySearchPath(Connection conn) throws SQLException {
        String tenant = TenantContext.getCurrentTenant();
        if (tenant != null && !tenant.isBlank()) {
            try {
                conn.createStatement().execute("SET search_path TO \"" + tenant + "\", public");
            } catch (SQLException ex) {
                try { conn.close(); } catch (Exception ignore) {}
                throw ex;
            }
        }
    }

    private void logConnectionSchema(Connection conn) {
        try (Statement stmt = conn.createStatement(); ResultSet rs = stmt.executeQuery("SELECT current_schema()")) {
            if (rs.next()) {
                String schema = rs.getString(1);
                log.info("Opened DB connection current_schema={}", schema);
            }
        } catch (SQLException ex) {
            log.warn("Unable to read current_schema from DB connection", ex);
        }
    }
}
