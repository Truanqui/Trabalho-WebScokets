//fazendo a conexao com o backend
const map = L.map("map").setView([51.505, -0.09], 13);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "© OpenStreetMap",
}).addTo(map);

//clica no lugar de sua escolha
/*
Evento: um objeto
objeto pacote de variaveis
 
*/
ws.onopen = function () {
  map.on("click", function (event) {
    const latlng = event.latlng;
    const latitude = latlng.lat;
    const longitude = latlng.lng;
    const menssagem = window.prompt("Confirmar menssagem");
    if (!menssagem) return;
    const objeto = {
      latitude: latitude,
      longitude: longitude,
      menssagem: menssagem,
    };
   
    //aparece o marcardor onde esta clicado no mapa, cria um pop up onde a pessoa deixar o comentario e e botao de confirmar do google e tem a possibilidade de clicar em outro local e colocar um marcador
    L.marker([latitude, longitude], { title: menssagem }).addTo(map);

    ws.send(JSON.stringify(objeto));
    return;
  });
  return;
};
ws.onerror = function (e) {
  console.log(e);
};
ws.onmessage = function (e) {
  console.log(e.data);
};
