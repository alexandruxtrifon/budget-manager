CREATE TABLE activity_logs (
    log_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_name TEXT,
    details JSONB -- Optional field for additional log data
);
CREATE INDEX idx_activity_logs_user_timestamp ON activity_logs(user_id, timestamp);
