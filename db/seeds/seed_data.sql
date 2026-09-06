-- Seed sample vendors, products and an order (run after migration)

INSERT INTO vendors (id, name, contact) VALUES
('7e1f8f6e-1111-4e9a-9f1a-000000000001', 'Al-Madina Traders', '0300-1234567'),
('7e1f8f6e-2222-4e9a-9f1a-000000000002', 'Lahore Bazaar', '0321-9876543');

INSERT INTO products (id, name, description, image, price, stock, category, vendor_id, active) VALUES
('p-earbuds', 'Earbuds', 'Wireless earbuds with mic', '/assets/p-earbuds-BzdNkyoE.jpg', 2499, 25, 'Electronics', '7e1f8f6e-1111-4e9a-9f1a-000000000001', true),
('p-watch', 'Smart Watch', 'Fitness watch with heart-rate', '/assets/p-watch-C9W1B34S.jpg', 4999, 12, 'Wearables', '7e1f8f6e-2222-4e9a-9f1a-000000000002', true);

INSERT INTO orders (id, customer_name, phone, city, total, status, items, vendor_id) VALUES
('DKN-10001', 'Ahmed Raza', '0300-1234567', 'Karachi', 7498, 'Pending', '[{"productId":"p-earbuds","qty":1},{"productId":"p-watch","qty":1}]', '7e1f8f6e-1111-4e9a-9f1a-000000000001');
