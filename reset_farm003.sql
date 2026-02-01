DELETE FROM users WHERE user_id='FARM003';
INSERT INTO users (user_id, name, email, password, user_type, phone, address) 
VALUES ('FARM003', 'Ambesh Singh', 'ambesh@farmer.com', '$2b$10$huNqws0yDKmE2Mk5SuMzHe8JRyH3YL5yb9nxO6cXhI.LAkE2x.JGS', 'farmer', '9876543213', 'Farm Area');
SELECT user_id, password FROM users WHERE user_id='FARM003';
