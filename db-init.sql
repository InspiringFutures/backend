CREATE TABLE "Groups" (id serial PRIMARY KEY,
	code CHARACTER VARYING UNIQUE NOT NULL,
	name CHARACTER VARYING NOT NULL,
	"apiUrl" CHARACTER VARYING,
	"createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
	"updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO "Groups" (code, name, "apiUrl") VALUES ('TEST', 'Robin''s Test Group', NULL);

CREATE TABLE "Clients" (id serial PRIMARY KEY,
	"nickName" CHARACTER VARYING UNIQUE NOT NULL,
	token CHARACTER VARYING NOT NULL,
    "groupId" integer NOT NULL,
    FOREIGN KEY ("groupId") REFERENCES "Groups" (id),
	"createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
	"updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TYPE ADMIN_LEVEL AS ENUM ('normal', 'super');

CREATE TABLE "Admins" (id serial PRIMARY KEY,
	"name" CHARACTER VARYING NULL,
	"email" CHARACTER VARYING NOT NULL,
	"level" ADMIN_LEVEL NOT NULL DEFAULT 'normal',
	"createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
	"updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
	"lastLoginAt" TIMESTAMP NULL
);

INSERT INTO "Admins" ("email", "level") VALUES ('rhm31@cam.ac.uk', 'super');
