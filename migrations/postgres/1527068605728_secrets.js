exports.up = pgm => {
  pgm.sql(`
    INSERT INTO allowed_clients (id, secret, name) VALUES
      ('9a649e74-5e97-4f92-b28e-a3da7910942e', 'b59dc3e3-ddd1-4a8f-bae9-a01cd48ef386', 'gigstr'),
      ('9f6d3d08-3903-4499-9626-25c9a49ea8c3', '23cb4e12-444a-463b-b218-c1fd1ff5d260', 'justarrived'),
      ('24266c8b-21c7-4bf2-89a3-8ba6318d6ce9', 'b320b8dd-e0be-42cb-a158-48a54d7d30bd', 'taskrunner');
  `)
}

exports.down = pgm => {
  pgm.sql(`
    DELETE FROM allowed_clients WHERE id = '9a649e74-5e97-4f92-b28e-a3da7910942e';
    DELETE FROM allowed_clients WHERE id = '9f6d3d08-3903-4499-9626-25c9a49ea8c3';
    DELETE FROM allowed_clients WHERE id = '24266c8b-21c7-4bf2-89a3-8ba6318d6ce9';
  `)
}
