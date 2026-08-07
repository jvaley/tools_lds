// =====================================================
// PLAN DE BARRIO MISIONAL — Scripts
// =====================================================

const PDF_PAGE_HEIGHT_MM = 297;
const PDF_SHEET_WIDTH_MM = 210;
const PDF_PADDING_TOP_MM = 10;
const PDF_PADDING_X_MM = 10;
const PDF_PADDING_BOTTOM_MM = 10;
const PLAN_STATE_ENDPOINT = '/api/plan-state';
const PLAN_LOCAL_STORAGE_KEY = 'herramientas-sud-plan-misional';
const IS_INTEGRATED_PLAN = window.location.pathname.includes('/obra-misional/');
const AUTO_SAVE_DELAY_MS = 900;
const VIEW_CONFIG = {
    dashboard: {
        title: 'Plan Misional — Barrio Milagro',
        exportId: 'main-plan-content',
        exportFileName: 'Plan-Misional-Barrio'
    },
    'agenda-coordinacion': {
        title: 'Agenda de Coordinación Misional — Barrio Milagro',
        exportId: 'page-agenda-coordinacion',
        exportFileName: 'Agenda-Coordinacion'
    },
    'agenda-bautismo': {
        title: 'Programa del Servicio Bautismal — Barrio Milagro',
        exportId: 'page-agenda-bautismo',
        exportFileName: 'Programa-Bautismal'
    }
};

let autoSaveTimer = null;
let isHydratingState = false;
let lastSavedStateString = '';

function renderLucideIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons({
            attrs: {
                'stroke-width': 1.8
            }
        });
    }
}

function getCurrentView() {
    const pageParam = new URLSearchParams(window.location.search).get('page');
    if (pageParam && Object.prototype.hasOwnProperty.call(VIEW_CONFIG, pageParam)) {
        return pageParam;
    }

    return 'dashboard';
}

function getCurrentViewConfig() {
    return VIEW_CONFIG[getCurrentView()] || VIEW_CONFIG.dashboard;
}

function applyCurrentView() {
    const currentView = getCurrentView();
    const currentViewConfig = getCurrentViewConfig();

    document.body.dataset.currentView = currentView;
    document.title = currentViewConfig.title;

    document.querySelectorAll('.app-view').forEach((view) => {
        view.hidden = view.dataset.view !== currentView;
    });

    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    const root = document.documentElement;
    const previousBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    root.scrollTop = 0;
    document.body.scrollTop = 0;
    window.scrollTo(0, 0);
    requestAnimationFrame(() => window.scrollTo(0, 0));
    setTimeout(() => {
        window.scrollTo(0, 0);
        root.style.scrollBehavior = previousBehavior;
    }, 120);
}

function exportCurrentView() {
    const currentViewConfig = getCurrentViewConfig();
    return generatePDF(currentViewConfig.exportId, currentViewConfig.exportFileName);
}

function escapeReportHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatReportDate(value) {
    if (!value) return 'Sin fecha';
    const date = new Date(`${value}T12:00:00`);
    if (Number.isNaN(date.getTime())) return escapeReportHtml(value);
    return date.toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' });
}

function buildPlanReportHtml(source) {
    const metrics = [
        { id: 'bautismos', label: 'Bautismos', period: 'Meta anual', target: 18, accent: '#0077FF' },
        { id: 'lecciones', label: 'Lecciones con miembro', period: 'Meta semanal', target: 12, accent: '#25A66A' },
        { id: 'ref', label: 'Referencias', period: 'Meta mensual', target: 10, accent: '#D97706' },
        { id: 'asistencia', label: 'Asistencia sacramental', period: 'Meta dominical', target: 150, accent: '#64748B' }
    ].map((metric) => {
        const input = source.querySelector(`#val-${metric.id}`);
        const value = Math.max(0, Number(input?.value) || 0);
        const percent = Math.min(100, Math.round((value / metric.target) * 100));
        return { ...metric, value, percent };
    });

    const actions = Array.from(source.querySelectorAll('#actions-table tr')).map((row, index) => {
        const action = row.querySelector('td[data-label="Acción"] textarea')?.value.trim() || '';
        const responsible = row.querySelector('td[data-label="Responsable"] input')?.value.trim() || '';
        const deadline = row.querySelector('td[data-label="Plazo"] input')?.value || '';
        const complete = Boolean(row.querySelector('td[data-label="Hecho"] input')?.checked);
        return { index: index + 1, action, responsible, deadline, complete };
    }).filter((item) => item.action || item.responsible || item.deadline);

    const completedActions = actions.filter((item) => item.complete).length;
    const completionPercent = actions.length ? Math.round((completedActions / actions.length) * 100) : 0;
    const issuedAt = new Intl.DateTimeFormat('es-GT', {
        day: '2-digit', month: 'long', year: 'numeric'
    }).format(new Date());

    const metricCards = metrics.map((metric, index) => `
        <article class="report-metric" style="--report-accent:${metric.accent};">
            <div class="report-metric-index">0${index + 1}</div>
            <div class="report-metric-copy">
                <span class="report-metric-label">${metric.label}</span>
                <small>${metric.period}</small>
            </div>
            <div class="report-metric-value"><b>${metric.value}</b><span>/ ${metric.target}</span></div>
            <div class="report-metric-progress">
                <div class="report-progress"><i style="width:${metric.percent}%;"></i></div>
                <strong>${metric.percent}%</strong>
            </div>
        </article>
    `).join('');

    const actionRows = (actions.length ? actions : [{
        index: 1, action: 'No se han registrado acciones.', responsible: '', deadline: '', complete: false
    }]).map((item) => `
        <tr>
            <td class="report-row-index">${item.index}</td>
            <td><div class="report-action-name">${escapeReportHtml(item.action || 'Acción pendiente de definir')}</div></td>
            <td>${escapeReportHtml(item.responsible || 'Por asignar')}</td>
            <td>${formatReportDate(item.deadline)}</td>
            <td class="report-status-cell"><span class="report-status ${item.complete ? 'is-complete' : ''}">${item.complete ? 'Completada' : 'Pendiente'}</span></td>
        </tr>
    `).join('');

    return `
        <div class="plan-report">
            <header class="institucional-header report-cover">
                <div class="report-brand-row">
                    <div class="report-mark">PM</div>
                    <div>
                        <span class="report-overline">Informe ejecutivo · 2026</span>
                        <h1>Reporte del Plan Misional</h1>
                        <p>Barrio Milagro · Estaca Milagro</p>
                    </div>
                </div>
                <div class="report-issued"><span>Actualizado</span><strong>${issuedAt}</strong><em>Documento de seguimiento</em></div>
            </header>

            <section id="section-metas" class="report-summary">
                <div class="report-section-heading">
                    <div><span>01 · Resumen ejecutivo</span><h2>Indicadores principales</h2></div>
                    <p>Avance registrado al momento de generar este reporte.</p>
                </div>
                <div class="report-metrics-grid">${metricCards}</div>
                <div class="report-action-summary">
                    <div><span>Acciones registradas</span><strong>${actions.length}</strong></div>
                    <div><span>Completadas</span><strong>${completedActions}</strong></div>
                    <div><span>Pendientes</span><strong>${Math.max(0, actions.length - completedActions)}</strong></div>
                    <div class="report-total-progress"><span>Avance del plan</span><strong>${completionPercent}%</strong></div>
                </div>
                <div class="report-insight">
                    <strong>Lectura del reporte</strong>
                    <p>Los indicadores muestran el progreso contra la meta definida. La matriz siguiente concentra responsables, fechas y estado de cumplimiento para facilitar la coordinación.</p>
                </div>
            </section>

            <section id="section-matriz" class="report-actions" data-force-new-page-before="true">
                <div class="card">
                    <div class="report-section-heading">
                        <div><span>02 · Ejecución</span><h2 class="section-label">Matriz de acciones</h2></div>
                        <p class="section-subtitle">${completedActions} de ${actions.length} acciones completadas</p>
                    </div>
                    <div class="table-responsive">
                        <table class="actions-table report-actions-table">
                            <thead><tr><th>#</th><th>Acción prioritaria</th><th>Responsable</th><th>Plazo</th><th>Estado</th></tr></thead>
                            <tbody id="actions-table">${actionRows}</tbody>
                        </table>
                    </div>
                </div>
            </section>
        </div>
    `;
}

function createMatrixSectionChunk(doc, matrixSection, headerContent, tableHead, rows, isContinuation) {
    const section = doc.createElement('section');
    section.id = 'section-matriz';
    section.style.marginBottom = '32px';

    const card = doc.createElement('div');
    card.className = 'card';
    card.style.padding = '24px';

    const header = headerContent.cloneNode(true);
    const title = header.querySelector('.section-label');
    const subtitle = header.querySelector('.section-subtitle');
    const actionButton = header.querySelector('button');

    if (actionButton) actionButton.remove();
    if (isContinuation && title) title.textContent = 'Matriz de Acciones';
    if (isContinuation && subtitle) subtitle.textContent = 'Continuación del plan de acción';

    const tableResponsive = doc.createElement('div');
    tableResponsive.className = 'table-responsive';

    const table = doc.createElement('table');
    table.className = matrixSection.classList.contains('report-actions')
        ? 'actions-table report-actions-table'
        : 'actions-table';
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';

    if (tableHead) {
        table.appendChild(tableHead.cloneNode(true));
    }

    const tbody = doc.createElement('tbody');
    tbody.id = isContinuation ? '' : 'actions-table';
    rows.forEach((row) => tbody.appendChild(row.cloneNode(true)));
    table.appendChild(tbody);

    tableResponsive.appendChild(table);
    card.appendChild(header);
    card.appendChild(tableResponsive);
    section.appendChild(card);

    if (!isContinuation || matrixSection.classList.contains('report-actions')) {
        section.dataset.forceNewPageBefore = 'true';
    }

    return section;
}

function getMatrixSectionChunks(doc, matrixSection, contentLimitPx) {
    if (!matrixSection) return [];

    const headerContent = matrixSection.querySelector('.card > div');
    const table = matrixSection.querySelector('.actions-table');
    const tableHead = table?.querySelector('thead');
    const rows = Array.from(table?.querySelectorAll('tbody tr') || []);

    if (!headerContent || !table || !rows.length) {
        matrixSection.dataset.forceNewPageBefore = 'true';
        return [matrixSection];
    }

    if (matrixSection.classList.contains('report-actions')) {
        const chunks = [];
        for (let index = 0; index < rows.length; index += 4) {
            chunks.push(createMatrixSectionChunk(
                doc,
                matrixSection,
                headerContent,
                tableHead,
                rows.slice(index, index + 4),
                index > 0
            ));
        }
        return chunks;
    }

    const measurementRoot = doc.createElement('div');
    measurementRoot.style.position = 'absolute';
    measurementRoot.style.visibility = 'hidden';
    measurementRoot.style.pointerEvents = 'none';
    measurementRoot.style.left = '-9999px';
    measurementRoot.style.top = '0';
    measurementRoot.style.width = `${PDF_SHEET_WIDTH_MM - (PDF_PADDING_X_MM * 2)}mm`;
    measurementRoot.style.boxSizing = 'border-box';
    measurementRoot.style.zIndex = '-1';
    doc.body.appendChild(measurementRoot);

    const chunks = [];
    let currentRows = [];

    rows.forEach((row) => {
        const candidateRows = [...currentRows, row];
        const probe = createMatrixSectionChunk(
            doc,
            matrixSection,
            headerContent,
            tableHead,
            candidateRows,
            chunks.length > 0
        );

        measurementRoot.replaceChildren(probe);
        const measuredHeight = Math.ceil(probe.getBoundingClientRect().height);

        if (measuredHeight > contentLimitPx && currentRows.length > 0) {
            chunks.push(
                createMatrixSectionChunk(
                    doc,
                    matrixSection,
                    headerContent,
                    tableHead,
                    currentRows,
                    chunks.length > 0
                )
            );
            currentRows = [row];
            return;
        }

        currentRows = candidateRows;
    });

    if (currentRows.length > 0) {
        chunks.push(
            createMatrixSectionChunk(
                doc,
                matrixSection,
                headerContent,
                tableHead,
                currentRows,
                chunks.length > 0
            )
        );
    }

    measurementRoot.remove();
    return chunks;
}

function getPlanExportBlocks(doc, source, contentLimitPx) {
    const selectors = [
        '.institucional-header',
        '#section-metas',
        '#section-matriz'
    ];

    return selectors.flatMap((selector) => {
        const block = source.querySelector(selector);
        if (!block) return [];

        if (selector === '#section-matriz') {
            return getMatrixSectionChunks(doc, block, contentLimitPx);
        }

        block.style.setProperty('display', 'block', 'important');
        block.style.setProperty('visibility', 'visible', 'important');
        block.style.setProperty('opacity', '1', 'important');
        return [block];
    }).map((block) => {
            block.style.setProperty('display', 'block', 'important');
            block.style.setProperty('visibility', 'visible', 'important');
            block.style.setProperty('opacity', '1', 'important');
            return block;
        });
}

function paginateTemplateDocument(doc, templateImage, isPlan) {
    const source = doc.querySelector('.print-container');
    if (!source) return;

    const basePageWidthPx = 850;
    const pageWidthPx = Math.round((PDF_SHEET_WIDTH_MM / 210) * basePageWidthPx);
    const pageHeightPx = Math.round((PDF_PAGE_HEIGHT_MM / PDF_SHEET_WIDTH_MM) * pageWidthPx);
    const topPaddingPx = Math.round((PDF_PADDING_TOP_MM / PDF_SHEET_WIDTH_MM) * pageWidthPx);
    const bottomPaddingPx = Math.round((PDF_PADDING_BOTTOM_MM / PDF_SHEET_WIDTH_MM) * pageWidthPx);
    const contentLimitPx = pageHeightPx - topPaddingPx - bottomPaddingPx;
    const gapPx = 16;

    let blocks = [];

    if (isPlan) {
        blocks = getPlanExportBlocks(doc, source, contentLimitPx);
    } else {
        const modalHeader = source.querySelector('.modal-header');
        const modalBody = source.querySelector('.modal-body');

        if (modalHeader) blocks.push(modalHeader);
        if (modalBody) {
            blocks.push(...Array.from(modalBody.children));
        } else {
            blocks = Array.from(source.children);
        }
    }

    blocks = blocks.filter((block) => {
        if (!(block instanceof doc.defaultView.HTMLElement)) return false;
        const styles = doc.defaultView.getComputedStyle(block);
        return styles.display !== 'none';
    });

    const pagesRoot = doc.createElement('div');
    pagesRoot.className = 'pdf-pages';

    let currentPage = null;
    let currentContent = null;
    let currentHeight = 0;

    const startPage = () => {
        currentPage = doc.createElement('section');
        currentPage.className = 'pdf-page';
        currentPage.style.background = isPlan
            ? '#FFFFFF'
            : `#FFFFFF url("${templateImage}") center top / ${PDF_SHEET_WIDTH_MM}mm ${PDF_PAGE_HEIGHT_MM}mm no-repeat`;

        currentContent = doc.createElement('div');
        currentContent.className = 'pdf-page-content';

        currentPage.appendChild(currentContent);
        pagesRoot.appendChild(currentPage);
        currentHeight = 0;
    };

    startPage();

    blocks.forEach((block) => {
        if (block.dataset.forceNewPageBefore === 'true' && currentContent.children.length > 0) {
            startPage();
        }

        const rect = block.getBoundingClientRect();
        const blockHeight = Math.max(Math.ceil(rect.height), 36);
        const nextHeight = currentHeight === 0 ? blockHeight : currentHeight + gapPx + blockHeight;

        if (nextHeight > contentLimitPx && currentContent.children.length > 0) {
            startPage();
        }

        currentContent.appendChild(block);
        currentHeight = currentHeight === 0 ? blockHeight : currentHeight + gapPx + blockHeight;
    });

    source.replaceWith(pagesRoot);
}

let pdfDependenciesLoadPromise = null;

function loadExternalScript(src, test) {
    if (test()) return Promise.resolve();

    return new Promise((resolve, reject) => {
        const existing = Array.from(document.scripts).find((script) => script.src === src);
        if (existing) {
            existing.addEventListener('load', () => resolve(), { once: true });
            existing.addEventListener('error', reject, { once: true });
            return;
        }

        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

function loadHtml2Pdf() {
    const hasHtml2Canvas = () => typeof window.html2canvas === 'function';
    const hasJsPdf = () => typeof (window.jspdf?.jsPDF || window.jsPDF) === 'function';

    if (hasHtml2Canvas() && hasJsPdf()) return Promise.resolve();
    if (pdfDependenciesLoadPromise) return pdfDependenciesLoadPromise;

    pdfDependenciesLoadPromise = (async () => {
        await loadExternalScript(
            'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
            hasHtml2Canvas
        );
        await loadExternalScript(
            'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
            hasJsPdf
        );
    })();

    return pdfDependenciesLoadPromise;
}

function printIframeAsPdf(iframe, fileName, btn, oldHTML) {
    const cleanup = () => {
        setTimeout(() => {
            iframe.remove();
            if (btn) {
                btn.innerHTML = oldHTML;
                btn.style.opacity = "1";
                btn.style.pointerEvents = "auto";
                renderLucideIcons();
            }
        }, 800);
    };

    try {
        const printWindow = iframe.contentWindow;
        if (!printWindow) throw new Error('No se pudo acceder a la ventana de impresión.');

        const titleNode = iframe.contentDocument.querySelector('title');
        if (titleNode) titleNode.textContent = `${fileName}.pdf`;

        showToast('Abriendo diálogo para guardar como PDF...');
        printWindow.focus();
        printWindow.print();
    } catch (error) {
        console.error("Error al abrir impresión PDF:", error);
        alert("No se pudo abrir la impresión. Intenta nuevamente.");
    } finally {
        cleanup();
    }
}

async function waitForPrintableAssets(doc) {
    if (!doc) return;

    const images = Array.from(doc.images || []);
    await Promise.all(images.map((img) => {
        if (img.complete) return Promise.resolve();

        return new Promise((resolve) => {
            img.addEventListener('load', resolve, { once: true });
            img.addEventListener('error', resolve, { once: true });
        });
    }));

    if (doc.fonts && typeof doc.fonts.ready?.then === 'function') {
        try {
            await doc.fonts.ready;
        } catch (_error) {
            // Continuamos aunque alguna fuente falle.
        }
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
}

async function waitForImageUrl(url) {
    if (!url) return;

    await new Promise((resolve) => {
        const img = new Image();
        img.onload = resolve;
        img.onerror = resolve;
        img.src = url;
    });
}

async function savePaginatedPdf(doc, fileName) {
    const html2canvas = window.html2canvas;
    const jsPDF = window.jspdf?.jsPDF || window.jsPDF;
    const pages = Array.from(doc.querySelectorAll('.pdf-page'));

    if (!html2canvas || !jsPDF || pages.length === 0) {
        return false;
    }

    const pdf = new jsPDF({
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait',
        compress: true
    });

    const sideMarginMm = (210 - PDF_SHEET_WIDTH_MM) / 2;

    for (let index = 0; index < pages.length; index += 1) {
        const page = pages[index];
        const canvas = await html2canvas(page, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            scrollY: 0,
            scrollX: 0
        });

        if (index > 0) {
            pdf.addPage('a4', 'portrait');
        }

        pdf.addImage(
            canvas.toDataURL('image/jpeg', 0.98),
            'JPEG',
            sideMarginMm,
            0,
            PDF_SHEET_WIDTH_MM,
            PDF_PAGE_HEIGHT_MM,
            undefined,
            'FAST'
        );
    }

    pdf.save(`${fileName}.pdf`);
    return true;
}

function showToast(message) {
    const toast = document.getElementById('app-toast');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('active');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => {
        toast.classList.remove('active');
    }, 2600);
}

function toggleTheme() {
    const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem('plan-theme', nextTheme);
    showToast(nextTheme === 'dark' ? 'Modo oscuro activado.' : 'Modo claro activado.');
    scheduleAutoSave();
}

function getPersistableFields(root = document) {
    return Array.from(root.querySelectorAll('input, textarea, select')).filter((field) => {
        if (!field) return false;
        if (field.closest('#actions-table')) return false;
        if (field.closest('#agenda-amigos-modal')) return false;
        if (field.type === 'button' || field.type === 'submit' || field.type === 'reset') return false;
        return true;
    });
}

function assignPersistenceKeys() {
    const fields = getPersistableFields();
    fields.forEach((field, index) => {
        if (field.dataset.persistKey) return;
        const scope = field.closest('.modal, section, main');
        const scopeId = scope?.id || scope?.className?.split(' ')[0] || 'root';
        field.dataset.persistKey = `${scopeId}:${field.tagName.toLowerCase()}:${index}`;
    });
}

function serializeField(field) {
    if (field.type === 'checkbox' || field.type === 'radio') {
        return {
            type: 'checked',
            value: field.checked
        };
    }

    return {
        type: 'value',
        value: field.value ?? ''
    };
}

function applyStoredField(field, storedValue) {
    if (!storedValue) return;

    if (storedValue.type === 'checked') {
        field.checked = Boolean(storedValue.value);
        return;
    }

    field.value = storedValue.value ?? '';
    if (field.tagName.toLowerCase() === 'textarea') {
        field.textContent = field.value;
    }
}

function getActionRowsState() {
    return Array.from(document.querySelectorAll('#actions-table tr')).map((row) => {
        const actionField = row.querySelector('td[data-label="Acción"] textarea');
        const responsableField = row.querySelector('td[data-label="Responsable"] input');
        const plazoField = row.querySelector('td[data-label="Plazo"] input');
        const hechoField = row.querySelector('td[data-label="Hecho"] input');

        return {
            action: actionField?.value || '',
            responsable: responsableField?.value || '',
            plazo: plazoField?.value || '',
            hecho: Boolean(hechoField?.checked)
        };
    });
}

function getAgendaAmigosState() {
    return Array.from(document.querySelectorAll('#agenda-amigos-modal .tracking-card')).map((card) => {
        const inputs = card.querySelectorAll('input');
        const select = card.querySelector('select');
        const textarea = card.querySelector('textarea');

        return {
            persona: inputs[0]?.value || '',
            progreso: select?.value || '',
            meta: inputs[1]?.value || '',
            cita: inputs[2]?.value || '',
            coordinacion: inputs[3]?.value || '',
            notas: textarea?.value || ''
        };
    });
}

function collectPlanState() {
    assignPersistenceKeys();

    const fields = {};
    getPersistableFields().forEach((field) => {
        fields[field.dataset.persistKey] = serializeField(field);
    });

    return {
        version: 1,
        theme: document.documentElement.dataset.theme || 'light',
        fields,
        actions: getActionRowsState(),
        agendaAmigos: getAgendaAmigosState()
    };
}

function hasMeaningfulState(state) {
    if (!state || typeof state !== 'object') return false;
    if (state.updatedAt) return true;
    if (Array.isArray(state.actions) && state.actions.length > 0) return true;
    if (Array.isArray(state.agendaAmigos) && state.agendaAmigos.length > 0) return true;
    if (state.fields && Object.keys(state.fields).length > 0) return true;
    return false;
}

function refreshComputedUi() {
    updateProgress('bautismos', 18);
    updateProgress('lecciones', 12);
    updateProgress('ref', 10);
    updateProgress('asistencia', 150);
}

async function fetchSavedPlanState() {
    if (!IS_INTEGRATED_PLAN) {
        try {
            const response = await fetch(PLAN_STATE_ENDPOINT, {
                cache: 'no-store'
            });
            if (response.ok) return response.json();
        } catch (_error) {
            // La versión integrada también funciona sin el servidor JSON.
        }
    }

    const localState = localStorage.getItem(PLAN_LOCAL_STORAGE_KEY);
    return localState ? JSON.parse(localState) : null;
}

async function persistPlanState(options = {}) {
    if (isHydratingState) return false;

    const { manual = false } = options;
    const state = collectPlanState();
    const serializedState = JSON.stringify(state);

    if (!manual && serializedState === lastSavedStateString) {
        return false;
    }

    let savedOnServer = false;
    if (!IS_INTEGRATED_PLAN) {
        try {
            const response = await fetch(PLAN_STATE_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: serializedState
            });
            savedOnServer = response.ok;
        } catch (_error) {
            savedOnServer = false;
        }
    }

    if (!savedOnServer) localStorage.setItem(PLAN_LOCAL_STORAGE_KEY, serializedState);

    lastSavedStateString = serializedState;

    if (manual) {
        showToast(savedOnServer ? 'Datos guardados en JSON.' : 'Datos guardados en este dispositivo.');
    }

    return true;
}

function scheduleAutoSave() {
    if (isHydratingState) return;

    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
        persistPlanState().catch((error) => {
            console.error('No se pudo guardar automáticamente:', error);
        });
    }, AUTO_SAVE_DELAY_MS);
}

async function savePlanData() {
    try {
        await persistPlanState({ manual: true });
    } catch (error) {
        console.error('Error al guardar los datos:', error);
        showToast('No se pudieron guardar los datos.');
    }
}

function ensureAgendaAmigosStarterCard() {
    const currentView = getCurrentView();
    if (currentView !== 'agenda-coordinacion') return;

    const container = document.getElementById('agenda-amigos-modal');
    if (!container || container.children.length > 0) return;

    addAmigoItemModal({}, {
        silent: true,
        skipSave: true
    });
}

function restoreActionRows(rows) {
    const tableBody = document.getElementById('actions-table');
    if (!tableBody) return;

    tableBody.innerHTML = '';
    rows.forEach((row) => addRow(row, { silent: true }));
}

function restoreAgendaAmigos(cards) {
    const container = document.getElementById('agenda-amigos-modal');
    if (!container) return;

    container.innerHTML = '';
    cards.forEach((card) => addAmigoItemModal(card, { silent: true }));
}

async function restorePlanData() {
    try {
        const savedState = await fetchSavedPlanState();
        if (!hasMeaningfulState(savedState)) {
            lastSavedStateString = JSON.stringify(collectPlanState());
            return;
        }

        isHydratingState = true;
        assignPersistenceKeys();

        if (Array.isArray(savedState.actions)) {
            restoreActionRows(savedState.actions);
        }

        if (Array.isArray(savedState.agendaAmigos)) {
            restoreAgendaAmigos(savedState.agendaAmigos);
        }

        if (savedState.theme) {
            document.documentElement.dataset.theme = savedState.theme;
            localStorage.setItem('plan-theme', savedState.theme);
        }

        getPersistableFields().forEach((field) => {
            const savedField = savedState.fields?.[field.dataset.persistKey];
            applyStoredField(field, savedField);
        });

        refreshComputedUi();
        lastSavedStateString = JSON.stringify(collectPlanState());
    } catch (error) {
        console.error('No se pudo restaurar el estado guardado:', error);
        showToast('No se pudieron cargar los datos guardados.');
    } finally {
        isHydratingState = false;
    }
}

// --- METAS Y PROGRESS BARS ---
function updateProgress(id, max) {
    const val = parseFloat(document.getElementById(`val-${id}`).value) || 0;
    const bar = document.getElementById(`bar-${id}`);
    const percent = Math.min((val / max) * 100, 100);
    bar.style.width = percent + '%';
}

// --- MODALES ---
function openModal(id) {
    const modal = document.getElementById(id);
    modal.classList.add('active');
    const scrollContainer = modal.querySelector('.modal-container');
    if (scrollContainer) scrollContainer.scrollTop = 0;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-is-open');
}

function closeModal(event) {
    if (event && event.target !== event.currentTarget) return;
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
    document.body.style.overflow = '';
    document.body.classList.remove('modal-is-open');
}

// --- FICHA DE SEGUIMIENTO (Agenda Coordinación) ---
function addAmigoItemModal(data = {}, options = {}) {
    const container = document.getElementById('agenda-amigos-modal');
    if (!container) return;

    const card = document.createElement('div');
    card.className = 'tracking-card';

    card.innerHTML = `
        <button class="tracking-card-delete no-print" onclick="this.closest('.tracking-card').remove()" title="Eliminar" aria-label="Eliminar ficha de seguimiento">
            <i data-lucide="trash-2" class="lucide-icon lucide-icon-sm" aria-hidden="true"></i>
        </button>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;">
            <div style="display:flex;flex-direction:column;gap:12px;">
                <div>
                    <label style="font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#0054D1;display:flex;align-items:center;gap:5px;margin-bottom:5px;">
                        <i data-lucide="user" class="lucide-icon lucide-icon-sm" aria-hidden="true"></i>
                        Persona / Familia
                    </label>
                    <input type="text" class="input-underlined" style="font-weight:600;">
                </div>
                <div>
                    <label style="font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#0054D1;display:flex;align-items:center;gap:5px;margin-bottom:5px;">
                        <i data-lucide="trending-up" class="lucide-icon lucide-icon-sm" aria-hidden="true"></i>
                        Estado de Progreso
                    </label>
                    <select class="input-underlined" style="background:transparent;">
                        <option value="">Selecciona...</option>
                        <option>Amigo (Investigador activo)</option>
                        <option>Nuevo Miembro Converso</option>
                        <option>Miembro que regresa</option>
                    </select>
                </div>
                <div>
                    <label style="font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#0054D1;display:flex;align-items:center;gap:5px;margin-bottom:5px;">
                        <i data-lucide="flag" class="lucide-icon lucide-icon-sm" aria-hidden="true"></i>
                        Próxima Meta / Ordenanza
                    </label>
                    <input type="date" class="input-underlined" style="color:#0041A3;">
                </div>
            </div>
            <div style="display:flex;flex-direction:column;gap:12px;">
                <div>
                    <label style="font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#0054D1;display:flex;align-items:center;gap:5px;margin-bottom:5px;">
                        <i data-lucide="calendar-clock" class="lucide-icon lucide-icon-sm" aria-hidden="true"></i>
                        Siguiente Cita / Lección
                    </label>
                    <input type="datetime-local" class="input-underlined">
                </div>
                <div>
                    <label style="font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#0054D1;display:flex;align-items:center;gap:5px;margin-bottom:5px;">
                        <i data-lucide="handshake" class="lucide-icon lucide-icon-sm" aria-hidden="true"></i>
                        Coordinación con el Barrio
                    </label>
                    <input type="text" class="input-underlined">
                </div>
                <div>
                    <label style="font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#0054D1;display:flex;align-items:center;gap:5px;margin-bottom:5px;">
                        <i data-lucide="notebook-pen" class="lucide-icon lucide-icon-sm" aria-hidden="true"></i>
                        Notas
                    </label>
                    <textarea class="input-underlined" rows="1" style="resize:none;"></textarea>
                </div>
            </div>
        </div>
    `;

    // Animación de entrada
    card.style.opacity = '0';
    card.style.transform = 'translateY(6px)';
    container.appendChild(card);

    const inputs = card.querySelectorAll('input');
    const select = card.querySelector('select');
    const textarea = card.querySelector('textarea');

    if (inputs[0]) inputs[0].value = data.persona || '';
    if (select) select.value = data.progreso || '';
    if (inputs[1]) inputs[1].value = data.meta || '';
    if (inputs[2]) inputs[2].value = data.cita || '';
    if (inputs[3]) inputs[3].value = data.coordinacion || '';
    if (textarea) textarea.value = data.notas || '';

    renderLucideIcons();

    if (options.silent) {
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
        if (!options.skipSave) {
            scheduleAutoSave();
        }
        return;
    }

    requestAnimationFrame(() => {
        card.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
    });

    if (!options.skipSave) {
        scheduleAutoSave();
    }
}

// --- MATRIZ DE ACCIONES ---
function addRow(data = {}, options = {}) {
    const tableBody = document.getElementById('actions-table');
    if (!tableBody) return;

    const row = document.createElement('tr');
    row.style.borderBottom = '1px solid var(--color-50)';

    row.innerHTML = `
        <td style="padding:11px 12px;" data-label="Acción">
            <textarea style="width:100%;border:none;outline:none;font-family:Inter,sans-serif;font-size:12px;font-weight:500;color:var(--text-primary);background:transparent;resize:none;" rows="2" placeholder="Nueva acción..."></textarea>
        </td>
        <td style="padding:11px 12px;" data-label="Responsable">
            <input type="text" style="width:100%;border:none;outline:none;font-family:Inter,sans-serif;font-size:12px;color:var(--text-secondary);background:transparent;" placeholder="Responsable">
        </td>
        <td style="padding:11px 12px;" data-label="Plazo">
            <input type="date" style="font-family:Inter,sans-serif;font-size:11px;border:none;outline:none;color:var(--text-muted);background:transparent;">
        </td>
        <td style="padding:11px 12px;text-align:center;" data-label="Hecho">
            <input type="checkbox" style="width:15px;height:15px;accent-color:var(--color-500);">
        </td>
        <td style="padding:11px 12px;text-align:center;" class="no-print">
            <button onclick="this.closest('tr').remove()" class="btn-delete-row" title="Eliminar acción" aria-label="Eliminar acción">
                <i data-lucide="trash-2" class="lucide-icon lucide-icon-sm" aria-hidden="true"></i>
            </button>
        </td>
    `;

    const actionField = row.querySelector('td[data-label="Acción"] textarea');
    const responsableField = row.querySelector('td[data-label="Responsable"] input');
    const plazoField = row.querySelector('td[data-label="Plazo"] input');
    const hechoField = row.querySelector('td[data-label="Hecho"] input');

    if (actionField) actionField.value = data.action || '';
    if (responsableField) responsableField.value = data.responsable || '';
    if (plazoField) plazoField.value = data.plazo || '';
    if (hechoField) hechoField.checked = Boolean(data.hecho);

    tableBody.appendChild(row);
    renderLucideIcons();

    if (!options.silent) {
        showToast('Nueva acción agregada.');
    }

    scheduleAutoSave();

}

// --- EXPORTACIÓN PDF DIRECTA ---
async function generatePDF(elementId, fileName) {
    const originalElement = document.getElementById(elementId);
    if (!originalElement) return;

    // 1. SINCRONIZACIÓN
    syncInputValues(originalElement);

    const isPlan = elementId === 'main-plan-content';
    const sourceEvent = window.event;
    const btn = sourceEvent && sourceEvent.target ? sourceEvent.target.closest('button') : document.activeElement?.closest?.('button');
    let oldHTML = "";
    if (btn) {
        oldHTML = btn.innerHTML;
        btn.innerHTML = "Exportando...";
        btn.style.opacity = "0.7";
        btn.style.pointerEvents = "none";
    }

    showToast('Generando PDF...');

    // 2. CREAR IFRAME AISLADO (Igual que el antiguo window.open pero invisible)
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '850px'; // Ancho de diseño perfecto para A4
    iframe.style.height = '10000px'; // Altura masiva para evitar barras de scroll internas y recortes
    iframe.style.left = '-9999px';
    iframe.style.top = '0';
    document.body.appendChild(iframe);

    const headContent = Array.from(document.head.children)
        .map(child => child.outerHTML)
        .join('\n');

    const exportSource = originalElement.querySelector('[data-export-root]') || originalElement.querySelector('.modal-container') || originalElement;
    const contentHtml = isPlan ? buildPlanReportHtml(originalElement) : exportSource.innerHTML;
    const templatePageImage = new URL('assets/pdf-template/page-1.png', window.location.href).href;

    iframe.contentDocument.open();
    iframe.contentDocument.write(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            ${headContent}
            <title>${fileName}.pdf</title>
            <style>
                @page { size: A4; margin: 0; }
                html, body { margin: 0 !important; padding: 0 !important; }
                * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                body { background: white !important; color: black !important; font-family: Inter, Arial, sans-serif !important; line-height: 1.4; width: 210mm; min-height: 297mm; position: relative !important; }
                .print-container { position: relative; z-index: 2; padding: 0; width: 100%; box-sizing: border-box; }
                .pdf-pages { width: 210mm; position: relative; z-index: 2; counter-reset: report-page; }
                .pdf-page { position: relative; width: ${PDF_SHEET_WIDTH_MM}mm; min-height: ${PDF_PAGE_HEIGHT_MM}mm; margin: 0 auto; break-after: page; page-break-after: always; overflow: hidden; counter-increment: report-page; }
                .pdf-page:last-child { break-after: auto; page-break-after: auto; }
                .is-exporting-plan .pdf-page::after { content:"PLAN MISIONAL  /  BARRIO MILAGRO                                      " counter(report-page, decimal-leading-zero); position:absolute; z-index:4; left:20mm; right:20mm; bottom:7mm; padding-top:4mm; border-top:.3mm solid #D7E0EC; color:#718096; font-size:6.8pt; font-weight:800; letter-spacing:.11em; white-space:pre; }
                .is-exporting-plan .pdf-page::before { content:""; position:absolute; z-index:4; left:0; top:0; width:7mm; height:44mm; background:#0D1B4C; }
                .pdf-page-content { position: relative; z-index: 2; padding: ${PDF_PADDING_TOP_MM}mm ${PDF_PADDING_X_MM}mm ${PDF_PADDING_BOTTOM_MM}mm ${PDF_PADDING_X_MM}mm; width: 100%; min-height: ${PDF_PAGE_HEIGHT_MM}mm; box-sizing: border-box; }
                .pdf-page-content > * + * { margin-top: 12pt; }
                .pdf-template-page { position: absolute; inset: 0; width: ${PDF_SHEET_WIDTH_MM}mm; height: ${PDF_PAGE_HEIGHT_MM}mm; z-index: 0; object-fit: cover; pointer-events: none; }
                
                /* Forzar estilos de impresión profesional */
                .no-print, .btn-primary, .btn-secondary, .modal-header-actions, button { display: none !important; }
                .is-exporting-plan #section-metas,
                .is-exporting-plan #section-matriz {
                    display: block !important;
                }
                .is-exporting-plan #section-liderazgo,
                .is-exporting-plan #section-agendas {
                    display: none !important;
                }
                
                .institucional-header { display: block !important; text-align: center; margin-bottom: 24pt; padding: 16pt 18pt !important; border:1px solid #D7DEE8 !important; border-radius:16pt !important; background:#F8FAFC !important; break-inside:avoid !important; }
                .institucional-header div:first-child { color:#475569 !important; letter-spacing:0.14em !important; }
                .institucional-header .print-title { margin: 8pt 0 !important; font-weight: 800 !important; color: #0F172A !important; }
                .page-header { display:flex !important; justify-content:space-between !important; align-items:flex-start !important; gap:18pt !important; border:1px solid #D7DEE8 !important; border-radius:14pt !important; background:#F8FAFC !important; padding:16pt 18pt !important; margin:0 0 20pt !important; box-shadow:none !important; break-inside:avoid !important; }
                .page-header h1 { font-size:22pt !important; line-height:1.1 !important; margin:4pt 0 !important; color:black !important; letter-spacing:0 !important; }
                .page-header p { font-size:10.5pt !important; color:#475569 !important; margin:0 !important; max-width:340pt !important; }
                .page-meta { display:flex !important; flex-wrap:wrap !important; gap:6pt !important; margin-top:10pt !important; }
                .page-meta span { display:inline-flex !important; align-items:center !important; gap:5pt !important; min-height:0 !important; padding:4pt 8pt !important; border:1px solid #D7DEE8 !important; border-radius:999pt !important; background:white !important; color:#334155 !important; font-size:9pt !important; font-weight:700 !important; }
                .page-meta svg { width:11pt !important; height:11pt !important; color:#0F6FFF !important; }
                
                /* Evitar cortes */
                .card, .tracking-card, .agenda-section, .metas-container, .program-divider { break-inside: avoid !important; page-break-inside: avoid !important; margin-bottom: 24pt !important; }
                .card { box-shadow: none !important; border: 1px solid #E2E8F0 !important; background: white !important; }
                .metrics-grid { gap: 12pt !important; }
                .table-responsive { overflow: visible !important; }
                .actions-table { display: table !important; width: 100% !important; table-layout: fixed !important; }
                .actions-table thead { display: table-header-group !important; }
                .actions-table tbody { display: table-row-group !important; }
                .actions-table tr { display: table-row !important; }
                .actions-table th,
                .actions-table td { display: table-cell !important; width: auto !important; }
                .actions-table td::before { content: none !important; display: none !important; }
                .actions-table td[data-label="Acción"] textarea,
                .actions-table td[data-label="Acción"] div,
                .actions-table td input[type="text"] { text-align: left !important; width: 100% !important; }
                .actions-table td[data-label="Hecho"] { text-align: center !important; }

                /* Textos y Tablas */
                .section-header, .section-label { color: black !important; font-weight: 700 !important; text-transform: uppercase !important; border-bottom: 1px solid #eee; margin-bottom: 12pt; }
                #section-matriz { width: 100% !important; margin: 0 !important; }
                table { width: 100% !important; border-collapse: collapse; }
                th, td { border: 1px solid #CBD5E1 !important; padding: 8pt !important; text-align: left !important; }
                th { background-color: #F8FAFC !important; color: black !important; }
                input, textarea, select { color: black !important; border-bottom: 1px solid #CBD5E1 !important; background: transparent !important; font-weight: 600 !important; }

                /* Reporte ejecutivo del Plan Misional */
                .plan-report { color:#0D1B4C; }
                .plan-report .institucional-header { position:relative;text-align:center !important;margin:0 0 22pt !important;padding:30pt 70pt 27pt !important;min-height:128pt;border:1px solid #D5E0ED !important;border-radius:0 !important;background:white !important;color:#0D1B4C !important;display:block !important;overflow:hidden;box-sizing:border-box; }
                .plan-report .institucional-header::before { content:"";position:absolute;left:0;top:0;width:0;height:0;border-top:70pt solid #203A5A;border-right:92pt solid transparent; }
                .plan-report .institucional-header::after { content:"";position:absolute;right:0;bottom:0;width:0;height:0;border-bottom:48pt solid #4D76A8;border-left:88pt solid transparent; }
                .report-brand-row { position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;gap:6pt;padding:0;background:transparent; }
                .plan-report .institucional-header .report-mark { width:30pt;height:30pt;display:grid;place-items:center;border:0;border-radius:8pt 8pt 3pt 8pt;background:#203A5A;color:white !important;font-size:8pt;font-weight:900;letter-spacing:.07em; }
                .plan-report .institucional-header .report-overline { display:block;color:#4D76A8 !important;font-size:7pt;font-weight:900;letter-spacing:.18em;text-transform:uppercase; }
                .report-cover h1 { margin:2pt 0 3pt;color:#172E4A !important;font-size:25pt;line-height:1.02;letter-spacing:-.02em;text-transform:uppercase; }
                .report-cover p { margin:0;color:#52647A !important;font-size:9pt;letter-spacing:.08em; }
                .report-issued { position:absolute;z-index:2;right:14pt;top:12pt;display:flex;flex-direction:column;align-items:flex-end;padding:0;color:#0D1B4C; }
                .report-issued span { color:#68758C !important;font-size:6.8pt;text-transform:uppercase;letter-spacing:.14em; }
                .report-issued strong { margin-top:3pt;color:#0D1B4C !important;font-size:9pt; }
                .report-issued em { margin-top:8pt;padding-top:7pt;border-top:1px solid #C8D5E5;color:#68758C !important;font-size:6.5pt;font-style:normal;letter-spacing:.05em; }
                .report-summary { margin:0 !important; }
                .report-section-heading { display:flex;justify-content:space-between;align-items:flex-end;gap:18pt;margin-bottom:15pt;padding-bottom:10pt;border-bottom:1px solid #D9E4F2; }
                .report-section-heading span { color:#0077FF !important;font-size:7pt;font-weight:850;letter-spacing:.16em;text-transform:uppercase; }
                .report-section-heading h2,.report-section-heading .section-label { margin:4pt 0 0 !important;border:0 !important;color:#0D1B4C !important;font-size:18pt !important;line-height:1.05;text-transform:none !important;letter-spacing:-.015em; }
                .report-section-heading p,.report-section-heading .section-subtitle { max-width:210pt;margin:0 !important;color:#68758C !important;font-size:8.5pt;text-align:right; }
                .report-metrics-grid { display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12pt;margin:2pt 8pt 16pt; }
                .report-metric { display:flex;flex-direction:column;align-items:center;position:relative;min-height:142pt;padding:8pt 5pt;border:0;border-radius:0;background:white;break-inside:avoid;box-sizing:border-box;text-align:center; }
                .report-metric::after { content:none; }
                .report-metric-index { display:block;color:#4D76A8 !important;font-size:7pt;font-weight:900;letter-spacing:.16em; }
                .report-metric-copy { display:flex;flex-direction:column;align-items:center;min-width:0;margin-top:4pt;order:3; }
                .report-metric-label { color:#172E4A !important;font-size:8pt;font-weight:850;text-transform:uppercase;letter-spacing:.05em; }
                .report-metric-copy small { margin-top:3pt;color:#68758C;font-size:7.5pt; }
                .report-metric-value { display:flex;align-items:baseline;gap:3pt;margin:7pt 0 0;order:4; }
                .report-metric-value b { color:#172E4A;font-size:18pt;line-height:1;letter-spacing:-.03em; }
                .report-metric-value span { color:#68758C !important;font-size:8pt;font-weight:700; }
                .report-metric-progress { order:2;position:relative;display:grid;place-items:center;width:67pt;height:67pt;margin-top:6pt;border:7pt solid #203A5A;border-right-color:var(--report-accent);border-radius:50%;box-sizing:border-box; }
                .report-metric-progress strong { color:#172E4A !important;font-size:13pt;text-align:center; }
                .report-progress { display:none; }
                .report-action-summary { display:grid;grid-template-columns:repeat(4,1fr);border:0;border-radius:12pt;overflow:hidden;margin:0 0 12pt;background:#F1F5FA; }
                .report-action-summary>div { display:flex;flex-direction:column;padding:12pt 13pt;border-right:1px solid #D9E2ED;background:transparent; }
                .report-action-summary>div:last-child { border-right:0;background:#0D1B4C; }
                .report-action-summary span { color:#68758C !important;font-size:7.5pt;text-transform:uppercase;letter-spacing:.05em; }
                .report-action-summary strong { margin-top:4pt;color:#0D1B4C !important;font-size:16pt; }
                .report-total-progress span { color:#A8B8CD !important; }
                .report-total-progress strong { color:white !important; }
                .report-insight { padding:12pt 14pt;border:1px solid #DCE5F0;border-left:3pt solid #00C9FF;border-radius:3pt 10pt 10pt 3pt;background:white; }
                .report-insight strong { color:#0D1B4C !important;font-size:8.5pt; }
                .report-insight p { margin:3pt 0 0;color:#53627A !important;font-size:8.5pt;line-height:1.5; }
                .report-actions { margin:0 !important; }
                .report-actions>.card { padding:0 !important;border:0 !important;margin:0 !important; }
                .report-actions-table { display:block !important;width:100% !important;border:0 !important;border-collapse:separate !important;overflow:visible !important; }
                .report-actions-table thead { display:none !important; }
                .report-actions-table tbody { display:flex !important;flex-direction:column;gap:8pt !important;width:100%;position:relative;border:0; }
                .report-actions-table tbody::before { content:none; }
                .report-actions-table tr { position:relative;display:grid !important;grid-template-columns:48pt minmax(0,1.85fr) minmax(90pt,.7fr) minmax(75pt,.6fr) 76pt;grid-template-areas:"index action owner date status";align-items:center;column-gap:12pt;min-height:82pt;padding:11pt 13pt 11pt 8pt;border:0;border-radius:0;background:white !important;break-inside:avoid;box-sizing:border-box;overflow:hidden; }
                .report-actions-table tr:nth-child(even) { background:#F1F5FA !important; }
                .report-actions-table tr::after { content:"";position:absolute;left:0;top:0;bottom:0;width:4pt;background:#4D76A8; }
                .report-actions-table td { display:block !important;width:auto !important;padding:0 !important;border:0 !important;color:#334155 !important;font-size:8pt !important;line-height:1.45;vertical-align:top !important;background:transparent !important; }
                .report-actions-table td::before { display:block !important;margin-bottom:3pt;color:#8290A5 !important;font-size:6.2pt;font-weight:850;letter-spacing:.11em;text-transform:uppercase; }
                .report-actions-table td:nth-child(1) { position:relative;z-index:1;grid-area:index;align-self:center;display:grid !important;place-items:center;width:38pt !important;height:38pt;border:0 !important;border-radius:10pt 10pt 3pt 10pt !important;background:#4D76A8 !important;color:white !important;box-shadow:none;font-size:10pt !important; }
                .report-actions-table td:nth-child(1)::before { content:none !important; }
                .report-actions-table td:nth-child(2) { grid-area:action;padding:0 12pt 0 0 !important;border-right:1px solid #D9E3EF !important;border-bottom:0 !important; }
                .report-actions-table td:nth-child(2)::before { content:"Acción prioritaria" !important; }
                .report-actions-table td:nth-child(3) { grid-area:owner; }
                .report-actions-table td:nth-child(3)::before { content:"Responsable" !important; }
                .report-actions-table td:nth-child(4) { grid-area:date; }
                .report-actions-table td:nth-child(4)::before { content:"Plazo" !important; }
                .report-actions-table td:nth-child(5) { grid-area:status;align-self:center; }
                .report-actions-table td:nth-child(5)::before { content:none !important; }
                .report-row-index { font-weight:900;text-align:center !important; }
                .report-action-name { color:#0D1B4C;font-size:9pt;font-weight:750;line-height:1.45; }
                .report-status-cell { text-align:left !important; }
                .report-status { display:inline-block;padding:4pt 7pt;border-radius:99pt;background:#FFF3DF;color:#9A5A00 !important;font-size:7pt;font-weight:800; }
                .report-status.is-complete { background:#E4F8EE;color:#168257 !important; }
            </style>
        </head>
        <body class="is-exporting-pdf ${isPlan ? 'is-exporting-plan' : ''}">
            <div class="print-container">
                ${contentHtml}
            </div>
        </body>
        </html>
    `);
    iframe.contentDocument.close();



    // === CORRECCIONES DOM PARA EL PDF ===
    const iDoc = iframe.contentDocument;

    // 1. Reemplazar cada textarea de la tabla con un <div> que muestre TODA la accion
    iDoc.querySelectorAll('td textarea').forEach(ta => {
        const text = ta.value || ta.innerHTML || ta.textContent || '';
        const div = iDoc.createElement('div');
        div.textContent = text;
        div.style.cssText = [
            'font-family:Inter,sans-serif',
            'font-size:12px',
            'font-weight:600',
            'color:black',
            'white-space:pre-wrap',
            'word-break:break-word',
            'line-height:1.5',
            'width:100%',
            'min-height:0',
            'overflow:visible'
        ].join(';');
        ta.parentNode.replaceChild(div, ta);
    });

    // 2. Celdas sin truncado
    iDoc.querySelectorAll('td, th').forEach(cell => {
        cell.style.setProperty('word-break', 'break-word', 'important');
        cell.style.setProperty('white-space', 'normal', 'important');
        cell.style.setProperty('overflow', 'visible', 'important');
        cell.style.setProperty('vertical-align', 'top', 'important');
    });

    if (!isPlan) await waitForImageUrl(templatePageImage);
    await waitForPrintableAssets(iDoc);
    paginateTemplateDocument(iDoc, templatePageImage, isPlan);
    await new Promise(r => setTimeout(r, 250));
    await waitForPrintableAssets(iDoc);

    console.log('[pdf-debug]', JSON.stringify({
        title: iDoc.title,
        pages: iDoc.querySelectorAll('.pdf-page').length,
        pageContentBlocks: iDoc.querySelectorAll('.pdf-page-content > *').length,
        blockIds: Array.from(iDoc.querySelectorAll('.pdf-page-content > *')).map((node) => node.id || node.className || node.tagName),
        pageSummaries: Array.from(iDoc.querySelectorAll('.pdf-page')).map((page, index) => ({
            page: index + 1,
            blocks: Array.from(page.querySelectorAll('.pdf-page-content > *')).map((node) => node.id || node.className || node.tagName)
        })),
        textLength: (iDoc.body?.innerText || '').trim().length,
        hasMatrixTable: !!iDoc.querySelector('.actions-table'),
        hasTemplateBackground: !isPlan && !!iDoc.querySelector('.pdf-page')
    }));

    let pdfLibraryReady = false;
    try {
        await loadHtml2Pdf();
        pdfLibraryReady = typeof window.html2canvas === 'function'
            && typeof (window.jspdf?.jsPDF || window.jsPDF) === 'function';
    } catch (e) {
        console.warn("Dependencias PDF no disponibles:", e);
    }

    if (!pdfLibraryReady) {
        iframe.remove();
        if (btn) {
            btn.innerHTML = oldHTML;
            btn.style.opacity = "1";
            btn.style.pointerEvents = "auto";
            renderLucideIcons();
        }
        showToast('No se pudo cargar el generador de PDF.');
        alert('No se pudo generar el PDF automáticamente. Intenta nuevamente.');
        return;
    }

    try {
        const saved = await savePaginatedPdf(iDoc, fileName);
        if (!saved) {
            throw new Error('No se pudo ensamblar el PDF paginado.');
        }
        showToast('PDF generado correctamente.');
    } catch (e) {
        console.error("Error al generar PDF:", e);
        showToast('No se pudo generar el PDF.');
        alert('No se pudo generar el PDF automáticamente. Intenta nuevamente.');
    } finally {
        iframe.remove();
        if (btn) {
            btn.innerHTML = oldHTML;
            btn.style.opacity = "1";
            btn.style.pointerEvents = "auto";
            renderLucideIcons();
        }
    }
}

function syncInputValues(container) {
    const inputs = container.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        if (input.type === 'checkbox' || input.type === 'radio') {
            if (input.checked) input.setAttribute('checked', '');
            else input.removeAttribute('checked');
        } else {
            // Sincronizar valor actual al atributo para que html2canvas lo detecte
            input.setAttribute('value', input.value);
            if (input.tagName.toLowerCase() === 'textarea') {
                input.innerHTML = input.value;
            }
        }
    });
}

function initScrollReveals() {
    const targets = document.querySelectorAll(
        '#section-metas .card, #section-liderazgo > .card, #section-agendas > .card, #section-matriz > .card, .agenda-card, .icon-btn'
    );

    if (!targets.length) return;

    // Mantener la interfaz fluida tiene prioridad sobre las animaciones al hacer scroll.
    targets.forEach((target) => {
        target.classList.add('reveal-on-scroll', 'is-visible');
        target.style.transitionDelay = '0ms';
    });
}

// --- INICIALIZACIÓN ---
window.addEventListener('DOMContentLoaded', async () => {
    const savedTheme = localStorage.getItem('plan-theme');
    if (savedTheme) document.documentElement.dataset.theme = savedTheme;

    applyCurrentView();
    assignPersistenceKeys();
    renderLucideIcons();
    refreshComputedUi();
    initScrollReveals();

    document.addEventListener('click', (event) => {
        if (event.target.closest('.btn-delete-row')) {
            setTimeout(() => {
                showToast('Acción eliminada.');
                scheduleAutoSave();
            }, 0);
        }

        if (event.target.closest('.tracking-card-delete')) {
            setTimeout(() => {
                scheduleAutoSave();
            }, 0);
        }

    });

    document.addEventListener('input', (event) => {
        if (event.target.matches('input, textarea, select')) {
            scheduleAutoSave();
        }
    });

    document.addEventListener('change', (event) => {
        if (event.target.matches('input, textarea, select')) {
            scheduleAutoSave();
        }
    });

    await restorePlanData();
    ensureAgendaAmigosStarterCard();
});

window.addEventListener('pageshow', () => {
    window.scrollTo(0, 0);
    setTimeout(() => window.scrollTo(0, 0), 100);
});
