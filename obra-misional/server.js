const http = require('node:http');
const path = require('node:path');
const { promises: fs } = require('node:fs');
const { createReadStream } = require('node:fs');

const ROOT_DIR = __dirname;
const DATA_DIR = path.join(ROOT_DIR, 'data');
const STATE_FILE = path.join(DATA_DIR, 'plan-state.json');
const DEFAULT_PORT = Number(process.env.PORT || 4174);
const MAX_BODY_BYTES = 2 * 1024 * 1024;

const MIME_TYPES = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml'
};

const DEFAULT_STATE = {
    version: 1,
    updatedAt: null,
    theme: 'dark',
    fields: {},
    actions: [],
    agendaAmigos: []
};

async function ensureStateFile() {
    await fs.mkdir(DATA_DIR, { recursive: true });

    try {
        await fs.access(STATE_FILE);
    } catch (_error) {
        await fs.writeFile(STATE_FILE, JSON.stringify(DEFAULT_STATE, null, 2), 'utf8');
    }
}

async function readStateFile() {
    await ensureStateFile();
    const raw = await fs.readFile(STATE_FILE, 'utf8');

    if (!raw.trim()) {
        return { ...DEFAULT_STATE };
    }

    try {
        return JSON.parse(raw);
    } catch (_error) {
        return { ...DEFAULT_STATE };
    }
}

function sendJson(res, statusCode, payload) {
    const body = JSON.stringify(payload, null, 2);
    res.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store'
    });
    res.end(body);
}

function isPlainObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeRow(row) {
    return {
        action: typeof row?.action === 'string' ? row.action : '',
        responsable: typeof row?.responsable === 'string' ? row.responsable : '',
        plazo: typeof row?.plazo === 'string' ? row.plazo : '',
        hecho: Boolean(row?.hecho)
    };
}

function normalizeAgendaCard(card) {
    return {
        persona: typeof card?.persona === 'string' ? card.persona : '',
        progreso: typeof card?.progreso === 'string' ? card.progreso : '',
        meta: typeof card?.meta === 'string' ? card.meta : '',
        cita: typeof card?.cita === 'string' ? card.cita : '',
        coordinacion: typeof card?.coordinacion === 'string' ? card.coordinacion : '',
        notas: typeof card?.notas === 'string' ? card.notas : ''
    };
}

function normalizeState(payload) {
    if (!isPlainObject(payload)) {
        throw new Error('El estado debe ser un objeto JSON.');
    }

    const fields = isPlainObject(payload.fields) ? payload.fields : {};
    const normalizedFields = {};

    Object.entries(fields).forEach(([key, value]) => {
        if (typeof key !== 'string' || !key.trim()) return;

        if (isPlainObject(value) && typeof value.type === 'string') {
            normalizedFields[key] = {
                type: value.type,
                value: value.type === 'checked' ? Boolean(value.value) : String(value.value ?? '')
            };
            return;
        }

        normalizedFields[key] = {
            type: 'value',
            value: String(value ?? '')
        };
    });

    return {
        version: 1,
        updatedAt: new Date().toISOString(),
        theme: typeof payload.theme === 'string' ? payload.theme : DEFAULT_STATE.theme,
        fields: normalizedFields,
        actions: Array.isArray(payload.actions) ? payload.actions.map(normalizeRow) : [],
        agendaAmigos: Array.isArray(payload.agendaAmigos) ? payload.agendaAmigos.map(normalizeAgendaCard) : []
    };
}

async function writeStateFile(payload) {
    const normalized = normalizeState(payload);
    await ensureStateFile();

    const tempPath = `${STATE_FILE}.tmp`;
    await fs.writeFile(tempPath, JSON.stringify(normalized, null, 2), 'utf8');
    await fs.rename(tempPath, STATE_FILE);

    return normalized;
}

function getSafeFilePath(requestPath) {
    const cleanPath = requestPath === '/' ? '/index.html' : requestPath;
    const filePath = path.normalize(path.join(ROOT_DIR, cleanPath));

    if (!filePath.startsWith(ROOT_DIR)) {
        return null;
    }

    return filePath;
}

function streamFile(res, filePath) {
    const extension = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[extension] || 'application/octet-stream';

    res.writeHead(200, {
        'Content-Type': contentType
    });

    createReadStream(filePath).pipe(res);
}

function readRequestBody(req) {
    return new Promise((resolve, reject) => {
        let size = 0;
        let raw = '';

        req.setEncoding('utf8');

        req.on('data', (chunk) => {
            size += Buffer.byteLength(chunk);
            if (size > MAX_BODY_BYTES) {
                reject(new Error('Payload demasiado grande.'));
                req.destroy();
                return;
            }

            raw += chunk;
        });

        req.on('end', () => resolve(raw));
        req.on('error', reject);
    });
}

const server = http.createServer(async (req, res) => {
    try {
        const url = new URL(req.url, `http://${req.headers.host}`);

        if (url.pathname === '/api/plan-state') {
            if (req.method === 'GET') {
                const state = await readStateFile();
                sendJson(res, 200, state);
                return;
            }

            if (req.method === 'POST') {
                const rawBody = await readRequestBody(req);
                const payload = rawBody.trim() ? JSON.parse(rawBody) : {};
                const saved = await writeStateFile(payload);
                sendJson(res, 200, { ok: true, state: saved });
                return;
            }

            sendJson(res, 405, { ok: false, error: 'Método no permitido.' });
            return;
        }

        const filePath = getSafeFilePath(url.pathname);
        if (!filePath) {
            res.writeHead(403);
            res.end('Acceso denegado.');
            return;
        }

        try {
            const stats = await fs.stat(filePath);
            if (stats.isDirectory()) {
                streamFile(res, path.join(filePath, 'index.html'));
                return;
            }

            streamFile(res, filePath);
        } catch (_error) {
            res.writeHead(404);
            res.end('No encontrado.');
        }
    } catch (error) {
        const statusCode = error instanceof SyntaxError ? 400 : 500;
        sendJson(res, statusCode, {
            ok: false,
            error: error.message || 'Error inesperado.'
        });
    }
});

server.listen(DEFAULT_PORT, () => {
    console.log(`Plan Misional disponible en http://localhost:${DEFAULT_PORT}`);
});
