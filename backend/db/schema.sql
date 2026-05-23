CREATE TABLE IF NOT EXISTS admins (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(64) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS products (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  sku VARCHAR(80) NOT NULL UNIQUE,
  description VARCHAR(500) NOT NULL DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS redbag_strategies (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  type ENUM('fixed','random','probability') NOT NULL,
  win_rate DECIMAL(5,2) NOT NULL DEFAULT 100.00,
  fixed_amount_cents INT UNSIGNED NULL,
  min_amount_cents INT UNSIGNED NULL,
  max_amount_cents INT UNSIGNED NULL,
  probability_rules JSON NULL,
  status ENUM('enabled','disabled') NOT NULL DEFAULT 'enabled',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS qr_batches (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  batch_no VARCHAR(80) NOT NULL UNIQUE,
  product_id BIGINT UNSIGNED NOT NULL,
  strategy_id BIGINT UNSIGNED NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  factory_name VARCHAR(120) NOT NULL DEFAULT '',
  remark VARCHAR(500) NOT NULL DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_batches_product FOREIGN KEY (product_id) REFERENCES products(id),
  CONSTRAINT fk_batches_strategy FOREIGN KEY (strategy_id) REFERENCES redbag_strategies(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS qr_codes (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  batch_id BIGINT UNSIGNED NOT NULL,
  serial_no VARCHAR(120) NOT NULL UNIQUE,
  token_hash CHAR(64) NOT NULL UNIQUE,
  encrypted_payload TEXT NOT NULL,
  image_path VARCHAR(500) NOT NULL,
  status ENUM('unused','used','disabled') NOT NULL DEFAULT 'unused',
  openid VARCHAR(80) NULL,
  used_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_qr_batch (batch_id),
  INDEX idx_qr_status (status),
  CONSTRAINT fk_codes_batch FOREIGN KEY (batch_id) REFERENCES qr_batches(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS redbag_records (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  qr_code_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  strategy_id BIGINT UNSIGNED NOT NULL,
  openid VARCHAR(80) NULL,
  nickname VARCHAR(80) NULL,
  out_trade_no VARCHAR(64) NOT NULL UNIQUE,
  amount_cents INT UNSIGNED NOT NULL,
  status ENUM('pending','processing','paid','failed') NOT NULL DEFAULT 'pending',
  provider_payment_no VARCHAR(128) NULL,
  provider_response JSON NULL,
  paid_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_records_openid (openid),
  INDEX idx_records_status (status),
  CONSTRAINT fk_records_qr FOREIGN KEY (qr_code_id) REFERENCES qr_codes(id),
  CONSTRAINT fk_records_product FOREIGN KEY (product_id) REFERENCES products(id),
  CONSTRAINT fk_records_strategy FOREIGN KEY (strategy_id) REFERENCES redbag_strategies(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
