SELECT id, username, email, role FROM "Users";
UPDATE "Users" SET role='admin' WHERE email='julientraineau17@gmail.com';
SELECT id, username, email, role FROM "Users";