const defaults = Object.fromEntries([...document.querySelectorAll('[data-field]')].map(el => [el.dataset.field, el.value]));
const saved = JSON.parse(localStorage.getItem('ideamos-quote') || '{}');
if (saved.option2Detail === 'Primer pago (50%) antes de empezar, 50% un día antes del alta online final.') {
  saved.option2Detail = 'Primer pago (50%) antes de empezar. 50% (pago 2) un día antes de la migración / alta online final.';
}
const legacyPaymentTerms = '1 - Por transferencia bancaria, 100% adelantado con un 10% de descuento.\n2 - Por transferencia bancaria, 50% antes de empezar y 50% antes del alta online.\n3 - Con tarjeta de crédito, con un 10% extra.';
if (saved.paymentTerms === legacyPaymentTerms) {
  saved.paymentTerms = 'Podés elegir una de estas opciones:\n1 - Por transferencia bancaria, 100% adelantado con un 10% de descuento.\n2 - Por transferencia bancaria, 50% antes de empezar, 50% un día antes del alta online.\n3 - Con tarjeta de crédito en las cuotas que te permita tu banco, con un 10% extra.';
}
const fields = document.querySelectorAll('[data-field]');
const status = document.getElementById('status');
const defaultLists = {
  features: [
    {title:'Catálogo por líneas', description:'Los 22 productos estarán organizados en cinco líneas para facilitar la búsqueda.'},
    {title:'Fichas de producto', description:'Cada producto contará con imágenes, información y acceso directo a consulta.'},
    {title:'Solicitud de presupuesto', description:'El usuario podrá seleccionar productos y enviar su pedido directamente por WhatsApp.'},
    {title:'Diseño responsive', description:'La experiencia estará optimizada para computadoras, tablets y teléfonos celulares.'}
  ],
  included: [
    {title:'28 páginas / URLs en total.', description:''},
    {title:'22 páginas individuales de producto.', description:''},
    {title:'Productos organizados en 5 líneas.', description:''},
    {title:'Imágenes y características por producto.', description:''},
    {title:'Solicitud de presupuesto por WhatsApp.', description:''},
    {title:'Adaptable a todos los dispositivos.', description:''},
    {title:'Hasta dos etapas de revisiones.', description:''},
    {title:'Sistema de consulta, sin pagos automáticos.', description:''}
  ]
};
let lists = JSON.parse(localStorage.getItem('ideamos-quote-lists') || 'null') || structuredClone(defaultLists);
const legacyIncludedTitles = new Set([
  'Diseño a medida', 'Páginas individuales', 'Diseño responsive',
  'Etapas de revisiones', 'Optimización general', 'Sistema de consulta'
]);
if (lists.included.length === 6 && lists.included.every(item => legacyIncludedTitles.has(item.title))) {
  lists.included = structuredClone(defaultLists.included);
}
const featureMigrations = new Map([
  ['Productos organizados para facilitar la búsqueda.', defaultLists.features[0].description],
  ['Imágenes, información y acceso directo a consulta.', defaultLists.features[1].description],
  ['Selección de productos y pedido por WhatsApp.', defaultLists.features[2].description],
  ['Optimizado para computadoras, tablets y celulares.', defaultLists.features[3].description]
]);
lists.features.forEach(item => {
  if (featureMigrations.has(item.description)) item.description = featureMigrations.get(item.description);
});

function render(name, value) {
  document.querySelectorAll(`[data-output="${name}"]`).forEach(el => {
    if (name === 'paymentTerms') {
      const [intro, ...lines] = value.split('\n');
      el.replaceChildren(Object.assign(document.createElement('strong'), {textContent: intro}));
      if (lines.length) el.append(document.createTextNode(`\n${lines.join('\n')}`));
      return;
    }
    if (name === 'validity') {
      const parts = value.match(/^(Hasta el\s+)(.+)$/i);
      if (parts) {
        el.replaceChildren(document.createTextNode(parts[1]), Object.assign(document.createElement('strong'), {textContent: parts[2]}));
        return;
      }
    }
    if (name === 'option1' || name === 'option2') {
      const parts = value.match(/^(.*?)(\$[\d.,]+)\s*$/);
      if (parts) {
        el.replaceChildren(document.createTextNode(parts[1]), Object.assign(document.createElement('strong'), {textContent: parts[2]}));
        return;
      }
    }
    el.textContent = value;
  });
  scheduleAdaptiveLayout();
}

function focusPreview(target) {
  if (!target) return;
  document.querySelectorAll('.preview-focus').forEach(element => element.classList.remove('preview-focus'));
  target.scrollIntoView({behavior: 'smooth', block: 'center', inline: 'nearest'});
  target.classList.remove('preview-focus');
  requestAnimationFrame(() => target.classList.add('preview-focus'));
  clearTimeout(focusPreview.timer);
  focusPreview.timer = setTimeout(() => target.classList.remove('preview-focus'), 1800);
}

function focusFieldPreview(fieldName) {
  const outputName = fieldName === 'projectShort' ? 'project' : fieldName;
  const targets = [...document.querySelectorAll(`[data-output="${outputName}"]`)];
  if (!targets.length) return;
  const viewportCenter = window.innerHeight / 2;
  const nearest = targets.reduce((best, target) => {
    const center = target.getBoundingClientRect().top + target.getBoundingClientRect().height / 2;
    const distance = Math.abs(center - viewportCenter);
    return !best || distance < best.distance ? {target, distance} : best;
  }, null);
  focusPreview(nearest.target);
}

let adaptiveFrame;
function scheduleAdaptiveLayout() {
  cancelAnimationFrame(adaptiveFrame);
  adaptiveFrame = requestAnimationFrame(applyAdaptiveLayout);
}

function fitText(element, maxHeight, minimumSize) {
  if (!element) return;
  element.style.fontSize = '';
  let size = parseFloat(getComputedStyle(element).fontSize);
  while (element.scrollHeight > maxHeight && size > minimumSize) {
    size -= 0.5;
    element.style.fontSize = `${size}px`;
  }
}

function fitTextWidth(element, minimumSize) {
  if (!element) return;
  element.style.fontSize = '';
  let size = parseFloat(getComputedStyle(element).fontSize);
  while (element.scrollWidth > element.clientWidth && size > minimumSize) {
    size -= 0.5;
    element.style.fontSize = `${size}px`;
  }
}

function setDensity(element, count, totalCharacters, compactAt, denseAt) {
  if (!element) return;
  element.dataset.density = count >= denseAt || totalCharacters > denseAt * 90
    ? 'dense'
    : count >= compactAt || totalCharacters > compactAt * 90
      ? 'compact'
      : 'normal';
  element.dataset.count = String(count);
}

function applyAdaptiveLayout() {
  document.querySelectorAll('h3[data-output="project"]').forEach(element => {
    fitTextWidth(element, element.closest('.cover') ? 68 : 52);
  });
  fitText(document.querySelector('.proposal > .lead'), 125, 16);
  fitText(document.querySelector('.proposal > p:not(.lead)'), 215, 11);
  fitText(document.querySelector('.budget .include-block > p:not(.scope)'), 58, 11);
  fitText(document.querySelector('.budget .scope'), 60, 11);
  fitText(document.querySelector('.price [data-output="option1Detail"]'), 52, 10);
  fitText(document.querySelector('.price [data-output="option2Detail"]'), 52, 10);

  const features = document.getElementById('featuresOutput');
  const included = document.getElementById('includedOutput');
  const featureChars = lists.features.reduce((sum, item) => sum + item.title.length + item.description.length, 0);
  const includedChars = lists.included.reduce((sum, item) => sum + item.title.length + item.description.length, 0);
  setDensity(features, lists.features.length, featureChars, 5, 7);
  setDensity(included, lists.included.length, includedChars, 9, 13);
  if (lists.included.some(item => item.description.trim()) && included.dataset.density === 'normal') {
    included.dataset.density = 'compact';
  }
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
  scheduleAdaptiveLayout();
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
    input.addEventListener('focus', () => focusPreview(document.getElementById(`${name}Output`).children[index]));
    textarea.addEventListener('focus', () => focusPreview(document.getElementById(`${name}Output`).children[index]));
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
scheduleAdaptiveLayout();
fields.forEach(el => {
  el.value = saved[el.dataset.field] ?? el.value;
  render(el.dataset.field, el.value);
  el.addEventListener('input', () => { render(el.dataset.field, el.value); save(); });
  el.addEventListener('focus', () => focusFieldPreview(el.dataset.field));
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
