CREATE table "Groups" (id serial primary key,
	code character varying unique not null,
	name character varying not null,
	"apiUrl" character varying,
	"createdAt" timestamp not null default now(),
	"updatedAt" timestamp not null default now()
);

create table "Clients" (id serial primary key,
	"nickName" character varying unique not null,
	token character varying not null,
    "groupId" integer not null,
    foreign key ("groupId") references "Groups" (id),
	"createdAt" timestamp not null default now(),
	"updatedAt" timestamp not null default now()
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

create type "GROUP_ACCESS_LEVEL" as enum ('view', 'edit', 'owner');

create table "GroupPermission" (id serial primary key,
    "groupId" integer not null,
    foreign key ("groupId") references "Groups" (id),
    "adminId" integer not null,
    foreign key ("adminId") references "Admins" (id),
	"level" "GROUP_ACCESS_LEVEL" not null default 'view',
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
    "journalId" integer not null,
    foreign key ("journalId") references "Journals" (id),
	"createdAt" timestamp not null default now(),
	"updatedAt" timestamp not null default now()
);
