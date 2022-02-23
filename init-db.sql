BEGIN TRANSACTION;

-- Table: alembic_version
CREATE TABLE alembic_version
(
    version_num VARCHAR(32) NOT NULL,
    CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
);


-- Table: slides
CREATE TABLE slides
(
    id              VARCHAR(36) PRIMARY KEY,
    name            TEXT,
    file            TEXT,
    properties_json TEXT
);


-- Table: projects
CREATE TABLE projects
(
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(60),
    description VARCHAR(120),
    folder      TEXT
);

-- Table: label
CREATE TABLE label
(
    id          SERIAL PRIMARY KEY,
    project_id  INTEGER,
    name        VARCHAR(60),
    label_color VARCHAR(12),
    FOREIGN KEY (project_id) REFERENCES projects (id)
);


-- Table: users
CREATE TABLE users
(
    id               SERIAL NOT NULL,
    name             VARCHAR(80),
    email            TEXT,
    username         VARCHAR(30),
    password_hash    VARCHAR(128),
    is_admin         BOOLEAN,
    manages_apps     BOOLEAN,
    manages_users    BOOLEAN,
    manages_tasks    BOOLEAN,
    manages_projects BOOLEAN,
    can_export       BOOLEAN,
    access_overview  BOOLEAN,
    is_bot           BOOLEAN,
    PRIMARY KEY (id),
    UNIQUE (username)
);


-- Table: annotation_tasks
CREATE TABLE annotation_tasks
(
    id         SERIAL PRIMARY KEY,
    project_id INTEGER,
    name       VARCHAR(60),
    created    TIMESTAMP DEFAULT (CURRENT_TIMESTAMP),
    updated    TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects (id)
);


-- Table: revision_tasks
CREATE TABLE revision_tasks
(
    id         SERIAL PRIMARY KEY,
    name       TEXT,
    created    TIMESTAMP DEFAULT (CURRENT_TIMESTAMP),
    updated    TIMESTAMP,
    task_id    INTEGER,
    project_id INTEGER,
    FOREIGN KEY (project_id) REFERENCES projects (id),
    FOREIGN KEY (task_id) REFERENCES annotation_tasks (id)
);


-- Table: task_slides
CREATE TABLE task_slides
(
    id       SERIAL PRIMARY KEY,
    task_id  INTEGER,
    slide_id VARCHAR(36),
    FOREIGN KEY (slide_id) REFERENCES slides (id),
    FOREIGN KEY (task_id) REFERENCES annotation_tasks (id)
);

-- Table: user_tasks
CREATE TABLE user_tasks
(
    id                 TEXT NOT NULL,
    annotation_task_id INTEGER,
    revision_task_id   INTEGER,
    user_id            INTEGER,
    type               INTEGER,
    completed          BOOLEAN,
    locked             BOOLEAN,
    created            TIMESTAMP DEFAULT (CURRENT_TIMESTAMP),
    updated            TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (annotation_task_id) REFERENCES annotation_tasks (id),
    FOREIGN KEY (revision_task_id) REFERENCES revision_tasks (id),
    FOREIGN KEY (user_id) REFERENCES users (id)
);


-- Table: revision_task_items
CREATE TABLE revision_task_items
(
    id           SERIAL PRIMARY KEY,
    task_id      INTEGER,
    user_task_id TEXT,
    FOREIGN KEY (task_id) REFERENCES revision_tasks (id),
    FOREIGN KEY (user_task_id) REFERENCES user_tasks (id)
);

-- Table: annotations
CREATE TABLE annotations
(
    id              SERIAL PRIMARY KEY,
    user_task_id    VARCHAR(36),
    slide_id        VARCHAR(36),
    label_id        INTEGER,
    title           TEXT,
    description     TEXT,
    properties_json TEXT,
    created         TIMESTAMP DEFAULT (CURRENT_TIMESTAMP),
    updated         TIMESTAMP,
    data_json       TEXT,
    FOREIGN KEY (label_id) REFERENCES label (id),
    FOREIGN KEY (slide_id) REFERENCES slides (id),
    FOREIGN KEY (user_task_id) REFERENCES user_tasks (id)
);

-- Table: annotations_revised
CREATE TABLE annotations_revised
(
    id            SERIAL PRIMARY KEY,
    user_task_id  VARCHAR(36),
    annotation_id INTEGER,
    feedback      INTEGER,
    label_id      INTEGER,
    data_json     TEXT,
    created       TIMESTAMP DEFAULT (CURRENT_TIMESTAMP),
    updated       TIMESTAMP,
    FOREIGN KEY (annotation_id) REFERENCES annotations (id) ON DELETE CASCADE,
    FOREIGN KEY (label_id) REFERENCES label (id),
    FOREIGN KEY (user_task_id) REFERENCES user_tasks (id) ON DELETE CASCADE
);

INSERT INTO users(name, username, password_hash, manages_apps, manages_users, manages_tasks, manages_projects,
                  can_export, access_overview, is_bot)
VALUES ('Admin', 'admin', 'pbkdf2:sha256:150000$J8VTcCCy$579af21f8e7c8139729a226520580a4260db5577f8ea9be9bedaf5c518b8e94b', TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, FALSE);

COMMIT TRANSACTION;
