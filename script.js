document.getElementById('negocioForm').addEventListener('submit', function(event) {
  event.preventDefault();

  // Simulación de procesamiento (en el futuro aquí irá la lógica del backend)
  const rubro = event.target.rubro.value;
  const zona = event.target.zona.value || "Lima Metropolitana";

  const mensaje = `Según nuestros datos, las mejores zonas para un negocio de "${rubro}" son: 
  <strong>Surquillo, Miraflores y Jesús María</strong> si buscas alta demanda y buen balance de competencia en ${zona}.`;

  document.getElementById('recomendacion-texto').innerHTML = mensaje;
  document.getElementById('form-section').classList.add('hidden');
  document.getElementById('resultado-section').classList.remove('hidden');
});

function reiniciar() {
  document.getElementById('negocioForm').reset();
  document.getElementById('form-section').classList.remove('hidden');
  document.getElementById('resultado-section').classList.add('hidden');
}
