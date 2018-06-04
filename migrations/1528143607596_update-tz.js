exports.up = pgm => {
  pgm.sql(`
    SET timezone = 'Europe/Stockholm';
    ALTER TABLE jobs
      ALTER COLUMN listed_date SET DATA TYPE timestamptz,
      ALTER COLUMN created_at SET DATA TYPE timestamptz,
      ALTER COLUMN start_date SET DATA TYPE timestamptz,
      ALTER COLUMN end_date SET DATA TYPE timestamptz;
  `)
}

exports.down = pgm => {
  pgm.sql(`
    SET timezone = 'UTC';
    ALTER TABLE jobs
      ALTER COLUMN listed_date SET DATA TYPE timestamp,
      ALTER COLUMN created_at SET DATA TYPE timestamp,
      ALTER COLUMN start_date SET DATA TYPE timestamp,
      ALTER COLUMN end_date SET DATA TYPE timestamp;
  `)
}
