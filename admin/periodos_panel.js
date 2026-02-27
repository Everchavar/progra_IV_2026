// =============================================
// ADMIN — Gestión de Períodos de Matrícula
// =============================================

const periodosAdmin = {
    data() {
        return {
            periodos: [],
            cargando: false,
            form: { año: new Date().getFullYear(), ciclo: 'I' },
            guardando: false
        };
    },
    async mounted() { await this.cargar(); },
    computed: {
        periodoAbierto() { return this.periodos.find(p => p.estado === 'abierto') || null; }
    },
    methods: {
        async cargar() {
            this.cargando = true;
            this.periodos = await db.periodos.orderBy('idPeriodo').toArray();
            this.periodos.reverse(); // más reciente primero
            this.cargando = false;
        },
        async abrirPeriodo() {
            if (!this.form.año || !this.form.ciclo) {
                alertify.error('Completa el año y el ciclo.');
                return;
            }
            // Verificar que no exista ya ese período
            const existente = await db.periodos
                .filter(p => String(p.año) === String(this.form.año) && p.ciclo === this.form.ciclo)
                .first();
            if (existente) {
                alertify.error(`El ciclo ${this.form.ciclo} - ${this.form.año} ya existe.`);
                return;
            }
            this.guardando = true;
            try {
                // Cerrar todos los períodos abiertos
                const abiertos = this.periodos.filter(p => p.estado === 'abierto');
                for (const p of abiertos) {
                    await db.periodos.update(p.idPeriodo, { estado: 'cerrado' });
                }
                // Crear nuevo período abierto
                await db.periodos.add({
                    año: parseInt(this.form.año),
                    ciclo: this.form.ciclo,
                    estado: 'abierto',
                    fechaCreacion: new Date().toISOString()
                });
                await this.cargar();
                alertify.success(`Período ${this.form.ciclo} - ${this.form.año} abierto correctamente.`);
            } finally {
                this.guardando = false;
            }
        },
        async cerrarPeriodo(p) {
            alertify.confirm(
                'Cerrar período',
                `¿Cerrar el período ${p.ciclo} - ${p.año}? Los alumnos ya no podrán inscribirse.`,
                async () => {
                    await db.periodos.update(p.idPeriodo, { estado: 'cerrado' });
                    await this.cargar();
                    alertify.success('Período cerrado.');
                },
                () => {}
            ).set('labels', { ok: 'Sí, cerrar', cancel: 'Cancelar' });
        },
        async reabrirPeriodo(p) {
            // Cerrar otros abiertos y reabrir este
            const abiertos = this.periodos.filter(pa => pa.estado === 'abierto');
            for (const pa of abiertos) {
                await db.periodos.update(pa.idPeriodo, { estado: 'cerrado' });
            }
            await db.periodos.update(p.idPeriodo, { estado: 'abierto' });
            await this.cargar();
            alertify.success(`Período ${p.ciclo} - ${p.año} reabierto.`);
        }
    },
    template: `
        <div>
            <div class="d-flex align-items-center mb-3 border-bottom pb-2">
                <i class="bi bi-calendar-check me-2 fs-5 text-secondary"></i>
                <h5 class="mb-0 fw-semibold">Períodos de Matrícula</h5>
                <button class="btn btn-sm btn-outline-secondary ms-auto" @click="cargar">
                    <i class="bi bi-arrow-clockwise"></i>
                </button>
            </div>

            <!-- Estado del período actual -->
            <div class="alert d-flex align-items-center gap-3 mb-4"
                 :class="periodoAbierto ? 'alert-success' : 'alert-warning'">
                <i :class="periodoAbierto ? 'bi bi-calendar-check-fill' : 'bi bi-calendar-x-fill'" class="fs-3"></i>
                <div>
                    <div class="fw-semibold">
                        {{ periodoAbierto ? 'Período actualmente ABIERTO' : 'No hay período activo' }}
                    </div>
                    <small v-if="periodoAbierto">
                        Ciclo <strong>{{ periodoAbierto.ciclo }}</strong> — Año <strong>{{ periodoAbierto.año }}</strong>.
                        Los alumnos pueden inscribirse.
                    </small>
                    <small v-else>Crea y abre un período para que los alumnos puedan inscribirse.</small>
                </div>
            </div>

            <!-- Formulario nuevo período -->
            <div class="card border-0 shadow-sm mb-4 bg-body-tertiary" style="max-width:420px;">
                <div class="card-header bg-transparent border-bottom fw-bold small text-uppercase text-body-secondary py-3">
                    <i class="bi bi-plus-circle me-1"></i>Abrir nuevo período
                </div>
                <div class="card-body">
                    <div class="row g-2">
                        <div class="col-5">
                            <label class="form-label small fw-semibold text-body-secondary text-uppercase">Año</label>
                            <input v-model.number="form.año" type="number" min="2020" max="2030"
                                   class="form-control form-control-sm bg-transparent">
                        </div>
                        <div class="col-4">
                            <label class="form-label small fw-semibold text-body-secondary text-uppercase">Ciclo</label>
                            <select v-model="form.ciclo" class="form-select form-select-sm bg-transparent">
                                <option>I</option>
                                <option>II</option>
                                <option>III</option>
                            </select>
                        </div>
                        <div class="col-3 d-flex align-items-end">
                            <button class="btn btn-sm w-100 text-white fw-semibold" style="background-color:#1a3a5c;"
                                    @click="abrirPeriodo" :disabled="guardando">
                                <span v-if="guardando" class="spinner-border spinner-border-sm"></span>
                                <i v-else class="bi bi-unlock-fill"></i>
                                Abrir
                            </button>
                        </div>
                    </div>
                    <div class="text-body-secondary mt-2" style="font-size:.72rem;">
                        <i class="bi bi-info-circle me-1"></i>Al abrir un nuevo período, el anterior se cerrará automáticamente.
                    </div>
                </div>
            </div>

            <!-- Historial de períodos -->
            <div v-if="cargando" class="text-center py-4"><div class="spinner-border text-secondary"></div></div>
            <div v-else-if="periodos.length===0" class="text-center py-4 text-muted">
                <i class="bi bi-calendar fs-1 opacity-25"></i>
                <p class="mt-2 small">No hay períodos registrados aún.</p>
            </div>
            <div v-else class="card border-0 shadow-sm bg-body-tertiary">
                <div class="card-header bg-transparent border-bottom small fw-bold text-body-secondary text-uppercase py-3">
                    <i class="bi bi-list-ul me-1"></i>Historial de períodos
                </div>
                <div class="table-responsive">
                    <table class="table table-hover align-middle mb-0 small">
                        <thead class="bg-body-secondary">
                            <tr>
                                <th class="text-body-secondary">Ciclo</th>
                                <th class="text-body-secondary">Año</th>
                                <th class="text-body-secondary">Estado</th>
                                <th class="text-body-secondary">Creado</th>
                                <th class="text-end text-body-secondary">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="p in periodos" :key="p.idPeriodo">
                                <td class="fw-bold">{{ p.ciclo }}</td>
                                <td>{{ p.año }}</td>
                                <td>
                                    <span class="badge" :class="p.estado==='abierto' ? 'bg-success' : 'bg-secondary'">
                                        <i :class="p.estado==='abierto' ? 'bi bi-unlock-fill' : 'bi bi-lock-fill'" class="me-1"></i>
                                        {{ p.estado==='abierto' ? 'Abierto' : 'Cerrado' }}
                                    </span>
                                </td>
                                <td class="text-body-secondary">{{ p.fechaCreacion ? new Date(p.fechaCreacion).toLocaleDateString('es') : '—' }}</td>
                                <td class="text-end">
                                    <button v-if="p.estado==='abierto'" class="btn btn-sm btn-outline-danger"
                                            @click="cerrarPeriodo(p)">
                                        <i class="bi bi-lock me-1"></i>Cerrar
                                    </button>
                                    <button v-else class="btn btn-sm btn-outline-success"
                                            @click="reabrirPeriodo(p)">
                                        <i class="bi bi-unlock me-1"></i>Reabrir
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `
};