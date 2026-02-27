// =============================================
// ADMIN — Gestión de Carreras
// =============================================

const carrerasAdmin = {
    data() {
        return {
            carreras: [],
            filtro: '',
            cargando: false,
            guardando: false,
            cargandoSeed: false,
            seedProgress: '',
            form: { idCarrera: null, codigo: '', nombre: '', estado: 'activa' },
            modalAccion: 'crear',
            stats: {} // { idCarrera: { alumnos, materias } }
        };
    },
    async mounted() { await this.cargar(); },
    computed: {
        carrerasFiltradas() {
            const f = this.filtro.toLowerCase().trim();
            if (!f) return this.carreras;
            return this.carreras.filter(c =>
                (c.codigo || '').toLowerCase().includes(f) ||
                (c.nombre || '').toLowerCase().includes(f)
            );
        }
    },
    methods: {
        async cargar() {
            this.cargando = true;
            this.carreras = await db.carreras.orderBy('nombre').toArray();
            // Calcular estadísticas por carrera
            const [alumnos, materias] = await Promise.all([
                db.alumnos.toArray(),
                db.materias.toArray()
            ]);
            const s = {};
            this.carreras.forEach(c => {
                s[c.idCarrera] = {
                    alumnos: alumnos.filter(a =>
                        String(a.carreraId) === String(c.idCarrera) ||
                        (a.carrera || '').toLowerCase() === (c.nombre || '').toLowerCase()
                    ).length,
                    materias: materias.filter(m =>
                        String(m.carreraId) === String(c.idCarrera) ||
                        (m.carrera || '').toLowerCase() === (c.nombre || '').toLowerCase()
                    ).length
                };
            });
            this.stats = s;
            this.cargando = false;
        },
        abrirCrear() {
            this.form = { idCarrera: null, codigo: '', nombre: '', estado: 'activa' };
            this.modalAccion = 'crear';
            this.abrirModal('modalCarrera');
        },
        abrirEditar(c) {
            this.form = { idCarrera: c.idCarrera, codigo: c.codigo, nombre: c.nombre, estado: c.estado || 'activa' };
            this.modalAccion = 'editar';
            this.abrirModal('modalCarrera');
        },
        async guardar() {
            if (!this.form.codigo || !this.form.nombre) {
                alertify.error('Código y nombre son obligatorios.');
                return;
            }
            this.guardando = true;
            try {
                if (this.modalAccion === 'crear') {
                    await db.carreras.add({ codigo: this.form.codigo.toUpperCase().trim(), nombre: this.form.nombre.trim(), estado: this.form.estado });
                    alertify.success('Carrera creada.');
                } else {
                    await db.carreras.update(this.form.idCarrera, { codigo: this.form.codigo.toUpperCase().trim(), nombre: this.form.nombre.trim(), estado: this.form.estado });
                    alertify.success('Carrera actualizada.');
                }
                await this.cargar();
                this.cerrarModal('modalCarrera');
            } finally {
                this.guardando = false;
            }
        },
        async toggleEstado(c) {
            const nuevo = (c.estado || 'activa') === 'activa' ? 'inactiva' : 'activa';
            await db.carreras.update(c.idCarrera, { estado: nuevo });
            c.estado = nuevo;
        },
        abrirModal(id) { new bootstrap.Modal(document.getElementById(id)).show(); },
        cerrarModal(id) { bootstrap.Modal.getInstance(document.getElementById(id))?.hide(); },
        async cargarPlanEstudios() {
            if (this.cargandoSeed) return;
            if (!window.seedUniversidadData) { alertify.error('Módulo de seed no disponible.'); return; }
            alertify.confirm('Cargar Plan de Estudios',
                '¿Deseas importar las 73 carreras y más de 1,000 materias del plan de estudios? Solo se agregarán registros nuevos (no se sobreescribirán existentes).',
                async () => {
                    this.cargandoSeed = true;
                    this.seedProgress = 'Iniciando importación...';
                    try {
                        const r = await seedUniversidadData((c, m) => {
                            this.seedProgress = `${c} carreras, ${m} materias importadas...`;
                        });
                        alertify.success(`✅ Importación completa: ${r.totalCarreras} carreras y ${r.totalMaterias} materias nuevas agregadas.`);
                        await this.cargar();
                    } catch(e) {
                        alertify.error('Error: ' + e.message);
                    } finally {
                        this.cargandoSeed = false;
                        this.seedProgress = '';
                    }
                },
                () => {}
            ).set('labels', { ok: 'Sí, importar', cancel: 'Cancelar' });
        }
    },
    template: `
        <div>
            <div class="d-flex align-items-center mb-3 border-bottom pb-2">
                <i class="bi bi-building me-2 fs-5 text-secondary"></i>
                <h5 class="mb-0 fw-semibold">Gestión de Carreras</h5>
                <div class="d-flex gap-2 ms-auto">
                    <button class="btn btn-sm btn-outline-secondary" @click="cargar"><i class="bi bi-arrow-clockwise"></i></button>
                    <button class="btn btn-sm btn-outline-success fw-semibold" @click="cargarPlanEstudios" :disabled="cargandoSeed"
                            title="Importar el catálogo completo de carreras y materias">
                        <span v-if="cargandoSeed" class="spinner-border spinner-border-sm me-1"></span>
                        <i v-else class="bi bi-cloud-download me-1"></i>
                        {{ cargandoSeed ? seedProgress : 'Cargar Plan de Estudios' }}
                    </button>
                    <button class="btn btn-sm text-white fw-semibold" style="background-color:#1a3a5c;" @click="abrirCrear">
                        <i class="bi bi-plus-lg me-1"></i>Nueva carrera
                    </button>
                </div>
            </div>

            <div class="mb-3" style="max-width:360px;">
                <div class="input-group shadow-sm">
                    <span class="input-group-text bg-body-secondary border-end-0"><i class="bi bi-search text-body-secondary"></i></span>
                    <input v-model="filtro" type="text" class="form-control border-start-0 bg-transparent" placeholder="Buscar carrera...">
                    <button v-if="filtro" class="btn btn-outline-secondary" @click="filtro=''"><i class="bi bi-x"></i></button>
                </div>
            </div>

            <div v-if="cargando" class="text-center py-4"><div class="spinner-border text-secondary"></div></div>
            <div v-else-if="carreras.length===0" class="text-center py-5 text-muted">
                <i class="bi bi-building fs-1 opacity-25"></i>
                <p class="mt-2">No hay carreras registradas. <a href="#" @click.prevent="abrirCrear">Crear una</a>.</p>
            </div>
            <div v-else class="card border-0 shadow-sm bg-body-tertiary">
                <div class="table-responsive">
                    <table class="table table-hover align-middle mb-0 small">
                        <thead class="bg-body-secondary">
                            <tr>
                                <th class="text-body-secondary">Código</th>
                                <th class="text-body-secondary">Nombre</th>
                                <th class="text-center text-body-secondary">Alumnos</th>
                                <th class="text-center text-body-secondary">Materias</th>
                                <th class="text-body-secondary">Estado</th>
                                <th class="text-end text-body-secondary">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="c in carrerasFiltradas" :key="c.idCarrera">
                                <td class="fw-bold">{{ c.codigo }}</td>
                                <td>{{ c.nombre }}</td>
                                <td class="text-center">
                                    <span class="badge bg-primary rounded-pill">{{ stats[c.idCarrera]?.alumnos || 0 }}</span>
                                </td>
                                <td class="text-center">
                                    <span class="badge bg-info bg-opacity-75 text-white rounded-pill">{{ stats[c.idCarrera]?.materias || 0 }}</span>
                                </td>
                                <td>
                                    <span class="badge" :class="(c.estado||'activa')==='activa'?'bg-success':'bg-secondary'">
                                        {{ (c.estado||'activa')==='activa' ? 'Activa' : 'Inactiva' }}
                                    </span>
                                </td>
                                <td class="text-end">
                                    <div class="d-flex justify-content-end gap-1">
                                        <button class="btn btn-sm btn-outline-primary" @click="abrirEditar(c)"><i class="bi bi-pencil"></i></button>
                                        <button class="btn btn-sm" @click="toggleEstado(c)"
                                                :class="(c.estado||'activa')==='activa'?'btn-outline-secondary':'btn-outline-success'">
                                            <i :class="(c.estado||'activa')==='activa'?'bi bi-pause-circle':'bi bi-play-circle'"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="card-footer bg-transparent border-top-0 text-body-secondary small">{{ carrerasFiltradas.length }} carreras</div>
            </div>

            <!-- Modal Crear/Editar -->
            <div class="modal fade" id="modalCarrera" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content border-0 shadow bg-body-tertiary">
                        <div class="modal-header bg-primary bg-opacity-75">
                            <h5 class="modal-title text-white">
                                <i :class="modalAccion==='crear'?'bi bi-plus-circle':'bi bi-pencil'" class="me-2"></i>
                                {{ modalAccion==='crear' ? 'Nueva Carrera' : 'Editar Carrera' }}
                            </h5>
                            <button class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row g-3">
                                <div class="col-4">
                                    <label class="form-label small fw-semibold text-body-secondary text-uppercase">Código *</label>
                                    <input v-model="form.codigo" class="form-control form-control-sm text-uppercase bg-transparent" placeholder="Ej. ING" maxlength="10" required>
                                </div>
                                <div class="col-5">
                                    <label class="form-label small fw-semibold text-body-secondary text-uppercase">Estado</label>
                                    <select v-model="form.estado" class="form-select form-select-sm bg-transparent">
                                        <option value="activa">Activa</option>
                                        <option value="inactiva">Inactiva</option>
                                    </select>
                                </div>
                                <div class="col-12">
                                    <label class="form-label small fw-semibold text-body-secondary text-uppercase">Nombre completo *</label>
                                    <input v-model="form.nombre" class="form-control form-control-sm bg-transparent" placeholder="Ej. Ingeniería en Sistemas" required>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer border-top-0">
                            <button class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Cancelar</button>
                            <button class="btn btn-sm text-white fw-semibold" style="background-color:#1a3a5c;" @click="guardar" :disabled="guardando">
                                <span v-if="guardando" class="spinner-border spinner-border-sm me-1"></span>
                                <i v-else class="bi bi-save me-1"></i>
                                {{ modalAccion==='crear' ? 'Crear' : 'Guardar' }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
};