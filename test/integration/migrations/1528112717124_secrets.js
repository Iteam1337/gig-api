exports.up = pgm => {
  pgm.sql(`
    INSERT INTO allowed_clients (id, secret, name) VALUES
      ('85d5cfcb-37bd-4a54-9410-2aa1cc52ea6d', 'b59dc3e3-ddd1-4a8f-bae9-a01cd48ef386', 'gigstr'),
      ('7d43eecd-515a-4b79-b446-862756848137', '23cb4e12-444a-463b-b218-c1fd1ff5d260', 'justarrived'),
      ('62b1cf9b-65dc-4f0a-bb82-e8edbc9b3ba6', 'b320b8dd-e0be-42cb-a158-48a54d7d30bd', 'taskrunner');
  `)
}

exports.down = () => {}
