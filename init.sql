-- Limitly Database Initialization
-- Developer: Santhosh Aaron C (3122245002093)

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE otp_verifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(150) NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,
    purpose VARCHAR(50) NOT NULL,
    expiry_time TIMESTAMP NOT NULL,
    used_flag BOOLEAN DEFAULT FALSE
);

CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE
);

CREATE TABLE expenses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    amount DECIMAL(12, 2) NOT NULL,
    description VARCHAR(255),
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE expense_limits (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    -- If category_id is NULL, it acts as the Global Monthly Limit
    category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    limit_amount DECIMAL(12, 2) NOT NULL,
    alert_threshold INTEGER DEFAULT 80, -- e.g., alert at 80%
    month INTEGER NOT NULL,
    year INTEGER NOT NULL
);

CREATE TABLE recurring_payments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    frequency VARCHAR(20) NOT NULL, -- Daily, Weekly, Monthly, Yearly
    next_payment_date DATE NOT NULL
);

-- Seed Default Categories (user_id is NULL to indicate these are global defaults)
INSERT INTO categories (name, is_default) VALUES
('Food', TRUE),
('Transport', TRUE),
('Shopping', TRUE),
('Entertainment', TRUE),
('Health', TRUE),
('Education', TRUE),
('Travel', TRUE),
('Utilities', TRUE),
('Others', TRUE);