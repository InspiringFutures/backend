CREATE table "Groups" (id serial primary key,
	code character varying unique not null,
	name character varying not null,
	"apiURL" character varying,
	"createdAt" timestamp not null default now(),
	"updatedAt" timestamp not null default now()
);

create type "CLIENT_STATUS" as enum ('added', 'registered', 'suspended', 'deleted');

create table "Clients" (id serial primary key,
	"participantID" character varying not null,
	token character varying unique null,
    "groupId" integer not null,
    foreign key ("groupId") references "Groups" (id),
    "status" "CLIENT_STATUS" not null default 'added',
	"createdAt" timestamp not null default now(),
	"updatedAt" timestamp not null default now(),
	unique ("groupId", "participantID")
);

create type "ADMIN_LEVEL" as enum ('normal', 'super');

create table "Admins" (id serial primary key,
	"name" character varying null,
	"email" character varying not null,
	"level" "ADMIN_LEVEL" not null default 'normal',
	"createdAt" timestamp not null default now(),
	"updatedAt" timestamp not null default now(),
	"lastLoginAt" timestamp null
);

create type "ACCESS_LEVEL" as enum ('view', 'edit', 'owner');

create table "GroupPermissions" (id serial primary key,
    "groupId" integer not null,
    foreign key ("groupId") references "Groups" (id),
    "adminId" integer not null,
    foreign key ("adminId") references "Admins" (id),
	"level" "ACCESS_LEVEL" not null default 'view',
	"createdAt" timestamp not null default now(),
	"updatedAt" timestamp not null default now()
);

create type "JOURNAL_TYPE" as enum ('text', 'audio', 'media');

create table "Journals" (id serial primary key,
    "type" "JOURNAL_TYPE" not null,
    "text" character varying null,
    "clientJournalId" character varying not null,
    "clientId" integer not null,
    foreign key ("clientId") references "Clients" (id),
	"createdAt" timestamp not null default now(),
	"updatedAt" timestamp not null default now()
);

create type "ENTRY_TYPE" as enum ('audio', 'photo', 'video');

create table "JournalEntries" (id serial primary key,
    "type" "ENTRY_TYPE" not null,
    "clientEntryId" character varying not null,
    "storageUrl" character varying null,
    "sequence" integer not null,
    "journalId" integer not null,
    foreign key ("journalId") references "Journals" (id),
	"createdAt" timestamp not null default now(),
	"updatedAt" timestamp not null default now()
);

create type "TOKEN_TYPE" as enum ('reset');

create table "Tokens" (id serial primary key,
    "type" "TOKEN_TYPE" not null,
    "code" character varying unique not null,
    "for" character varying not null,
	"createdAt" timestamp not null default now(),
	"updatedAt" timestamp not null default now(),
	"expiresAt" timestamp not null
);

create table "Surveys" (id serial primary key,
	name character varying not null,
    content json not null default '{"content": []}', -- Latest version has its content put in here.
    "updaterId" integer not null,
    foreign key ("updaterId") references "Admins" (id),
	"createdAt" timestamp not null default now(),
	"updatedAt" timestamp not null default now()
);

create table "SurveyPermissions" (id serial primary key,
    "surveyId" integer not null,
    foreign key ("surveyId") references "Surveys" (id),
    "adminId" integer not null,
    foreign key ("adminId") references "Admins" (id),
	"level" "ACCESS_LEVEL" not null default 'view',
	"createdAt" timestamp not null default now(),
	"updatedAt" timestamp not null default now()
);

create table "SurveyVersions" (id serial primary key,
    "content" json not null,
    "autoSave" boolean not null default TRUE,
    "surveyId" integer not null,
    foreign key ("surveyId") references "Surveys" (id),
    "creatorId" integer not null,
    foreign key ("creatorId") references "Admins" (id),
	"createdAt" timestamp not null default now(),
	"updatedAt" timestamp not null default now()
);

create type "ALLOCATION_TYPE" as enum ('oneoff', 'initial');

create table "SurveyAllocations" (id serial primary key,
    "type" "ALLOCATION_TYPE" not null,
	note character varying null,
	"openAt"  timestamp null,
	"closeAt"  timestamp null,
    "surveyId" integer not null,
    foreign key ("surveyId") references "Surveys" (id),
    "groupId" integer not null,
    foreign key ("groupId") references "Groups" (id),
    "creatorId" integer not null,
    foreign key ("creatorId") references "Admins" (id),
	"createdAt" timestamp not null default now(),
	"updatedAt" timestamp not null default now()
);

CREATE INDEX ON "SurveyAllocations" ("groupId", "type");
CREATE UNIQUE INDEX ON "SurveyAllocations" ("groupId") WHERE "type" = 'initial';

CREATE TABLE "Answers" (
    id serial primary key,
    "clientId" integer not null,
    foreign key ("clientId") references "Clients" (id),
    "surveyAllocationId" integer not null,
    foreign key ("surveyAllocationId") references "SurveyAllocations" (id),
    answer json DEFAULT '{"complete": false, "answers": {}}'::json NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX ON "Answers" ("clientId", "surveyAllocationId");

CREATE UNIQUE INDEX ON "Journals" ("clientId", "clientJournalId");

ALTER TABLE "Journals" ADD COLUMN "answerId" INTEGER NULL;
ALTER TABLE "Journals"
    ADD CONSTRAINT "Journals_answerId_fkey"  FOREIGN KEY ("answerId") REFERENCES public."Answers"(id);

ALTER TABLE "Journals" ADD COLUMN "hidden" BOOLEAN NOT NULL DEFAULT 'f';

ALTER TABLE "Clients" ADD COLUMN "pushToken" character varying null;

ALTER TABLE "SurveyAllocations" ADD COLUMN "pushedAt" timestamp null;
