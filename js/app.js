/* --- LÓGICA ORIGINAL (app.js) --- */

const organizations = [
    { id: 'Obispado', name: 'Obispado', icon: 'shield-check', color: '#002e5d' },
    { id: 'Misional', name: 'Obra Misional', icon: 'send', color: '#3b82f6' },
    { id: 'Templo', name: 'Templo e Historia Familiar', icon: 'sprout', color: '#10b981' },
    { id: 'Dominical', name: 'Escuela Dominical', icon: 'book', color: '#f59e0b' },
    { id: 'SocSocorro', name: 'Sociedad de Socorro', icon: 'heart', color: '#be185d' },
    { id: 'Elderes', name: 'Quórum de Élderes', icon: 'briefcase', color: '#1e40af' },
    { id: 'JAS', name: 'Jovenes Adultos Solteros', icon: 'zap', color: '#565656ff' },
    { id: 'MujeresJovenes', name: 'Mujeres Jóvenes', icon: 'flower', color: '#7c3aed' },
    { id: 'HombresJovenes', name: 'Sacerdocio Aarónico', icon: 'award', color: '#047857' },
    { id: 'Primaria', name: 'Primaria', icon: 'smile', color: '#b45309' },
    { id: 'Seminario', name: 'Seminario', icon: 'book-open', color: '#c2410c' },
    { id: 'Instituto', name: 'Instituto', icon: 'graduation-cap', color: '#4338ca' }
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
    div.innerHTML = `
                <input type="date" class="w-full sm:w-32 doc-input font-bold text-slate-700">
                <input type="text" placeholder="Actividad..." class="flex-1 doc-input">
                <button onclick="this.parentElement.remove()" class="no-print remove-btn text-red-400"><i data-lucide="x" class="w-4 h-4"></i></button>
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
    const numPersonasInput = document.getElementById('num-personas-input');
    const costPerPersonDisplay = document.getElementById('cost-per-person');

    if (autoUpdateBudgetRecieved && tableTotal > 0) budgetInput.value = tableTotal.toFixed(2);

    const currentBudget = parseFloat(budgetInput.value) || 0;
    const currentSpent = spentInput.value.trim() !== "" ? parseFloat(spentInput.value) : null;
    const numPersonas = parseFloat(numPersonasInput.value) || 0;

    // Solo calcular si hay un valor ingresado en Gasto Ejecutado
    if (currentSpent !== null) {
        surplusInput.value = (currentBudget - currentSpent).toFixed(2);
        if (numPersonas > 0) {
            costPerPersonDisplay.innerText = (currentSpent / numPersonas).toFixed(2);
        } else {
            costPerPersonDisplay.innerText = "0.00";
        }
    } else {
        surplusInput.value = "";
        costPerPersonDisplay.innerText = "0.00";
    }
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


// --- DATOS Y FUNCIONES DE LLAMAMIENTOS ---

let currentOrgFilter = 'all';

const callingsData = [
    {
        id: 'Obispado', name: 'Obispado', color: '#002e5d', icon: 'shield',
        reference: 'Manual General, Cap. 7',
        callings: [
            {
                title: 'Obispo', icon: 'shield-check',
                duties: [
                    'Presidir, dirigir y organizar la obra del Señor en el barrio.',
                    'Ser el presidente del Sacerdocio Aarónico y del quórum de sacerdotes del barrio.',
                    'Ser el juez común en Israel para los miembros de su barrio.',
                    'Administrar los recursos de bienestar y supervisar el uso de los fondos del barrio.',
                    'Extender llamamientos y recomendar miembros para ordenanzas y recomendaciones de templo.',
                    'Dirigir el Consejo de Barrio y reunirse regularmente con su obispado.',
                    'Coordinar y apoyar el trabajo misional, de historia familiar y de bienestar.',
                    'Dar entrevistas de recomendación de templo, bautismo, misión y otras entrevistas de liderazgo.',
                    'Enseñar, capacitar y supervisar a todos los líderes del barrio.',
                ]
            },
            {
                title: 'Consejeros del Obispado', icon: 'users',
                duties: [
                    'Asistir al obispo en sus responsabilidades según se les asigne.',
                    'Presidir cuando el obispo esté ausente y se les haya dado autorización.',
                    'Supervisar organizaciones específicas asignadas por el obispo (ej. juventud, primaria).',
                    'Participar en entrevistas y consejos según las asignaciones recibidas.',
                    'Apoyar al obispo en la administración de los asuntos del barrio.',
                ]
            },
            {
                title: 'Secretario de Barrio', icon: 'file-text',
                duties: [
                    'Mantener registros precisos de membresía, asistencia y estadísticas del barrio.',
                    'Preparar y enviar informes estadísticos requeridos por la estaca.',
                    'Registrar actas de reuniones del obispado y del consejo de barrio.',
                    'Gestionar la transferencia de registros de membresía (entradas y salidas).',
                    'Mantener actualizados los datos de hogares y familias del barrio.',
                ]
            },
            {
                title: 'Secretario Ejecutivo', icon: 'calendar',
                duties: [
                    'Coordinar el calendario y agenda del obispado.',
                    'Organizar y programar entrevistas para el obispo y sus consejeros.',
                    'Servir de enlace de comunicación entre el obispado y los líderes del barrio.',
                    'Ayudar al obispo a preparar agendas para reuniones del obispado y el consejo.',
                    'Gestionar las comunicaciones recibidas de la estaca y sede de la Iglesia.',
                ]
            },
        ]
    },
    {
        id: 'Elderes', name: 'Quórum de Élderes', color: '#1e40af', icon: 'briefcase',
        reference: 'Manual General, Cap. 8',
        callings: [
            {
                title: 'Presidente del Quórum de Élderes', icon: 'star',
                duties: [
                    'Dirigir y organizar la obra del Señor entre los miembros varones adultos del barrio.',
                    'Supervisar la ministración entre los miembros del quórum y sus familias.',
                    'Trabajar con el obispado en esfuerzos de bienestar, retención y reactivación.',
                    'Ayudar en los esfuerzos misionales e integración de nuevos conversos varones.',
                    'Fortalecer a los jóvenes adultos varones al prepararse para el campo misional.',
                    'Orientar a los nuevos miembros varones que se mudaron al barrio.',
                    'Apoyar a los hermanos en sus responsabilidades de ministración asignadas.',
                    'Enseñar las doctrinas y principios del sacerdocio de Melquisedec.',
                ]
            },
            {
                title: 'Consejeros del Quórum de Élderes', icon: 'users',
                duties: [
                    'Apoyar al presidente en la dirección y administración del quórum.',
                    'Supervisar asignaciones específicas del quórum (ej. ministración, actividades).',
                    'Presidir cuando el presidente esté ausente.',
                    'Participar activamente en el comité de ministración del quórum.',
                ]
            },
            {
                title: 'Secretario del Quórum de Élderes', icon: 'file-text',
                duties: [
                    'Mantener registros de asistencia y membresía del quórum.',
                    'Coordinar y registrar las asignaciones de ministración mensualmente.',
                    'Preparar informes de participación para el obispado y la estaca.',
                    'Gestionar comunicaciones internas del quórum.',
                ]
            },
        ]
    },
    {
        id: 'SocSocorro', name: 'Sociedad de Socorro', color: '#be185d', icon: 'heart',
        reference: 'Manual General, Cap. 9',
        callings: [
            {
                title: 'Presidenta de la Sociedad de Socorro', icon: 'star',
                duties: [
                    'Dirigir y organizar la obra de la Sociedad de Socorro en el barrio.',
                    'Supervisar la ministración entre todas las hermanas del barrio.',
                    'Coordinar esfuerzos de bienestar, servicio y ayuda a familias necesitadas.',
                    'Trabajar con el obispado en los asuntos de bienestar del barrio.',
                    'Enseñar y capacitar a las hermanas en sus responsabilidades del evangelio.',
                    'Orientar y bienvenida a nuevas hermanas que se unen al barrio.',
                    'Apoyar el trabajo misional, historia familiar y asistencia al templo.',
                    'Llevar a cabo reuniones y actividades mensuales de la Sociedad de Socorro.',
                ]
            },
            {
                title: 'Consejeras de la Sociedad de Socorro', icon: 'users',
                duties: [
                    'Apoyar a la presidenta en todas sus responsabilidades.',
                    'Supervisar áreas específicas asignadas (ej. actividades, ministración, bienestar).',
                    'Presidir las reuniones cuando la presidenta esté ausente.',
                    'Acompañar a la presidenta en visitas de ministración y bienestar.',
                ]
            },
            {
                title: 'Secretaria de la Sociedad de Socorro', icon: 'file-text',
                duties: [
                    'Mantener registros de asistencia y datos de las hermanas.',
                    'Registrar actas de reuniones de presidencia.',
                    'Coordinar y registrar asignaciones de ministración mensualmente.',
                    'Preparar informes estadísticos para el obispado.',
                ]
            },
        ]
    },
    {
        id: 'MujeresJovenes', name: 'Mujeres Jóvenes', color: '#7c3aed', icon: 'flower',
        reference: 'Manual General, Cap. 11',
        callings: [
            {
                title: 'Presidenta de Mujeres Jóvenes', icon: 'star',
                duties: [
                    'Dirigir y organizar la obra entre las jóvenes del barrio (12–18 años).',
                    'Fortalecer la fe, el testimonio y los convenios de las jóvenes.',
                    'Coordinar el programa Para Jóvenes de la Iglesia con las jóvenes.',
                    'Trabajar junto a los padres en el desarrollo espiritual de sus hijas.',
                    'Preparar a las jóvenes para recibir ordenanzas del templo y servir misiones.',
                    'Planificar y supervisar actividades con propósito espiritual y de servicio.',
                    'Orientar a las jóvenes al transicionar a la Sociedad de Socorro (18 años).',
                    'Ministrar activamente a las jóvenes y sus familias.',
                ]
            },
            {
                title: 'Consejeras de Mujeres Jóvenes', icon: 'users',
                duties: [
                    'Apoyar a la presidenta en el trabajo con las jóvenes del barrio.',
                    'Supervisar grupos de edad o clases específicas asignadas.',
                    'Participar en la planificación y ejecución de todas las actividades.',
                    'Presidir en ausencia de la presidenta.',
                ]
            },
            {
                title: 'Secretaria de Mujeres Jóvenes', icon: 'file-text',
                duties: [
                    'Mantener registros de asistencia de todas las jóvenes.',
                    'Registrar el progreso en el programa Para Jóvenes.',
                    'Preparar informes para el obispado.',
                ]
            },
            {
                title: 'Maestras / Consejeras de Clase', icon: 'book',
                duties: [
                    'Enseñar lecciones dominicales edificantes a las jóvenes de su clase.',
                    'Desarrollar relaciones de mentoría y confianza con las jóvenes asignadas.',
                    'Participar activamente en actividades y campamentos de la organización.',
                    'Informar al liderazgo sobre las necesidades y situación de las jóvenes.',
                ]
            },
        ]
    },
    {
        id: 'HombresJovenes', name: 'Sacerdocio Aarónico', color: '#047857', icon: 'award',
        reference: 'Manual General, Cap. 10',
        callings: [
            {
                title: 'Presidente del Quórum de Diáconos', icon: 'star',
                duties: [
                    'Presidir y dirigir el quórum de diáconos (12–13 años) bajo la dirección del obispado.',
                    'Asignar a los diáconos para pasar la Santa Cena cada domingo.',
                    'Bienvenida y orientación a nuevos miembros del quórum.',
                    'Liderar el consejo del quórum de diáconos.',
                    'Recomendar candidatos para ordenaciones al sacerdocio.',
                ]
            },
            {
                title: 'Presidente del Quórum de Maestros', icon: 'star',
                duties: [
                    'Presidir y dirigir el quórum de maestros (14–15 años).',
                    'Supervisar la preparación de los emblemas de la Santa Cena.',
                    'Coordinar responsabilidades de mayordomía del templo.',
                    'Liderar el consejo del quórum de maestros.',
                    'Apoyar a los miembros del quórum en el servicio a los demás.',
                ]
            },
            {
                title: 'Presidente del Quórum de Sacerdotes', icon: 'shield-check',
                duties: [
                    'El obispo preside el quórum de sacerdotes (16–17 años) como presidente del quórum.',
                    'Supervisar la bendición y administración de la Santa Cena cada domingo.',
                    'Apoyar en el bautismo de nuevos miembros cuando se le solicite.',
                    'Preparar y orientar a los jóvenes para recibir el Sacerdocio de Melquisedec.',
                    'Motivar a los jóvenes a prepararse para servir una misión de tiempo completo.',
                ]
            },
            {
                title: 'Líder de Jóvenes Varones', icon: 'users',
                duties: [
                    'Apoyar al obispado en el trabajo y desarrollo espiritual con los jóvenes varones.',
                    'Planificar y supervisar actividades con propósito espiritual y de servicio.',
                    'Coordinar el programa Para Jóvenes de la Iglesia.',
                    'Trabajar con los padres en el desarrollo espiritual de sus hijos.',
                    'Ministrar a los jóvenes varones del barrio.',
                ]
            },
        ]
    },
    {
        id: 'Primaria', name: 'Primaria', color: '#b45309', icon: 'smile',
        reference: 'Manual General, Cap. 12',
        callings: [
            {
                title: 'Presidenta de Primaria', icon: 'star',
                duties: [
                    'Dirigir y organizar la obra de la Primaria en el barrio (niños de 3–11 años).',
                    'Fortalecer la fe, el testimonio y los convenios de los niños.',
                    'Trabajar con los padres para apoyar el desarrollo espiritual de sus hijos.',
                    'Supervisar las clases, actividades y programas de la Primaria.',
                    'Preparar a los niños para su transición a las organizaciones de juventud.',
                    'Coordinar la música y presentaciones especiales incluyendo el programa anual.',
                    'Ministrar activamente a los niños y sus familias en el barrio.',
                ]
            },
            {
                title: 'Consejeras de Primaria', icon: 'users',
                duties: [
                    'Apoyar a la presidenta en todas sus responsabilidades.',
                    'Supervisar grupos de edad o aulas específicas asignadas.',
                    'Coordinar actividades y programas de la Primaria.',
                    'Presidir en ausencia de la presidenta.',
                ]
            },
            {
                title: 'Secretaria de Primaria', icon: 'file-text',
                duties: [
                    'Mantener registros de asistencia de todos los niños.',
                    'Preparar informes estadísticos para el obispado.',
                    'Coordinar materiales, recursos de enseñanza y comunicaciones.',
                ]
            },
            {
                title: 'Maestros de Primaria', icon: 'book',
                duties: [
                    'Preparar y enseñar lecciones dominicales edificantes a los niños de su clase.',
                    'Crear un ambiente de aprendizaje espiritual, seguro y ameno.',
                    'Reportar al liderazgo sobre las necesidades individuales de los niños.',
                    'Coordinar con los padres sobre el progreso y bienestar de sus hijos.',
                ]
            },
            {
                title: 'Líder de Música de Primaria', icon: 'music',
                duties: [
                    'Dirigir la música en todas las reuniones de la Primaria.',
                    'Seleccionar himnos y canciones primarias apropiadas a cada ocasión.',
                    'Preparar el programa anual de Primaria con las canciones correspondientes.',
                    'Coordinar el acompañamiento al piano u otros instrumentos.',
                ]
            },
        ]
    },
    {
        id: 'Dominical', name: 'Escuela Dominical', color: '#d97706', icon: 'book',
        reference: 'Manual General, Cap. 13',
        callings: [
            {
                title: 'Presidente de la Escuela Dominical', icon: 'star',
                duties: [
                    'Presidir y dirigir la Escuela Dominical del barrio.',
                    'Supervisar la enseñanza del evangelio en todas las clases del domingo.',
                    'Reclutar, capacitar y apoyar continuamente a los maestros.',
                    'Asegurarse de que se utilicen los materiales de enseñanza aprobados por la Iglesia.',
                    'Trabajar con el obispado para fortalecer la enseñanza del evangelio en el barrio.',
                    'Organizar y supervisar clases para diferentes grupos de edad.',
                ]
            },
            {
                title: 'Consejeros de la Escuela Dominical', icon: 'users',
                duties: [
                    'Apoyar al presidente en la administración de la Escuela Dominical.',
                    'Supervisar clases o áreas de enseñanza específicas asignadas.',
                    'Presidir cuando el presidente esté ausente.',
                ]
            },
            {
                title: 'Maestros de la Escuela Dominical', icon: 'book-open',
                duties: [
                    'Preparar con diligencia y enseñar lecciones dominicales edificantes.',
                    'Estudiar las escrituras y materiales de estudio aprobados semanalmente.',
                    'Crear un ambiente de aprendizaje participativo, espiritual e inclusivo.',
                    'Asistir puntualmente y cubrir su responsabilidad de enseñanza.',
                    'Reportar ausencias recurrentes de estudiantes al liderazgo.',
                ]
            },
        ]
    },
    {
        id: 'Misional', name: 'Obra Misional', color: '#3b82f6', icon: 'send',
        reference: 'Manual General, Cap. 23',
        callings: [
            {
                title: 'Líder de la Obra Misional del Barrio', icon: 'star',
                duties: [
                    'Dirigir los esfuerzos misionales del barrio bajo la dirección del obispado.',
                    'Coordinar el trabajo con los misioneros de tiempo completo asignados al barrio.',
                    'Organizar enseñanzas del evangelio con investigadores y miembros presentes.',
                    'Identificar personas no miembros que puedan estar interesadas en el evangelio.',
                    'Apoyar la integración y retención de nuevos conversos al barrio.',
                    'Capacitar y motivar a los miembros para que compartan el evangelio.',
                    'Presentar informes misionales en el Consejo de Barrio mensualmente.',
                ]
            },
            {
                title: 'Misioneros de Barrio', icon: 'send',
                duties: [
                    'Compartir activamente el evangelio con vecinos, amigos y familiares.',
                    'Enseñar las lecciones del evangelio a investigadores cuando sea posible.',
                    'Acompañar a investigadores a las reuniones de la Iglesia.',
                    'Apoyar al líder de la obra misional en todos los esfuerzos del barrio.',
                ]
            },
        ]
    },
    {
        id: 'Templo', name: 'Templo e Historia Familiar', color: '#10b981', icon: 'sprout',
        reference: 'Manual General, Cap. 25',
        callings: [
            {
                title: 'Líder de Templo e Historia Familiar', icon: 'star',
                duties: [
                    'Dirigir los esfuerzos de historia familiar y trabajo de templo del barrio.',
                    'Motivar a los miembros a asistir regular y frecuentemente al templo.',
                    'Enseñar a los miembros a utilizar FamilySearch y herramientas digitales.',
                    'Ayudar a los miembros a identificar antepasados y realizar su trabajo vicario.',
                    'Coordinar eventos y actividades de historia familiar en el barrio.',
                    'Presentar informes y metas en el Consejo de Barrio.',
                ]
            },
            {
                title: 'Consultores de Historia Familiar', icon: 'search',
                duties: [
                    'Asistir a los miembros en su investigación genealógica personalizada.',
                    'Enseñar cómo usar FamilySearch y otras herramientas de historia familiar.',
                    'Ayudar a preparar nombres de antepasados para las ordenanzas del templo.',
                    'Organizar talleres y sesiones de capacitación de historia familiar en el barrio.',
                    'Trabajar especialmente con la juventud en proyectos de historia familiar.',
                ]
            },
        ]
    },
    {
        id: 'Seminario', name: 'Seminario e Instituto', color: '#c2410c', icon: 'graduation-cap',
        reference: 'Manual General, Cap. 16',
        callings: [
            {
                title: 'Maestro de Seminario', icon: 'book-open',
                duties: [
                    'Enseñar las escrituras de manera sistemática a los jóvenes de 14–18 años.',
                    'Preparar lecciones espirituales, edificantes y relevantes para cada clase.',
                    'Motivar a los jóvenes a estudiar, aplicar y memorizar versículos de dominio.',
                    'Reportar la asistencia diaria al coordinador de seminario del barrio o estaca.',
                    'Trabajar con los padres y el obispado para apoyar a los jóvenes.',
                    'Crear un ambiente espiritual de aprendizaje y seguridad emocional.',
                ]
            },
            {
                title: 'Coordinador de Seminario e Instituto', icon: 'star',
                duties: [
                    'Supervisar y apoyar a todos los maestros de seminario del barrio.',
                    'Coordinar con el obispado y los padres el progreso de los jóvenes.',
                    'Gestionar registros de asistencia y créditos de los estudiantes.',
                    'Promover la participación activa y puntual en el programa de seminario.',
                ]
            },
        ]
    },
];

function openCallings() {
    openTool('llamamiento-tool');
    currentOrgFilter = 'all';
    document.getElementById('calling-search').value = '';
    renderOrgPills('all');
    renderCallings('all');
}

function renderOrgPills(activeId) {
    const container = document.getElementById('calling-org-pills');
    const allOrgs = [{ id: 'all', name: 'Todos', color: '#002e5d' }, ...callingsData];
    container.innerHTML = allOrgs.map(org => {
        const isActive = activeId === org.id;
        return `<button onclick="selectCallingOrg('${org.id}')"
            class="calling-pill ${isActive ? 'calling-pill-active' : ''}"
            style="${isActive ? `background:${org.color};color:white;border-color:${org.color};` : ''}">
            ${org.name}
        </button>`;
    }).join('');
}

function selectCallingOrg(orgId) {
    currentOrgFilter = orgId;
    document.getElementById('calling-search').value = '';
    renderOrgPills(orgId);
    renderCallings(orgId);
}

function filterCallings(query) {
    renderCallings(currentOrgFilter, query);
}

function renderCallings(orgId, searchQuery = '') {
    const container = document.getElementById('callings-container');
    const q = searchQuery.trim().toLowerCase();
    let orgsToShow = orgId === 'all' ? callingsData : callingsData.filter(o => o.id === orgId);

    if (q) {
        orgsToShow = orgsToShow.map(org => ({
            ...org,
            callings: org.callings.filter(c =>
                c.title.toLowerCase().includes(q) ||
                c.duties.some(d => d.toLowerCase().includes(q))
            )
        })).filter(org => org.callings.length > 0);
    }

    if (orgsToShow.length === 0) {
        container.innerHTML = `<div class="text-center py-14 text-slate-400">
            <div class="text-4xl mb-3">🔍</div>
            <p class="text-sm font-bold">No se encontraron resultados</p>
            <p class="text-xs mt-1">Intenta con otro término de búsqueda</p>
        </div>`;
        return;
    }

    container.innerHTML = orgsToShow.map(org => `
        <div class="glass-card overflow-hidden">
            <div class="p-4 flex items-center gap-3" style="background:${org.color};">
                <div class="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                    <i data-lucide="${org.icon}" class="w-4 h-4 text-white"></i>
                </div>
                <div>
                    <h3 class="text-white font-black uppercase text-sm tracking-tight">${org.name}</h3>
                    <p class="text-white/60 text-[9px] uppercase tracking-widest">${org.reference}</p>
                </div>
            </div>
            <div class="divide-y divide-slate-50">
                ${org.callings.map(calling => `
                    <div class="calling-item" onclick="toggleCalling(this)">
                        <div class="p-4 flex items-center justify-between cursor-pointer select-none">
                            <div class="flex items-center gap-3">
                                <div class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                                    style="background:${org.color}18;">
                                    <i data-lucide="${calling.icon}" class="w-3.5 h-3.5" style="color:${org.color};"></i>
                                </div>
                                <span class="font-black text-slate-700 text-xs uppercase tracking-tight">${calling.title}</span>
                            </div>
                            <i data-lucide="chevron-down" class="w-4 h-4 text-slate-400 calling-chevron transition-transform shrink-0"></i>
                        </div>
                        <div class="calling-duties hidden px-4 pb-4">
                            <div class="rounded-xl p-4 space-y-2.5" style="background:${org.color}08; border:1px solid ${org.color}18;">
                                <p class="text-[9px] font-black uppercase tracking-widest mb-3" style="color:${org.color};">
                                    Obligaciones y Responsabilidades
                                </p>
                                ${calling.duties.map(duty => `
                                    <div class="flex gap-2.5 items-start">
                                        <div class="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style="background:${org.color};"></div>
                                        <p class="text-xs text-slate-600 leading-relaxed">${duty}</p>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');

    initIcons();
}

function toggleCalling(el) {
    const duties = el.querySelector('.calling-duties');
    const chevron = el.querySelector('.calling-chevron');
    const isOpen = !duties.classList.contains('hidden');
    if (isOpen) {
        duties.classList.add('hidden');
        chevron.style.transform = '';
    } else {
        duties.classList.remove('hidden');
        chevron.style.transform = 'rotate(180deg)';
    }
}

window.onload = () => {

    // Populate Budget Organizations Select
    const budgetOrgSelect = document.getElementById('budget-org-combo-box');
    if (budgetOrgSelect) {
        organizations.forEach(org => {
            const opt = document.createElement('option');
            opt.value = org.id; opt.text = org.name;
            budgetOrgSelect.appendChild(opt);
        });
    }

    for (let i = 0; i < 8; i++) addRow();
    showMenu();
};