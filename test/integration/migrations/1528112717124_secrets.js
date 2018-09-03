
const { sites } = require('../config')

console.log({ sites })

exports.up = pgm => {
  pgm.sql(`
    DELETE FROM allowed_clients;
    INSERT INTO allowed_clients (id, secret, name) VALUES
      ${// it's not insecure, it's a testscript!
        Object
          .values(sites)
          .map(({ id, secret, name }) => `('${id}', '${secret}', '${name}')`)
          .join(',\n      ')};
  `)
}

exports.down = () => {}
