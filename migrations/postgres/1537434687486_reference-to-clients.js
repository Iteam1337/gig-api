exports.up = async pgm => {
  pgm.sql(`
    ALTER TABLE jobs
      DROP COLUMN source,
      ADD COLUMN client uuid,
      ADD CONSTRAINT client_id
        FOREIGN KEY (client)
        REFERENCES allowed_clients (id);

    UPDATE jobs
      SET client = c.id
      FROM jobs AS j
        LEFT JOIN allowed_clients AS c
          ON j.link ~ c.name;
  `)
}

exports.down = async pgm => {
  pgm.sql(`
    ALTER TABLE jobs
      DROP CONSTRAINT client_id,
      DROP COLUMN client,
      ADD COLUMN source text;

    UPDATE jobs
      SET source = c.name
      FROM jobs AS j
        LEFT JOIN allowed_clients AS c
          ON j.link ~ c.name;
  `)
}
