-- Votes
DROP TABLE IF EXISTS votes;
CREATE TABLE votes (
	user_id INTEGER NOT NULL,
	item_id INTEGER NOT NULL,
   	ordinal INTEGER NOT NULL,

	FOREIGN KEY(user_id) REFERENCES users(id)
	FOREIGN KEY(item_id) REFERENCES items(id)
);

DROP INDEX IF EXISTS no_duplicated_votes_unique_index;
CREATE UNIQUE INDEX no_duplicated_votes_unique_index ON votes (user_id, item_id);

DROP INDEX IF EXISTS ballot_index;
CREATE INDEX ballot_index ON votes (user_id ASC, ordinal ASC);


-- Items
DROP TABLE IF EXISTS items;
CREATE TABLE items (
	id INTEGER PRIMARY KEY,
   	title TEXT NOT NULL,
	body TEXT NOT NULL,
	done BOOLEAN NOT NULL DEFAULT 0
);

DROP INDEX IF EXISTS items_title_unique_index;
CREATE UNIQUE INDEX items_title_unique_index ON items(title);

DROP INDEX IF EXISTS items_body_unique_index;
CREATE UNIQUE INDEX items_body_unique_index ON items(body);

DROP INDEX IF EXISTS items_done_index;
CREATE INDEX items_done_index ON items (done);


-- Users
DROP TABLE IF EXISTS users;
CREATE TABLE users (
	id INTEGER PRIMARY KEY,
   	username TEXT NOT NULL
);

DROP INDEX IF EXISTS users_username_unique_index;
CREATE UNIQUE INDEX users_username_unique_index ON users(username);


-- Insert some test data

INSERT INTO users VALUES(1, "Alex 1");
INSERT INTO users VALUES(2, "Alex 2");
INSERT INTO users VALUES(3, "Alex 3");

INSERT INTO items VALUES(1, "Candidate A", "Vote for Candidate A", 0);
INSERT INTO items VALUES(2, "Candidate B", "Vote for Candidate B", 0);
INSERT INTO items VALUES(3, "Candidate C", "Vote for Candidate C", 0);
INSERT INTO items VALUES(4, "Candidate D", "Vote for Candidate D", 0);
INSERT INTO items VALUES(5, "Candidate E", "Vote for Candidate E", 0);
INSERT INTO items VALUES(6, "Candidate F", "Vote for Candidate F", 0);

INSERT INTO votes VALUES(1, 2, 1);
INSERT INTO votes VALUES(1, 4, 2);
INSERT INTO votes VALUES(1, 5, 3);
INSERT INTO votes VALUES(1, 1, 4);

INSERT INTO votes VALUES(2, 1, 1);
INSERT INTO votes VALUES(2, 2, 2);
INSERT INTO votes VALUES(2, 5, 3);

INSERT INTO votes VALUES(3, 1, 1);
INSERT INTO votes VALUES(3, 4, 2);
INSERT INTO votes VALUES(3, 2, 3);
INSERT INTO votes VALUES(3, 5, 4);
INSERT INTO votes VALUES(3, 3, 5);


