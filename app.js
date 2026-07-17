const defaults = Object.fromEntries([...document.querySelectorAll('[data-field]')].map(el => [el.dataset.field, el.value]));
const saved = JSON.parse(localStorage.getItem('ideamos-quote') || '{}');
const fields = document.querySelectorAll('[data-field]');
const status = document.getElementById('status');
const defaultLists = {
  features: [
    {title:'Catálogo por líneas', description:'Productos organizados para facilitar la búsqueda.'},
    {title:'Fichas de producto', description:'Imágenes, información y acceso directo a consulta.'},
    {title:'Solicitud de presupuesto', description:'Selección de productos y pedido por WhatsApp.'},
    {title:'Diseño responsive', description:'Optimizado para computadoras, tablets y celulares.'}
  ],
  included: [
    {title:'Diseño a medida', description:'Una propuesta visual pensada para la marca.'},
    {title:'Páginas individuales', description:'Secciones y URLs según el alcance acordado.'},
    {title:'Diseño responsive', description:'Adaptable a computadoras, tablets y celulares.'},
    {title:'Etapas de revisiones', description:'Hasta dos instancias de ajustes.'},
    {title:'Optimización general', description:'Estructura clara, rápida y ordenada.'},
    {title:'Sistema de consulta', description:'Preparado para generar contactos comerciales.'}
  ]
};
let lists = JSON.parse(localStorage.getItem('ideamos-quote-lists') || 'null') || structuredClone(defaultLists);

function render(name, value) {
  document.querySelectorAll(`[data-output="${name}"]`).forEach(el => el.textContent = value);
}
function save() {
  const data = Object.fromEntries([...fields].map(el => [el.dataset.field, el.value]));
  localStorage.setItem('ideamos-quote', JSON.stringify(data));
  localStorage.setItem('ideamos-quote-lists', JSON.stringify(lists));
  status.textContent = 'Cambios guardados';
  clearTimeout(save.timer); save.timer = setTimeout(() => status.textContent = '', 1400);
}

function renderListOutput(name) {
  const output = document.getElementById(`${name}Output`);
  output.innerHTML = '';
  lists[name].forEach(item => {
    const entry = document.createElement('div');
    if (name === 'features') entry.innerHTML = '<h4></h4><p></p>';
    else { entry.className = 'included-item'; entry.innerHTML = '<h6></h6><p></p>'; }
    entry.querySelector(name === 'features' ? 'h4' : 'h6').textContent = item.title;
    entry.querySelector('p').textContent = item.description;
    output.appendChild(entry);
  });
}

function renderList(name) {
  const editor = document.getElementById(`${name}Editor`);
  editor.innerHTML = '';
  lists[name].forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'list-item';
    card.innerHTML = '<button type="button" class="remove-item" aria-label="Quitar ítem">×</button><label>Título<input></label><label>Descripción<textarea rows="2"></textarea></label>';
    const input = card.querySelector('input');
    const textarea = card.querySelector('textarea');
    input.value = item.title;
    textarea.value = item.description;
    input.addEventListener('input', () => { lists[name][index].title = input.value; renderListOutput(name); save(); });
    textarea.addEventListener('input', () => { lists[name][index].description = textarea.value; renderListOutput(name); save(); });
    card.querySelector('.remove-item').addEventListener('click', () => { lists[name].splice(index, 1); renderList(name); save(); });
    editor.appendChild(card);
  });
  renderListOutput(name);
}

document.querySelectorAll('[data-add-list]').forEach(button => button.addEventListener('click', () => {
  const name = button.dataset.addList;
  lists[name].push({title:'Nuevo ítem', description:'Escribí aquí la descripción.'});
  renderList(name);
  save();
}));
renderList('features');
renderList('included');
fields.forEach(el => {
  el.value = saved[el.dataset.field] ?? el.value;
  render(el.dataset.field, el.value);
  el.addEventListener('input', () => { render(el.dataset.field, el.value); save(); });
});

document.getElementById('resetBtn').addEventListener('click', () => {
  if (!confirm('¿Restablecer todos los campos al ejemplo original?')) return;
  fields.forEach(el => { el.value = defaults[el.dataset.field]; render(el.dataset.field, el.value); });
  lists = structuredClone(defaultLists);
  renderList('features'); renderList('included');
  localStorage.removeItem('ideamos-quote-lists');
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
