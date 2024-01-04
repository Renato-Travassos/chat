const sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('users.db');

function data() { 

  let dataHoraAtual = new Date();

  dataHoraAtual.setUTCHours(dataHoraAtual.getUTCHours() - 3);
  let hora = dataHoraAtual.getHours();
  let minutos = dataHoraAtual.getMinutes();
  let segundos = dataHoraAtual.getSeconds();
  let dia = dataHoraAtual.getDate();
  let mes = dataHoraAtual.getMonth() + 1;
  let ano = dataHoraAtual.getFullYear();

  hora = hora < 10 ? '0' + hora : hora;
  minutos = minutos < 10 ? '0' + minutos : minutos;
  segundos = segundos < 10 ? '0' + segundos : segundos;
  dia = dia < 10 ? '0' + dia : dia;
  mes = mes < 10 ? '0' + mes : mes;

  let dataHoraBrasilia = `${ano}-${mes}-${dia} ${hora}:${minutos}:${segundos}`;

  return String(dataHoraBrasilia);
}

db.serialize(function () {
  db.run(`
    CREATE TABLE IF NOT EXISTS USERS (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome VARCHAR(255) NOT NULL,
      biografia VARCHAR(255),
      createdAt DATETIME NOT NULL,
      updatedAt DATETIME NOT NULL,
      senha VARCHAR(30) NOT NULL 
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS CHAT (
      id_user INTEGER PRIMARY KEY AUTOINCREMENT, 
      msg JSON, 
      FOREIGN KEY (id_user) REFERENCES USERS(id)
    )
  `);

  let users = db.prepare('INSERT INTO USERS (nome, createdAt, updatedAt, senha) VALUES (?, ?, ?, ?)');
  let chat = db.prepare('INSERT INTO CHAT (msg) VALUES (?)');

  users.run('renato', data(), data(), '12345', function (err) {
  
    chat.run('{"chat":[]}');

  });

  users.run('andressa', data(), data(), 'renato', function (err) {
  
    chat.run('{"chat":[]}');

  });
  users.run('gustav', data(), data(), 'bum', function (err) {
  
    chat.run('{"chat":[]}');

  });
  users.run('david', data(), data(), '12345', function (err) {
  
    chat.run('{"chat":[]}');
chat.finalize(); 
  });
    users.finalize();

});


    

/*

CREATE TABLE users (
    id_user INTEGER PRIMARY KEY,
    nome CHAR(120) 
);


CREATE TABLE chat (
    id_user int not null, 
    msg JSON,
    FOREIGN KEY (id_user) REFERENCES users(id_user)
);
CREATE TABLE IF NOT EXISTS chat (
     id INTEGER PRIMARY KEY,
    user_id INTEGER,
    message TEXT,
    timestamp DATETIME
 );



async function rodar() {
  db.get(` 
    SELECT true FROM USERS WHERE nome =  %'David'% AND senha = 12345
  `,(erro,rows)=>{
  if (erro) {
    console.log(erro)
  }else{
    console.log(rows )
  }
 })
 
}

rodar()
*/



