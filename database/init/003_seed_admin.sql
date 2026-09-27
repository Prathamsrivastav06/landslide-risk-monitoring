-- Password: Admin@1234 (bcrypt hash, rounds=12)
INSERT INTO users (email, password_hash, full_name, role) VALUES
('admin@landslide-sys.gov.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TdxdHgmzH1X4c6p.nJNg9X4GI3Pu', 'System Administrator', 'ADMIN'),
('authority@landslide-sys.gov.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TdxdHgmzH1X4c6p.nJNg9X4GI3Pu', 'NDMA Authority', 'AUTHORITY'),
('officer@landslide-sys.gov.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TdxdHgmzH1X4c6p.nJNg9X4GI3Pu', 'Field Officer', 'FIELD_OFFICER');
