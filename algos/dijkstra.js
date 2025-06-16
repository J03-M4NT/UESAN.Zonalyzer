// algos/dijkstra.js
function calcularDistancia(a, b) {
  const dx = a.lat - b.lat;
  const dy = a.lng - b.lng;
  return Math.sqrt(dx * dx + dy * dy);
}

function construirGrafo(puntos) {
  const grafo = {};

  puntos.forEach((p1, i) => {
    grafo[i] = [];

    puntos.forEach((p2, j) => {
      if (i !== j) {
        const peso = calcularDistancia(p1, p2);
        grafo[i].push({ nodo: j, peso });
      }
    });
  });

  return grafo;
}

function dijkstra(grafo, inicio) {
  const dist = {};
  const visitado = {};
  const prev = {};

  for (let nodo in grafo) {
    dist[nodo] = Infinity;
    prev[nodo] = null;
  }

  dist[inicio] = 0;

  while (true) {
    let minNodo = null;

    for (let nodo in dist) {
      if (!visitado[nodo] && (minNodo === null || dist[nodo] < dist[minNodo])) {
        minNodo = nodo;
      }
    }

    if (minNodo === null) break;
    visitado[minNodo] = true;

    for (let vecino of grafo[minNodo]) {
      const alt = dist[minNodo] + vecino.peso;
      if (alt < dist[vecino.nodo]) {
        dist[vecino.nodo] = alt;
        prev[vecino.nodo] = minNodo;
      }
    }
  }

  return { dist, prev };
}

module.exports = { construirGrafo, dijkstra };
