ALTER TABLE folders ADD COLUMN slug VARCHAR(255) NULL;

UPDATE folders SET slug = LOWER(REPLACE(REPLACE(name, ' ', '-'), '!', ''));

ALTER TABLE folders MODIFY COLUMN slug VARCHAR(255) NOT NULL;
ALTER TABLE folders ADD CONSTRAINT uk_user_slug UNIQUE (user_id, slug);
