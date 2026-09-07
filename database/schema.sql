CREATE TABLE IF NOT EXISTS wms_layers (
    id BIGSERIAL PRIMARY KEY,
    geoserver_url VARCHAR(500) NOT NULL,
    workspace VARCHAR(255) NOT NULL,
    layer_name VARCHAR(255) NOT NULL,
    qualified_layer_name VARCHAR(255) NOT NULL,
    wms_url VARCHAR(500) NOT NULL,
    title VARCHAR(255),
    abstract TEXT,
    crs VARCHAR(100),
    visible BOOLEAN NOT NULL DEFAULT TRUE,
    status VARCHAR(100) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wms_layers_qualified_name ON wms_layers (qualified_layer_name);
CREATE INDEX IF NOT EXISTS idx_wms_layers_visible ON wms_layers (visible);

CREATE TABLE IF NOT EXISTS wms_monitoring (
    id BIGSERIAL PRIMARY KEY,
    wms_id BIGINT NOT NULL,
    wms_name VARCHAR(255) NOT NULL,
    geoserver_url VARCHAR(500) NOT NULL,
    workspace VARCHAR(255) NOT NULL,
    wms_url VARCHAR(500) NOT NULL UNIQUE,
    status VARCHAR(30) NOT NULL,
    response_time_ms BIGINT NOT NULL,
    http_status INTEGER,
    wms_version VARCHAR(30),
    layer_count INTEGER,
    checked_at TIMESTAMP NOT NULL,
    error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_wms_monitoring_status ON wms_monitoring (status);
CREATE INDEX IF NOT EXISTS idx_wms_monitoring_checked_at ON wms_monitoring (checked_at);
