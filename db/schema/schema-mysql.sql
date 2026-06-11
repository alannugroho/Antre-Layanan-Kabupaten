-- MySQL schema for Sistem Manajemen Antrean

CREATE DATABASE IF NOT EXISTS antrian_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE antrian_db;

-- Enum-like tables (MySQL doesn't have native enums in the same way)
CREATE TABLE IF NOT EXISTS user_roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  role_name VARCHAR(20) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS ticket_statuses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  status_name VARCHAR(20) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS queue_event_types (
  id INT PRIMARY KEY AUTO_INCREMENT,
  event_type_name VARCHAR(20) UNIQUE NOT NULL
);

-- Insert enum values
INSERT IGNORE INTO user_roles (role_name) VALUES ('admin'), ('staff');
INSERT IGNORE INTO ticket_statuses (status_name) VALUES ('waiting'), ('called'), ('skipped'), ('completed'), ('canceled');
INSERT IGNORE INTO queue_event_types (event_type_name) VALUES ('created'), ('called'), ('recalled'), ('skipped'), ('completed'), ('canceled');

-- Main tables
CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  nip VARCHAR(50) UNIQUE NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE,
  password_hash TEXT NOT NULL,
  role ENUM('admin', 'staff') NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS service_categories (
  id CHAR(36) PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  estimated_minutes INT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS counters (
  id CHAR(36) PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(120) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS counter_services (
  counter_id CHAR(36) NOT NULL,
  service_category_id CHAR(36) NOT NULL,
  PRIMARY KEY (counter_id, service_category_id),
  FOREIGN KEY (counter_id) REFERENCES counters(id),
  FOREIGN KEY (service_category_id) REFERENCES service_categories(id)
);

CREATE TABLE IF NOT EXISTS tickets (
  id CHAR(36) PRIMARY KEY,
  ticket_number VARCHAR(30) UNIQUE NOT NULL,
  service_category_id CHAR(36) NOT NULL,
  citizen_nik VARCHAR(30),
  status ENUM('waiting', 'called', 'skipped', 'completed', 'canceled') NOT NULL DEFAULT 'waiting',
  assigned_counter_id CHAR(36),
  called_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (service_category_id) REFERENCES service_categories(id),
  FOREIGN KEY (assigned_counter_id) REFERENCES counters(id)
);

CREATE TABLE IF NOT EXISTS queue_events (
  id CHAR(36) PRIMARY KEY,
  ticket_id CHAR(36) NOT NULL,
  event_type ENUM('created', 'called', 'recalled', 'skipped', 'completed', 'canceled') NOT NULL,
  actor_user_id CHAR(36),
  actor_counter_id CHAR(36),
  note TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id),
  FOREIGN KEY (actor_user_id) REFERENCES users(id),
  FOREIGN KEY (actor_counter_id) REFERENCES counters(id)
);

-- Create indexes for better query performance
CREATE INDEX idx_users_nip ON users(nip);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_service ON tickets(service_category_id);
CREATE INDEX idx_tickets_counter ON tickets(assigned_counter_id);
CREATE INDEX idx_queue_events_ticket ON queue_events(ticket_id);
