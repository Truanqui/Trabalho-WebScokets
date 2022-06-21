//requisitando biblioteca http
const http = require("http");
//criando servidor http
const server = http.createServer();
//requisitando biblioteca websockets server e websocket
const { WebSocketServer, WebSocket } = require("ws");
//requisitando bliblioteca sqlite
const sqlite3 = require("sqlite3");
//criando servidor websocket
const wss = new WebSocketServer({ server });
//criando uma instacia de um database
const db = sqlite3.verbose().Database;
const vetor = [];
//conexao com o banco de dados local
const bancolocal = new db("./src/DataBase/BancoLocal.db");

//Conexao do servidor
wss.on("connection", (socket, request) => {
  //recebendo a messagem e caso receba continue
  socket.on("message", async (e) => {
    const menssagem = e.toString();
    
    if(menssagem ==="O backend, PASSA TUDO"){
      // se tiver vazio retorna
      if(!vetor.length)return
      // pega todos os elementos e enviam para quem esta conectado ou seja a nuvem
      vetor.forEach(value=>{
       socket.send(value);
      })
      return;
    }
    //converte string e um objeto e inseri os valores nas respectivas variaveis
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
    //pega o objeto nuvem e mandar os dados pra nuvem 
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
    });
    //e caso der error pega do objeto nuvem que esta conectado com a nuvem, e manda a mensagem(mensagem,horario,latitude,longitude) para o objeto vetor
    nuvem.on("error", ()=>{
      vetor.push( JSON.stringify({
        menssagem: objeto.menssagem,
        horario: horario,
        latitude: objeto.latitude,
        longitude: objeto.longitude,
      }));
      wss.emit("Connection error with nuvem");
    })
    //objeto nuvem escuta e quando receber mensagem executa o comando 
    nuvem.on("message", async function(nuvemSave) {
      const nuvemSaveString = nuvemSave.toString();
      //envia para todos que tiverem conectados no servidor
      wss.emit(nuvemSaveString);
    })
  });
});
//Criando tabela e Banco de dados Local
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
