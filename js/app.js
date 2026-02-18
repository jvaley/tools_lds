/* --- LÓGICA ORIGINAL (app.js) --- */

const organizations = [
    { id: 'Obispado', name: 'Obispado', icon: 'shield-check', color: '#002e5d' },
    { id: 'Misional', name: 'Obra Misional', icon: 'send', color: '#3b82f6' },
    { id: 'Templo', name: 'Templo e Historia Familiar', icon: 'sprout', color: '#10b981' },
    { id: 'Dominical', name: 'Escuela Dominical', icon: 'book', color: '#f59e0b' },
    { id: 'SocSocorro', name: 'Sociedad de Socorro', icon: 'heart', color: '#be185d' },
    { id: 'Elderes', name: 'Quórum de Élderes', icon: 'briefcase', color: '#1e40af' },
    { id: 'MujeresJovenes', name: 'Mujeres Jóvenes', icon: 'flower', color: '#7c3aed' },
    { id: 'HombresJovenes', name: 'Sacerdocio Aarónico', icon: 'award', color: '#047857' },
    { id: 'Primaria', name: 'Primaria', icon: 'smile', color: '#b45309' }
];

function initIcons() { lucide.createIcons(); }

function showMenu() {
    document.querySelectorAll('main > div').forEach(d => d.classList.add('hidden'));
    document.getElementById('main-menu').classList.remove('hidden');
}

function openTool(id) {
    document.querySelectorAll('main > div').forEach(d => d.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    if (id === 'planificador-tool') renderOrgComboBox();
    initIcons();
}

// --- FUNCIONES DE AGENDAS ---

function setupAgenda(title, filename) {
    document.getElementById('agenda-title-display').innerText = title;
    document.getElementById('agenda-pdf-btn').onclick = () => exportToPDF('agenda-print-area', filename);
    openTool('agenda-tool');
}

function openObispadoAgenda() {
    setupAgenda('Reunión de Obispado', 'Agenda_Obispado');
    const container = document.getElementById('agenda-dynamic-content');
    container.innerHTML = `
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><span class="doc-label">Primera Oración</span><input type="text" class="doc-input"></div>
                    <div><span class="doc-label">Pensamiento Espiritual</span><input type="text" class="doc-input"></div>
                </div>
                <div class="agenda-box">
                    <span class="doc-label text-blue-800">Instrucciones y Agenda Sacramental</span>
                    <textarea class="doc-input h-20" placeholder="Revisar programa del domingo..."></textarea>
                </div>
                <div class="space-y-4">
                    <h4 class="text-[10px] font-black uppercase text-slate-400 border-b">Informe de Mayordomías</h4>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><span class="doc-label">Obispo</span><textarea class="doc-input h-10"></textarea></div>
                        <div><span class="doc-label">1er Consejero</span><textarea class="doc-input h-10"></textarea></div>
                        <div><span class="doc-label">2do Consejero</span><textarea class="doc-input h-10"></textarea></div>
                        <div><span class="doc-label">Secretarios</span><textarea class="doc-input h-10"></textarea></div>
                    </div>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div class="agenda-box"><span class="doc-label">Llamamientos y Relevos</span><textarea class="doc-input h-20"></textarea></div>
                    <div class="agenda-box"><span class="doc-label">Asuntos Administrativos</span><textarea class="doc-input h-20"></textarea></div>
                </div>
                <div><span class="doc-label">Oración Final</span><input type="text" class="doc-input"></div>
            `;
    initIcons();
}

function openSacramentalAgenda(mode) {
    setupAgenda(mode === 'Testimonios' ? 'Reunión de Testimonios' : 'Reunión Sacramental', 'Agenda_Sacramental');
    const container = document.getElementById('agenda-dynamic-content');
    let html = `
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><span class="doc-label">Preside</span><input type="text" class="doc-input"></div>
                    <div><span class="doc-label">Dirige</span><input type="text" class="doc-input"></div>
                </div>
                <div class="agenda-box">
                    <span class="doc-label text-blue-800">Anuncios de Barrio y Estaca</span>
                    <textarea class="doc-input h-10" placeholder="Lectura de anuncios importantes..."></textarea>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><span class="doc-label">Himno de Apertura</span><input type="text" class="doc-input"></div>
                    <div><span class="doc-label">Primera Oración</span><input type="text" class="doc-input"></div>
                </div>
                <div class="agenda-box">
                    <span class="doc-label">Asuntos Locales (Sostenimientos/Relevos)</span>
                    <textarea class="doc-input h-14"></textarea>
                </div>
                <div><span class="doc-label">Himno Sacramental</span><input type="text" class="doc-input font-bold text-blue-800"></div>
                <div class="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <span class="doc-label text-slate-500 mb-2">Servicio de la Santa Cena</span>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input type="text" class="doc-input" placeholder="Bendicen...">
                        <input type="text" class="doc-input" placeholder="Reparten...">
                    </div>
                </div>
            `;
    if (mode === 'Testimonios') {
        html += `<div class="bg-rose-50 p-5 rounded-xl border border-rose-100"><p class="text-[10px] text-rose-700 font-bold italic">Tiempo para compartir testimonios breves del Salvador.</p></div>`;
    } else {
        html += `<div class="agenda-box"><div class="flex justify-between items-center mb-2"><span class="doc-label">Discursos</span><button onclick="addPointToAgenda('dis-list')" class="no-print text-[7px] font-black bg-white px-2 py-1 rounded shadow-sm">+ AGREGAR</button></div><div id="dis-list" class="space-y-2"></div></div>`;
    }
    html += `<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2"><div><span class="doc-label">Himno de Clausura</span><input type="text" class="doc-input"></div><div><span class="doc-label">Última Oración</span><input type="text" class="doc-input"></div></div>`;
    container.innerHTML = html;
    if (mode !== 'Testimonios') { addPointToAgenda('dis-list'); addPointToAgenda('dis-list'); }
    initIcons();
}

function openCouncilAgenda() {
    setupAgenda('Consejo de Barrio', 'Agenda_Consejo_Barrio');
    const container = document.getElementById('agenda-dynamic-content');
    container.innerHTML = `
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><span class="doc-label">Dirige</span><input type="text" class="doc-input"></div>
                    <div><span class="doc-label">Primera Oración</span><input type="text" class="doc-input"></div>
                </div>
                <div class="bg-emerald-50 p-5 rounded-xl border border-emerald-100">
                    <h3 class="text-[10px] font-black text-emerald-800 uppercase mb-3">Enfoque en Ministración</h3>
                    <textarea class="doc-input border-emerald-200 h-20" placeholder="¿Cómo podemos ayudar a las familias necesitadas o menos activas?"></textarea>
                </div>
                <div class="space-y-4">
                    <div class="flex justify-between items-center"><span class="doc-label">Calendario de Actividades</span><button onclick="addPointToAgenda('cal-list')" class="no-print text-[7px] font-black bg-white px-2 py-1 rounded shadow-sm">+ EVENTO</button></div>
                    <div id="cal-list" class="space-y-2"></div>
                </div>
                <div class="agenda-box">
                    <span class="doc-label">Asuntos de Bienestar y Jóvenes</span>
                    <textarea class="doc-input h-20" placeholder="Necesidades específicas detectadas..."></textarea>
                </div>
                <div><span class="doc-label">Última Oración</span><input type="text" class="doc-input"></div>
            `;
    addPointToAgenda('cal-list');
    initIcons();
}

function openBaptismAgenda() {
    setupAgenda('Servicio Bautismal', 'Agenda_Bautismo');
    const container = document.getElementById('agenda-dynamic-content');
    container.innerHTML = `
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div><span class="doc-label">Nombre del Candidato</span><input type="text" class="doc-input font-bold text-cyan-800"></div>
                    <div><span class="doc-label">Fecha y Hora</span><input type="text" class="doc-input" placeholder="Sábado 16:00"></div>
                </div>
                <div class="space-y-3">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><span class="doc-label">Dirige</span><input type="text" class="doc-input"></div>
                        <div><span class="doc-label">Música (Pianista/Director)</span><input type="text" class="doc-input"></div>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><span class="doc-label">Himno de Apertura</span><input type="text" class="doc-input"></div>
                        <div><span class="doc-label">Primera Oración</span><input type="text" class="doc-input"></div>
                    </div>
                </div>
                <div class="bg-cyan-50 p-5 rounded-xl border border-cyan-100">
                    <h4 class="text-[9px] font-black text-cyan-700 uppercase mb-3">Programa de la Ordenanza</h4>
                    <div class="space-y-3">
                        <div class="flex gap-2"><span class="text-[9px] font-bold w-32 uppercase text-slate-400">Mensaje (Bautismo)</span><input type="text" class="doc-input flex-1"></div>
                        <div class="flex gap-2"><span class="text-[9px] font-bold w-32 uppercase text-slate-400">Ordenanza por</span><input type="text" class="doc-input flex-1"></div>
                        <div class="flex gap-2"><span class="text-[9px] font-bold w-32 uppercase text-slate-400">Mensaje (Esp. Santo)</span><input type="text" class="doc-input flex-1"></div>
                    </div>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><span class="doc-label">Himno de Clausura</span><input type="text" class="doc-input"></div>
                    <div><span class="doc-label">Última Oración</span><input type="text" class="doc-input"></div>
                </div>
                <div class="agenda-box text-center italic text-slate-400 text-[10px]">
                    Recordar a los participantes traer ropa blanca y toallas.
                </div>
            `;
    initIcons();
}

function openGenericAgenda(type) {
    setupAgenda('Agenda: ' + type, 'Agenda_Generic');
    const container = document.getElementById('agenda-dynamic-content');
    container.innerHTML = `
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><span class="doc-label">Lugar / Plataforma</span><input type="text" class="doc-input" placeholder="Capilla / Zoom"></div>
                    <div><span class="doc-label">Hora</span><input type="time" class="doc-input"></div>
                </div>
                <div class="agenda-box">
                    <span class="doc-label">Temas a Tratar</span>
                    <div id="generic-list" class="space-y-2 mt-2"></div>
                    <button onclick="addPointToAgenda('generic-list')" class="no-print mt-3 text-[9px] font-bold text-blue-500 uppercase flex items-center"><i data-lucide="plus" class="w-3 h-3 mr-1"></i> Añadir Punto</button>
                </div>
                <div><span class="doc-label">Asignaciones / Acuerdos</span><textarea class="doc-input h-32"></textarea></div>
            `;
    for (let i = 0; i < 3; i++) addPointToAgenda('generic-list');
    initIcons();
}

function addPointToAgenda(listId) {
    const list = document.getElementById(listId);
    if (!list) return;
    const div = document.createElement('div');
    div.className = "flex gap-2 group items-center mb-1";
    div.innerHTML = `<i data-lucide="circle" class="w-2 h-2 text-slate-300"></i><input type="text" class="doc-input flex-1" placeholder="Detalle..."><button onclick="this.closest('.group').remove()" class="no-print remove-btn text-red-300"><i data-lucide="x" class="w-3 h-3"></i></button>`;
    list.appendChild(div);
    initIcons();
}

// --- FUNCIONES DE LIQUIDACIÓN Y PLANIFICADOR ---

function renderOrgComboBox() {
    const select = document.getElementById('org-combo-box');
    if (select.options.length > 0) return;
    organizations.forEach(org => {
        const opt = document.createElement('option');
        opt.value = org.id; opt.text = org.name;
        select.appendChild(opt);
    });
    switchOrg(organizations[0].id);
}

function switchOrg(id) {
    const org = organizations.find(o => o.id === id);
    document.documentElement.style.setProperty('--org-color', org.color);
    document.getElementById('display-org-name').innerText = org.name;
    document.getElementById('org-icon-frame').innerHTML = `<i data-lucide="${org.icon}" class="w-5 h-5"></i>`;
    document.getElementById('org-goals-container').innerHTML = '';
    addGoalField("Fomentar la participación en la ordenanza de la Santa Cena.");
    addGoalField("Aumentar la ministración a las familias menos activas.");
    document.getElementById('org-indicators-container').innerHTML = '';
    addIndicatorField("Asistencia", "0%");
    addIndicatorField("Ministración", "0%");
    const grid = document.getElementById('org-calendar-grid');
    grid.innerHTML = '';
    ['Ene - Mar', 'Abr - Jun', 'Jul - Sep', 'Oct - Dic'].forEach(t => {
        const div = document.createElement('div');
        div.className = "bg-slate-50 p-4 rounded-xl border border-slate-100";
        const trimId = t.replace(/\s/g, '').replace(/-/g, '');
        div.innerHTML = `<div class="flex justify-between items-center border-b pb-1 mb-2"><span class="text-[8px] font-black text-slate-400 uppercase tracking-widest">${t}</span><button onclick="addCalItem('${trimId}')" class="no-print text-blue-500"><i data-lucide="plus" class="w-3 h-3"></i></button></div><div id="list-${trimId}" class="space-y-2"></div>`;
        grid.appendChild(div);
        addCalItem(trimId);
    });
    initIcons();
}

function addGoalField(val = "") {
    const container = document.getElementById('org-goals-container');
    const div = document.createElement('div');
    div.className = "group flex items-start space-x-2 mb-1";
    div.innerHTML = `<i data-lucide="circle" class="w-2 h-2 mt-2 text-slate-300"></i><textarea class="doc-input text-[11px] italic flex-1 p-1 h-8 resize-none" placeholder="Escriba meta...">${val}</textarea><button onclick="this.parentElement.remove()" class="no-print remove-btn text-red-300"><i data-lucide="trash-2" class="w-3 h-3"></i></button>`;
    container.appendChild(div);
    initIcons();
}

function addIndicatorField(label = "Indicador", val = "0%") {
    const container = document.getElementById('org-indicators-container');
    const div = document.createElement('div');
    div.className = "group flex justify-between items-center gap-2 mb-1";
    div.innerHTML = `<input type="text" class="text-[9px] font-bold uppercase text-slate-500 bg-transparent border-none p-0 w-full" value="${label}"><input type="text" class="w-12 text-right font-black text-[11px] doc-input p-1" value="${val}"><button onclick="this.parentElement.remove()" class="no-print remove-btn text-red-300"><i data-lucide="x" class="w-3 h-3"></i></button>`;
    container.appendChild(div);
    initIcons();
}

function addCalItem(trimId) {
    const list = document.getElementById(`list-${trimId}`);
    const div = document.createElement('div');
    div.className = "group flex gap-2 items-center mb-1";
    /* MODIFICACIÓN SOLICITADA:
       Se han cambiado los inputs. Antes había uno para 'Día', ahora hay dos: 'Día' y 'Mes'.
       Se usa la clase 'cal-input' para que tenga borde visible y fondo blanco.
    */
    div.innerHTML = `
                <input type="text" placeholder="Día" class="w-8 text-[9px] font-bold text-center cal-input">
                <input type="text" placeholder="Mes" class="w-8 text-[9px] font-bold text-center cal-input">
                <input type="text" placeholder="Actividad..." class="flex-1 text-[9px] cal-input">
                <button onclick="this.parentElement.remove()" class="no-print remove-btn text-red-300"><i data-lucide="x" class="w-3 h-3"></i></button>
            `;
    list.appendChild(div);
    initIcons();
}

function addRow() {
    const tr = document.createElement('tr');
    tr.className = "group border-b border-slate-50";
    tr.innerHTML = `<td class="py-1"><input type="text" class="doc-input w-full text-xs"></td><td class="py-1"><input type="number" class="qty doc-input w-full text-right text-xs" oninput="calculateBudget(true)"></td><td class="py-1"><input type="number" step="0.01" class="price doc-input w-full text-right text-xs font-bold" oninput="calculateBudget(true)"></td><td class="py-1 text-right font-black text-xs text-slate-400"><span class="subtotal"></span></td><td class="py-1 no-print text-center"><button onclick="this.closest('tr').remove(); calculateBudget(true)" class="remove-btn text-red-400"><i data-lucide="x" class="w-3 h-3"></i></button></td>`;
    document.getElementById('budget-body').appendChild(tr);
    initIcons();
}

function calculateBudget(autoUpdateBudgetRecieved = true) {
    let tableTotal = 0;
    document.querySelectorAll('#budget-body tr').forEach(row => {
        const q = parseFloat(row.querySelector('.qty').value) || 0;
        const p = parseFloat(row.querySelector('.price').value) || 0;
        const sub = q * p;
        row.querySelector('.subtotal').innerText = sub > 0 ? "Q" + sub.toFixed(2) : "";
        tableTotal += sub;
    });
    const budgetInput = document.getElementById('budget-received-total-input');
    const spentInput = document.getElementById('actual-spent-input');
    const surplusInput = document.getElementById('total-surplus-input');
    if (autoUpdateBudgetRecieved && tableTotal > 0) budgetInput.value = tableTotal.toFixed(2);
    const currentBudget = parseFloat(budgetInput.value) || 0;
    const currentSpent = parseFloat(spentInput.value) || 0;
    surplusInput.value = (currentBudget - currentSpent).toFixed(2);
}

function exportToPDF(id, name) {
    const element = document.getElementById(id);

    // Guardar estado
    const originalWidth = element.style.width;

    // Activar modo PDF
    element.classList.add('pdf-export');
    element.style.width = '850px';

    const opt = {
        margin: [10, 10, 10, 10],
        filename: `${name}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            //windowWidth: 1200,   // 🔥 CLAVE
            width: 850
        },
        jsPDF: {
            unit: 'mm',
            format: 'a4',
            orientation: 'portrait'
        }
    };

    html2pdf()
        .set(opt)
        .from(element)
        .save()
        .then(() => {
            // Restaurar estado
            element.classList.remove('pdf-export');
            element.style.width = originalWidth;
        });
}

        
    window.onload = () => {
        for (let i = 0; i < 8; i++) addRow();
        showMenu();
    };