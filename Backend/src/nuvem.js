const http = require("http");
const server = http.createServer();
const { WebSocketServer, WebSocket } = require("ws");
const sqlite3 = require("sqlite3");
const wss = new WebSocketServer({ server });
const db = sqlite3.verbose().Database;
const banconuvem = new db("./src/DataBase/BancoNuvem.db");

//Conexao da nuvem
wss.on("connection", (socket, request) => {
  socket.on("message", async (e) => {
    const menssagem = e.toString();
    const objeto = JSON.parse(menssagem);
    const sql = `
        INSERT INTO tabela(messagem,data,latitude,longitude) VALUES (?,?,?,?)`;
    await new Promise((resolve, reject) => {
      banconuvem.run(
        sql,
        [objeto.menssagem, objeto.horario, objeto.latitude, objeto.longitude],
        (erro) => {
          if (erro) reject(erro);
          else resolve();
        }
      );
    });
  });
});
//criando tabela
server.on("listening", async () => {
  await new Promise((resolve, reject) => {
    banconuvem.exec(
      `
        CREATE TABLE IF NOT EXISTS tabela(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            messagem VARCHAR NOT NULL,
            data INT NOT NULL,
            latitude VARCHAR NOT NULL,
            longitude VARCHAR NOT NULL
        )
        `,
      (erro) => {
        if (erro) reject(erro);
        else {
          console.log("table created");
          resolve();
        }
      }
    );
  });
});
//esta criando uma conexao websocket para enviar a mensagem para o backend
const backend = new WebSocket("ws://localhost:3333");
backend.on("open", function () {
  this.send("O backend, PASSA TUDO");
  this.on("message", async (e) => {
    const menssagem = e.toString();
    const objeto = JSON.parse(menssagem);
    const sql = `INSERT INTO tabela (
      messagem,data,latitude,longitude)
      values(?, ?, ?, ?)`;
    await new Promise((resolve, reject) => {
      banconuvem.run(
        sql,
        [objeto.menssagem, objeto.horario, objeto.latitude, objeto.longitude],
        (erro) => {
          if (erro) reject(erro);
          else resolve();
        }
      );
    });
  });
});

server.listen(3030, () => {
  console.log("servidor conectou");
});
