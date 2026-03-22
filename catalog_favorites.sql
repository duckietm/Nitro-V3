CREATE TABLE IF NOT EXISTS catalog_favorites (
    user_id INT NOT NULL,
    type ENUM('offer', 'page') NOT NULL,
    target_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, type, target_id)
);
