require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { construirGrafo, dijkstra } = require('./algos/dijkstra');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const lugaresPath = path.join(__dirname, 'data', 'lugares_nodos.json');

// Paso 1: Ruta que recibe los datos del usuario y obtiene lugares desde Google Places
app.post('/api/buscar', async (req, res) => {
  const { lat, lng, radius, type } = req.body;

  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
      params: {
        key: process.env.GOOGLE_API_KEY,
        location: `${lat},${lng}`,
        radius,
        type,
      },
    });

    const lugares = response.data.results.map(l => ({
      nombre: l.name,
      lat: l.geometry.location.lat,
      lng: l.geometry.location.lng,
    }));

    // Guarda los lugares en un archivo JSON para análisis posterior
    const fs = require('fs');
    fs.writeFileSync('data/lugares_nodos.json', JSON.stringify(lugares, null, 2));

    res.json({ lugares });
  } catch (err) {
    console.error('Error al buscar lugares:', err.message);
    res.status(500).json({ error: 'Error al obtener lugares' });
  }
});


// Paso 2: Evaluar zona óptima con Dijkstra usando lugares guardados
app.get('/api/evaluar', (req, res) => {
  try {
    const data = fs.readFileSync(lugaresPath, 'utf-8');
    const lugares = JSON.parse(data);

    if (lugares.length < 2) {
      return res.status(400).json({ error: 'Se necesitan al menos 2 lugares para evaluar' });
    }

    const grafo = construirGrafo(lugares);
    const { dist } = dijkstra(grafo, 0); // desde el primer nodo

    const nodoCercano = Object.entries(dist).sort((a, b) => a[1] - b[1])[1];
    const idx = parseInt(nodoCercano[0]);

    res.json({
      zonaRecomendada: lugares[idx].nombre,
      ubicacion: {
        lat: lugares[idx].lat,
        lng: lugares[idx].lng,
      },
      mensaje: 'Zona recomendada usando análisis de grafos con datos reales.',
    });
  } catch (err) {
    console.error('Error al leer o procesar los nodos:', err.message);
    res.status(500).json({ error: 'No se pudo procesar la evaluación' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
