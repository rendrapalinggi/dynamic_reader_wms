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
