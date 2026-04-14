-- sqlite3 database.db < schema.sql
-- .tables
-- insert into messages (id, email, emailfrom, msg) values (1, "lo@gmail.com", "aa@gmail.com", "hejhej hallå"),(2, "lo@gmail.com", "aa@gmail.com", "hejhettt");

DROP TABLE IF EXISTS user;
DROP TABLE IF EXISTS tokens;
DROP TABLE IF EXISTS messages;

CREATE TABLE IF NOT EXISTS user
(
    email TEXT PRIMARY KEY UNIQUE NOT NULL,
    password TEXT NOT NULL,
    firstname TEXT NOT NULL,
    familyname TEXT NOT NULL,
    gender TEXT NOT NULL,
    city TEXT NOT NULL,
    country TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tokens
(
    email TEXT PRIMARY KEY UNIQUE NOT NULL,
    token TEXT NOT NULL,
    FOREIGN KEY (email) REFERENCES user(email)
);

CREATE TABLE IF NOT EXISTS messages
(   
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    emailfrom TEXT NOT NULL,
    msg TEXT NOT NULL,
    FOREIGN KEY (email) REFERENCES user(email)
);

--insert into messages (id, email, emailfrom, msg) values (1, "lo@gmail.com", "aa@gmail.com", "hejhej hallå");