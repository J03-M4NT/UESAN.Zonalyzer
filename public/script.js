let map;
let heatmapLayer = null;
let ubicacionesComerciales = [];

// Cargar ubicaciones comerciales desde el JSON en /public
async function cargarUbicacionesComerciales() {
  try {
    const res = await fetch("/ubicaciones_comerciales_lima_2025.json");
    if (!res.ok) throw new Error('No se pudo cargar el JSON');
    ubicacionesComerciales = await res.json();
    if (map) mostrarTodasUbicacionesComerciales();
  } catch (e) {
    const mensajeDiv = document.getElementById('mensajeLugar');
    if (mensajeDiv) mensajeDiv.innerHTML = `<span style='color:red'>No se pudieron cargar las ubicaciones comerciales.</span>`;
    console.error("No se pudieron cargar las ubicaciones comerciales", e);
  }
}

function mostrarTodasUbicacionesComerciales() {
  clearHeatmap();
  const contenedorInfo = document.getElementById('infoLugar');
  contenedorInfo.innerHTML = '';
  if (!ubicacionesComerciales.length) return;
  mostrarHeatmap(ubicacionesComerciales);
  // Mostrar info del primer lugar como ejemplo
  const primer = ubicacionesComerciales[0];
  contenedorInfo.innerHTML = `
    <h3>${primer.nombre}</h3>
    <img id="streetview-img" src="https://maps.googleapis.com/maps/api/streetview?size=400x200&location=${primer.lat},${primer.lng}&key=AIzaSyDF7OxMlCDpAwBsMiyqI4-ALdkaI77f98Q" alt="Imagen del lugar" style="max-width:100%;border-radius:8px;"/>
    <p id="streetview-msg"><b>¿Por qué es un buen lugar?</b> Zona de alto tránsito, cerca de centros de interés y con potencial comercial para nuevos negocios en 2025.</p>
  `;
  const img = document.getElementById('streetview-img');
  img.onerror = function() {
    document.getElementById('streetview-msg').innerHTML = '<span style="color:red">No hay imagen de Street View disponible para este lugar.</span>';
    this.style.display = 'none';
  };
}

function setLatLngInputs(lat, lng) {
  const latInput = document.getElementById('latInput');
  const lngInput = document.getElementById('lngInput');
  if (latInput && lngInput) {
    latInput.value = lat.toFixed(6);
    lngInput.value = lat.toFixed(6);
  }
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
  // Si el radio es muy grande, mostrar todos los lugares del rubro (o todos si rubro vacío)
  if (radio >= 40000) {
    return ubicacionesComerciales.filter(u => !rubro || (u.rubro && u.rubro === rubro));
  }
  return ubicacionesComerciales.filter(u =>
    (!rubro || (u.rubro && u.rubro === rubro)) &&
    distanciaEnMetros(lat, lng, u.lat, u.lng) <= radio
  );
}

function mostrarHeatmap(ubicaciones) {
  clearHeatmap();
  if (!ubicaciones.length) return;
  if (ubicaciones.length > 1000) {
    const mensajeDiv = document.getElementById('mensajeLugar');
    if (mensajeDiv) mensajeDiv.innerHTML = `<span style='color:orange'>Se muestran ${ubicaciones.length} puntos en el mapa de calor. Considera reducir el radio o filtrar por rubro para una mejor visualización.</span>`;
  }
  const heatmapData = ubicaciones.map(u => new google.maps.LatLng(u.lat, u.lng));
  heatmapLayer = new google.maps.visualization.HeatmapLayer({
    data: heatmapData,
    radius: 30,
    map: map
  });
}

function buscarLugaresCercanos(lat, lng, radio, callback) {
  const service = new google.maps.places.PlacesService(map);
  const tipos = [
    { tipo: 'restaurant', label: 'restaurantes' },
    { tipo: 'cafe', label: 'cafeterías' },
    { tipo: 'store', label: 'tiendas' },
    { tipo: 'supermarket', label: 'supermercados' },
    { tipo: 'pharmacy', label: 'farmacias' },
    { tipo: 'tourist_attraction', label: 'lugares turísticos' }
  ];
  let resultados = {};
  let pendientes = tipos.length;
  tipos.forEach(({ tipo, label }) => {
    let total = 0;
    function buscarPagina(pagination) {
      const request = {
        location: new google.maps.LatLng(lat, lng),
        radius: radio,
        type: tipo
      };
      service.nearbySearch(request, function(results, status, pag) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          total += results.length;
          if (pag && pag.hasNextPage && total < 60) {
            setTimeout(() => pag.nextPage(), 1200); // Google recomienda esperar 2s
          } else {
            resultados[label] = total;
            pendientes--;
            if (pendientes === 0) callback(resultados);
          }
        } else {
          resultados[label] = total;
          pendientes--;
          if (pendientes === 0) callback(resultados);
        }
      });
    }
    buscarPagina();
  });
}

function mostrarResumenLugaresEnInfo(lat, lng, radio) {
  const contenedorInfo = document.getElementById('infoLugar');
  // Buscar el mensaje de buen lugar para insertar el resumen justo después
  let mensajeZona = document.getElementById('mensajeLugarZona');
  let resumenDiv = document.getElementById('resumenLugaresZona');
  if (!resumenDiv) {
    resumenDiv = document.createElement('div');
    resumenDiv.id = 'resumenLugaresZona';
    resumenDiv.style.margin = '0.5em 0 0 0';
    resumenDiv.style.color = '#145a96';
    resumenDiv.style.fontWeight = '500';
    resumenDiv.textContent = 'Buscando lugares cercanos...';
    if (mensajeZona && mensajeZona.parentNode) {
      mensajeZona.parentNode.insertBefore(resumenDiv, mensajeZona.nextSibling);
    } else {
      contenedorInfo.appendChild(resumenDiv);
    }
  } else {
    resumenDiv.textContent = 'Buscando lugares cercanos...';
  }
  buscarLugaresCercanos(lat, lng, radio, function(resumen) {
    let html = `<b>Resumen de la zona (${(radio/1000).toFixed(1)} km):</b> `;
    html += Object.entries(resumen).map(([k, v]) => `${v} ${k}`).join(', ');
    resumenDiv.innerHTML = html;
  });
}

function mostrarUbicacionesFiltradas(ubicaciones) {
  clearHeatmap();
  const contenedorInfo = document.getElementById('infoLugar');
  const mensajeDiv = document.getElementById('mensajeLugar');
  contenedorInfo.innerHTML = '';
  if (mensajeDiv) mensajeDiv.innerHTML = '';

  // Limpiar resumen antes de mostrar
  if (document.getElementById('resumenLugares')) {
    document.getElementById('resumenLugares').innerHTML = '';
  }

  if (ubicaciones.length === 0) {
    if (mensajeDiv) mensajeDiv.innerHTML = `<span style=\"color:red\">No se encontraron lugares para los filtros seleccionados.</span>`;
    return;
  }

  // Lee la afluencia seleccionada
  const afluencia = document.getElementById('afluenciaSelect')?.value || 'baja';
  // Estima afluencia y filtra
  const ubicacionesAfluencia = estimarAfluenciaPorZona(ubicaciones, afluencia);
  mostrarHeatmapAfluencia(ubicacionesAfluencia, afluencia);

  // Centrar el mapa en el primer resultado
  const primer = ubicacionesAfluencia[0] || ubicaciones[0];
  map.setCenter({ lat: primer.lat, lng: primer.lng });

  // Mostrar mensaje de buen lugar y resumen SIEMPRE
  contenedorInfo.innerHTML = `
    <div id=\"mensajeLugarZona\"><b>¿Por qué es un buen lugar?</b> Zona de alto tránsito, cerca de centros de interés y con potencial comercial para nuevos negocios en 2025.</div>
    <h3>${primer.nombre}</h3>
    <img id=\"streetview-img\" src=\"https://maps.googleapis.com/maps/api/streetview?size=400x200&location=${primer.lat},${primer.lng}&key=AIzaSyDF7OxMlCDpAwBsMiyqI4-ALdkaI77f98Q\" alt=\"Imagen del lugar\" style=\"max-width:100%;border-radius:8px;\"/>
  `;
  const img = document.getElementById('streetview-img');
  img.onerror = function() {
    contenedorInfo.innerHTML += '<span style=\"color:red\">No hay imagen de Street View disponible para este lugar.</span>';
    this.style.display = 'none';
  };

  // Mostrar resumen de lugares cercanos justo debajo del mensaje de buen lugar
  const radio = parseFloat(document.querySelector('input[name=\"radius\"]').value);
  mostrarResumenLugaresEnInfo(primer.lat, primer.lng, radio, afluencia, primer.score);
}

function clearHeatmap() {
  if (heatmapLayer) {
    heatmapLayer.setMap(null);
    heatmapLayer = null;
  }
}

// Sincronizar slider y campo de radio (km)
function sincronizarSliderRadio() {
  const radiusSlider = document.getElementById('radiusSlider');
  const radiusInput = document.getElementById('radiusInput');
  if (radiusSlider && radiusInput) {
    // Asegura que el máximo sea 1000
    radiusSlider.max = 1000;
    // Sincroniza slider -> input
    radiusInput.value = radiusSlider.value;
    radiusSlider.addEventListener('input', function() {
      radiusInput.value = this.value;
    });
    // Sincroniza input -> slider
    radiusInput.addEventListener('input', function() {
      let val = parseInt(this.value);
      if (isNaN(val)) val = 1;
      if (val < parseInt(radiusSlider.min)) val = parseInt(radiusSlider.min);
      if (val > parseInt(radiusSlider.max)) val = parseInt(radiusSlider.max);
      this.value = val;
      radiusSlider.value = val;
    });
  }
}
// Llama a la función directamente al final del script (ya que el script estará al final del body)
sincronizarSliderRadio();

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
    // Convertir km a metros
    const radio = parseFloat(document.getElementById('radiusInput').value) * 1000;
    const rubro = document.querySelector('select[name="type"]').value;
    const ubicacionesFiltradas = filtrarUbicacionesPorRadioYRubro(lat, lng, radio, rubro);
    mostrarUbicacionesFiltradas(ubicacionesFiltradas);
  });
}

// Nueva función para estimar afluencia por zona
function estimarAfluenciaPorZona(ubicaciones, afluencia) {
  // Simulación: cuenta lugares cercanos y clasifica
  // Puedes mejorar esto con datos reales si tienes
  return ubicaciones.map(u => {
    // Suma de lugares cercanos (puedes ajustar el rango)
    let score = 0;
    if (u.resumen && typeof u.resumen === 'object') {
      score = Object.values(u.resumen).reduce((a, b) => a + b, 0);
    } else {
      // Si no hay resumen, usa un valor base
      score = Math.floor(Math.random() * 100);
    }
    let nivel = 'baja';
    if (score >= 60) nivel = 'alta';
    else if (score >= 30) nivel = 'media';
    return { ...u, afluencia: nivel, score };
  }).filter(u => {
    if (afluencia === 'alta') return u.afluencia === 'alta';
    if (afluencia === 'media') return u.afluencia === 'media' || u.afluencia === 'alta';
    return true; // baja: muestra todo
  });
}

// Nueva función para mostrar heatmap según afluencia
function mostrarHeatmapAfluencia(ubicaciones, afluencia) {
  clearHeatmap();
  if (!ubicaciones.length) return;
  // Ajusta el gradiente según la afluencia
  let gradient;
  if (afluencia === 'alta') {
    gradient = [
      'rgba(255,255,0,0)',
      'rgba(255,140,0,0.7)',
      'rgba(255,0,0,1)'
    ];
  } else if (afluencia === 'media') {
    gradient = [
      'rgba(0,255,255,0)',
      'rgba(0,255,0,0.7)',
      'rgba(255,255,0,1)'
    ];
  } else {
    gradient = [
      'rgba(0,0,255,0)',
      'rgba(0,255,255,0.7)',
      'rgba(0,255,0,1)'
    ];
  }
  const heatmapData = ubicaciones.map(u => {
    // Peso según score
    return { location: new google.maps.LatLng(u.lat, u.lng), weight: u.score || 1 };
  });
  heatmapLayer = new google.maps.visualization.HeatmapLayer({
    data: heatmapData,
    radius: 30,
    gradient: gradient,
    map: map
  });
}

// Modifica mostrarResumenLugaresEnInfo para mostrar cantidad de clientes
function mostrarResumenLugaresEnInfo(lat, lng, radio, afluencia, score) {
  const contenedorInfo = document.getElementById('infoLugar');
  let mensajeZona = document.getElementById('mensajeLugarZona');
  let resumenDiv = document.getElementById('resumenLugaresZona');
  if (!resumenDiv) {
    resumenDiv = document.createElement('div');
    resumenDiv.id = 'resumenLugaresZona';
    resumenDiv.style.margin = '0.5em 0 0 0';
    resumenDiv.style.color = '#145a96';
    resumenDiv.style.fontWeight = '500';
    resumenDiv.textContent = 'Buscando lugares cercanos...';
    if (mensajeZona && mensajeZona.parentNode) {
      mensajeZona.parentNode.insertBefore(resumenDiv, mensajeZona.nextSibling);
    } else {
      contenedorInfo.appendChild(resumenDiv);
    }
  } else {
    resumenDiv.textContent = 'Buscando lugares cercanos...';
  }
  buscarLugaresCercanos(lat, lng, radio, function(resumen) {
    let total = Object.values(resumen).reduce((a, b) => a + b, 0);
    let nivel = 'Baja';
    if (total >= 60) nivel = 'Alta';
    else if (total >= 30) nivel = 'Media';
    let html = `<b>Resumen de la zona (${(radio/1000).toFixed(1)} km):</b> `;
    html += Object.entries(resumen).map(([k, v]) => `${v} ${k}`).join(', ');
    html += `<br><b>Estimación de afluencia de clientes:</b> ${nivel} (${total} clientes potenciales)`;
    if (afluencia) {
      html += `<br><b>Filtro aplicado:</b> ${afluencia.charAt(0).toUpperCase() + afluencia.slice(1)}`;
    }
    resumenDiv.innerHTML = html;
  });
}