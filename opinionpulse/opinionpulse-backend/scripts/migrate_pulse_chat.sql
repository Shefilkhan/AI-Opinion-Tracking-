-- Pulse AI chat message history (correct schema)
DROP TABLE IF EXISTS chat_messages;

CREATE TABLE chat_messages (
    id VARCHAR(36) PRIMARY KEY,
    user_id INT NOT NULL,
    conversation_id VARCHAR(64) NOT NULL,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    metadata_json JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_conv (user_id, conversation_id),
    INDEX idx_user_id (user_id),
    INDEX idx_conversation_id (conversation_id),
    INDEX idx_created (created_at),
    CONSTRAINT fk_chat_messages_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
