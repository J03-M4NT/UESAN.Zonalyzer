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

function setLatLngInputs(lat, lng) {
  const latInput = document.getElementById('latInput');
  const lngInput = document.getElementById('lngInput');
  if (latInput && lngInput) {
    latInput.value = lat.toFixed(6);
    lngInput.value = lng.toFixed(6);
  }
}

function filtrarUbicacionesPorRadio(lat, lng, radio) {
  // radio en metros
  function distanciaEnMetros(lat1, lng1, lat2, lng2) {
    const R = 6371000; // Radio de la Tierra en metros
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
  return ubicacionesComerciales.filter(u =>
    distanciaEnMetros(lat, lng, u.lat, u.lng) <= radio
  );
}

function filtrarUbicacionesPorRadioYRubro(lat, lng, radio, rubro) {
  function distanciaEnMetros(lat1, lng1, lat2, lng2) {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
  return ubicacionesComerciales.filter(u =>
    (!rubro || (u.rubro && u.rubro === rubro)) &&
    distanciaEnMetros(lat, lng, u.lat, u.lng) <= radio
  );
}

function mostrarUbicacionesFiltradas(ubicaciones) {
  clearMapMarkers();
  const contenedorInfo = document.getElementById('infoLugar');
  contenedorInfo.innerHTML = '';
  const iconRedPin = {
    url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
  };
  ubicaciones.forEach((ubicacion, idx) => {
    const marker = new google.maps.Marker({
      position: { lat: ubicacion.lat, lng: ubicacion.lng },
      map,
      title: ubicacion.nombre,
      icon: iconRedPin
    });
    mapMarkers.push(marker);
    if (idx === 0) {
      // CENTRA EL MAPA EN EL PRIMER RESULTADO
      map.setCenter({ lat: ubicacion.lat, lng: ubicacion.lng });
      // Muestra el mensaje debajo del botón de buscar lugares
      const mensajeDiv = document.getElementById('mensajeLugar');
      if (mensajeDiv) {
        mensajeDiv.innerHTML = `<b>¿Por qué es un buen lugar?</b> Zona de alto tránsito, cerca de centros de interés y con potencial comercial para nuevos negocios en 2025.`;
      }
      // Street View e info (opcional, si quieres mantenerlo abajo)
      contenedorInfo.innerHTML = `
        <h3>${ubicacion.nombre}</h3>
        <img id="streetview-img" src="https://maps.googleapis.com/maps/api/streetview?size=400x200&location=${ubicacion.lat},${ubicacion.lng}&key=AIzaSyDF7OxMlCDpAwBsMiyqI4-ALdkaI77f98Q" alt="Imagen del lugar" style="max-width:100%;border-radius:8px;"/>
      `;
      const img = document.getElementById('streetview-img');
      img.onerror = function() {
        contenedorInfo.innerHTML += '<span style="color:red">No hay imagen de Street View disponible para este lugar.</span>';
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

  setLatLngInputs(centroLima.lat, centroLima.lng);

  map.addListener('center_changed', () => {
    const center = map.getCenter();
    setLatLngInputs(center.lat(), center.lng());
  });

  cargarUbicacionesComerciales();

  document.getElementById("formulario").addEventListener("submit", function(e) {
    e.preventDefault();
    const lat = parseFloat(document.getElementById('latInput').value);
    const lng = parseFloat(document.getElementById('lngInput').value);
    const radio = parseFloat(document.querySelector('input[name="radius"]').value);
    const rubro = document.querySelector('select[name="type"]').value;
    const ubicacionesFiltradas = filtrarUbicacionesPorRadioYRubro(lat, lng, radio, rubro);
    mostrarUbicacionesFiltradas(ubicacionesFiltradas);
  });
}

function clearMapMarkers() {
  mapMarkers.forEach(marker => marker.setMap(null));
  mapMarkers = [];
}
