const defaults = Object.fromEntries([...document.querySelectorAll('[data-field]')].map(el => [el.dataset.field, el.value]));
const saved = JSON.parse(localStorage.getItem('ideamos-quote') || '{}');
const fields = document.querySelectorAll('[data-field]');
const status = document.getElementById('status');

function render(name, value) {
  document.querySelectorAll(`[data-output="${name}"]`).forEach(el => el.textContent = value);
}
function save() {
  const data = Object.fromEntries([...fields].map(el => [el.dataset.field, el.value]));
  localStorage.setItem('ideamos-quote', JSON.stringify(data));
  status.textContent = 'Cambios guardados';
  clearTimeout(save.timer); save.timer = setTimeout(() => status.textContent = '', 1400);
}
fields.forEach(el => {
  el.value = saved[el.dataset.field] ?? el.value;
  render(el.dataset.field, el.value);
  el.addEventListener('input', () => { render(el.dataset.field, el.value); save(); });
});

document.getElementById('resetBtn').addEventListener('click', () => {
  if (!confirm('¿Restablecer todos los campos al ejemplo original?')) return;
  fields.forEach(el => { el.value = defaults[el.dataset.field]; render(el.dataset.field, el.value); });
  localStorage.removeItem('ideamos-quote'); status.textContent = 'Presupuesto restablecido';
});

document.getElementById('zoomBtn').addEventListener('click', () => document.querySelector('.document').scrollIntoView({behavior:'smooth'}));

document.getElementById('downloadBtn').addEventListener('click', async () => {
  const btn = document.getElementById('downloadBtn');
  const doc = document.getElementById('document');
  const client = (document.querySelector('[data-field="client"]').value || 'cliente').trim();
  btn.disabled = true; btn.textContent = 'Generando…'; status.textContent = 'Preparando PDF de 6 páginas…';
  doc.classList.add('exporting');
  try {
    if (!window.html2pdf) { window.print(); return; }
    await html2pdf().set({
      margin: 0,
      filename: `Presupuesto - ${client}.pdf`,
      image: {type:'jpeg', quality:.98},
      html2canvas: {scale:2, useCORS:true, backgroundColor:'#242526'},
      jsPDF: {unit:'mm', format:'a4', orientation:'portrait'},
      pagebreak: {mode:['css','legacy']}
    }).from(doc).save();
    status.textContent = 'PDF descargado';
  } catch (error) {
    console.error(error); status.textContent = 'No se pudo descargar. Abrimos la impresión como alternativa.'; window.print();
  } finally {
    doc.classList.remove('exporting'); btn.disabled = false; btn.textContent = 'Descargar PDF';
  }
});
