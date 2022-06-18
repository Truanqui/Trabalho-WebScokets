const http = require("http");
const server = http.createServer();
const { WebSocketServer, WebSocket } = require("ws");
const sqlite3 = require("sqlite3");
const wss = new WebSocketServer({ server });
const db = sqlite3.verbose().Database;
const bancolocal = new db("./src/DataBase/BancoLocal.db");

//Conexao do servidor
wss.on("connection", (socket, request) => {

  socket.on("message", async (e) => {
    const menssagem = e.toString();
    const objeto = JSON.parse(menssagem);
    const sql = `
     INSERT INTO tabela(menssagem,data,latitude,longitude) VALUES (?,?,?,?)`;
    const horario = Date.now();
    await new Promise((resolve, reject) => {
      bancolocal.run(
        sql,
        [objeto.menssagem, horario, objeto.latitude, objeto.longitude],
        (erro) => {
          if (erro) reject(erro);
          else resolve();
        }
      );
    });
    //mandar os dados pra nuvem
    const nuvem = new WebSocket("ws://localhost:3030");
    nuvem.on("open", function () {
      this.send(
        JSON.stringify({
          menssagem: objeto.menssagem,
          horario: horario,
          latitude: objeto.latitude,
          longitude: objeto.longitude,
        })
      );
      nuvem.close();
    });
  });
});
//Banco de dados Local
server.on("listening", async () => {
  await new Promise((resolve, reject) => {
    bancolocal.exec(
      `
        CREATE TABLE IF NOT EXISTS tabela(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            menssagem VARCHAR NOT NULL,
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

server.listen(3333, () => {
  console.log("servidor conectou");
});
