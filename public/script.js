let map;

let mapMarkers = [];
let ubicacionesComerciales = [];

async function cargarUbicacionesComerciales() {
  try {
    const res = await fetch("/data/ubicaciones_comerciales_lima_2025.json");
    ubicacionesComerciales = await res.json();
    // Si el mapa ya está inicializado, mostrar los marcadores al cargar
    if (map) mostrarTodasUbicacionesComerciales();
  } catch (e) {
    console.error("No se pudieron cargar las ubicaciones comerciales", e);
  }
}

function mostrarTodasUbicacionesComerciales() {
  clearMapMarkers();
  const contenedorInfo = document.getElementById('infoLugar');
  contenedorInfo.innerHTML = '';
  const iconRedPin = {
    url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
  };
  ubicacionesComerciales.forEach((ubicacion) => {
    const marker = new google.maps.Marker({
      position: { lat: ubicacion.lat, lng: ubicacion.lng },
      map,
      title: ubicacion.nombre,
      icon: iconRedPin
    });
    mapMarkers.push(marker);
    // Mostrar info del primer lugar como ejemplo
    if (contenedorInfo.innerHTML === '') {
      contenedorInfo.innerHTML = `
        <h3>${ubicacion.nombre}</h3>
        <img id="streetview-img" src="https://maps.googleapis.com/maps/api/streetview?size=400x200&location=${ubicacion.lat},${ubicacion.lng}&key=AIzaSyDF7OxMlCDpAwBsMiyqI4-ALdkaI77f98Q" alt="Imagen del lugar" style="max-width:100%;border-radius:8px;"/>
        <p id="streetview-msg"><b>¿Por qué es un buen lugar?</b> Zona de alto tránsito, cerca de centros de interés y con potencial comercial para nuevos negocios en 2025.</p>
      `;
      // Si la imagen no carga, mostrar mensaje
      const img = document.getElementById('streetview-img');
      img.onerror = function() {
        document.getElementById('streetview-msg').innerHTML = '<span style="color:red">No hay imagen de Street View disponible para este lugar.</span>';
        this.style.display = 'none';
      };
    }
  });
}

function initMap() {
  const centroLima = { lat: -12.05, lng: -77.03 };

  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 14,
    center: centroLima,
  });

  cargarUbicacionesComerciales();

  document.getElementById("formulario").addEventListener("submit", function(e) {
    e.preventDefault();
    const lat = parseFloat(document.querySelector('input[name="lat"]').value);
    const lng = parseFloat(document.querySelector('input[name="lng"]').value);
    // Centrar el mapa en la ubicación ingresada
    map.setCenter({ lat, lng });
    mostrarTodasUbicacionesComerciales();
  });
}

function clearMapMarkers() {
  mapMarkers.forEach(marker => marker.setMap(null));
  mapMarkers = [];
}
