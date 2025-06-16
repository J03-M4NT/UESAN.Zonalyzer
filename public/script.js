let map;

function initMap() {
  const centroLima = { lat: -12.05, lng: -77.03 };

  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 14,
    center: centroLima,
  });

  document.getElementById("buscarBtn").addEventListener("click", async () => {
    const tipo = document.getElementById("tipo").value;
    const radio = parseInt(document.getElementById("radio").value);

    if (!tipo || isNaN(radio)) {
      alert("Completa todos los campos correctamente.");
      return;
    }

    try {
      const res = await fetch("/api/buscar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lat: centroLima.lat,
          lng: centroLima.lng,
          radius: radio,
          type: tipo,
        }),
      });

      if (!res.ok) {
        throw new Error("Error al obtener lugares");
      }

      const data = await res.json();
      console.log("Lugares encontrados:", data.lugares);

      // Limpia marcadores anteriores
      clearMapMarkers();

      data.lugares.forEach((lugar) => {
        new google.maps.Marker({
          position: { lat: lugar.lat, lng: lugar.lng },
          map,
          title: lugar.nombre,
        });
      });

      // Ahora solicita la evaluación
      const evalRes = await fetch("/api/evaluar");
      const evalData = await evalRes.json();

      if (evalData.ubicacion) {
        new google.maps.Marker({
          position: evalData.ubicacion,
          map,
          title: `⭐ Zona recomendada: ${evalData.zonaRecomendada}`,
          icon: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
        });

        alert(evalData.mensaje);
      }

    } catch (err) {
      console.error("❌ Error en la búsqueda:", err);
      alert("Ocurrió un error al buscar lugares o evaluar zona.");
    }
  });
}

let mapMarkers = [];
function clearMapMarkers() {
  mapMarkers.forEach(marker => marker.setMap(null));
  mapMarkers = [];
}
