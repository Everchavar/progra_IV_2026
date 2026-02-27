// =============================================
// ADMIN — Gestión de Materias
// =============================================

const materiasAdmin = {
    data() {
        return {
            materias: [],
            docentes: [],
            carreras: [],
            filtro: '',
            filtroCarrera: '',
            cargando: false,
            // Modal crear/editar
            modal: { abierto: false, accion: 'crear' },
            form: { idMateria: null, codigo: '', nombre: '', cupo: 30, docenteId: '', carreraId: '', carrera: '', estado: 'habilitada' },
            guardando: false,
            // Cupos calculados dinámicamente
            cuposOcupados: {}
        };
    },
    async mounted() { await this.cargar(); },
    computed: {
        materiasFiltradas() {
            let r = this.materias;
            const f = this.filtro.toLowerCase().trim();
            if (f) r = r.filter(m => (m.codigo||'').toLowerCase().includes(f) || (m.nombre||'').toLowerCase().includes(f));
            if (this.filtroCarrera) r = r.filter(m => (m.carrera||'') === this.filtroCarrera);
            return r;
        },
        carrerasUnicas() {
            return [...new Set(this.materias.map(m => m.carrera).filter(Boolean))];
        },
        docenteSeleccionado() {
            if (!this.form.docenteId) return null;
            return this.docentes.find(d => String(d.idDocente) === String(this.form.docenteId)) || null;
        }
    },
    methods: {
        async cargar() {
            this.cargando = true;
            [this.materias, this.docentes, this.carreras] = await Promise.all([
                db.materias.orderBy('nombre').toArray(),
                db.docentes.filter(d => (d.estado || 'activo') === 'activo').toArray(),
                db.carreras.orderBy('nombre').toArray()
            ]);
            // Calcular cupos ocupados por materia
            const inscripciones = await db.inscripciones.toArray();
            const mapa = {};
            inscripciones.forEach(i => {
                const k = String(i.materiaId || i.idMateria);
                mapa[k] = (mapa[k] || 0) + 1;
            });
            this.cuposOcupados = mapa;
            this.cargando = false;
        },
        estado(m) { return m.estado || 'habilitada'; },
        cupoOcupado(m) { return this.cuposOcupados[String(m.idMateria)] || 0; },
        cupoMax(m) { return m.cupo || 0; },
        porcentajeCupo(m) {
            if (!this.cupoMax(m)) return 0;
            return Math.min(Math.round(this.cupoOcupado(m) / this.cupoMax(m) * 100), 100);
        },
        colorCupo(m) {
            const p = this.porcentajeCupo(m);
            if (p >= 100) return 'bg-danger';
            if (p >= 80)  return 'bg-warning';
            return 'bg-success';
        },
        nombreDocente(m) {
            if (!m.docenteId) return m.docente || '—';
            const d = this.docentes.find(d => String(d.idDocente) === String(m.docenteId));
            return d ? d.nombre : (m.docente || '—');
        },
        abrirCrear() {
            this.form = { idMateria: null, codigo: '', nombre: '', cupo: 30, docenteId: '', carreraId: '', carrera: '', estado: 'habilitada' };
            this.modal.accion = 'crear';
            this.abrirModal('modalMateria');
        },
        abrirEditar(m) {
            this.form = { idMateria: m.idMateria, codigo: m.codigo, nombre: m.nombre, cupo: m.cupo || 0, docenteId: String(m.docenteId || ''), carreraId: String(m.carreraId || ''), carrera: m.carrera || '', estado: this.estado(m) };
            this.modal.accion = 'editar';
            this.abrirModal('modalMateria');
        },
        async guardar() {
            if (!this.form.codigo || !this.form.nombre) {
                alertify.error('Código y nombre son obligatorios.');
                return;
            }
            this.guardando = true;
            const carObj = this.form.carreraId ? this.carreras.find(c => String(c.idCarrera) === String(this.form.carreraId)) : null;
            const datos = {
                codigo: this.form.codigo.trim(),
                nombre: this.form.nombre.trim(),
                cupo: parseInt(this.form.cupo) || 0,
                docenteId: this.form.docenteId || '',
                carreraId: this.form.carreraId || '',
                carrera: carObj ? carObj.nombre : (this.form.carrera || ''),
                estado: this.form.estado
            };
            try {
                if (this.modal.accion === 'crear') {
                    datos.idMateria = 'M-' + Date.now();
                    await db.materias.add(datos);
                    alertify.success('Materia creada.');
                } else {
                    await db.materias.update(this.form.idMateria, datos);
                    alertify.success('Materia actualizada.');
                }
                await this.cargar();
                this.cerrarModal('modalMateria');
            } finally {
                this.guardando = false;
            }
        },
        async eliminar(m) {
            const ocupado = this.cupoOcupado(m);
            if (ocupado > 0) {
                alertify.error(`No se puede eliminar: hay ${ocupado} alumno(s) inscrito(s) en esta materia.`);
                return;
            }
            alertify.confirm(
                'Eliminar materia',
                `¿Eliminar "${m.nombre}"? Esta acción no se puede deshacer.`,
                async () => {
                    await db.materias.delete(m.idMateria);
                    await this.cargar();
                    alertify.success('Materia eliminada.');
                },
                () => {}
            ).set('labels', { ok: 'Sí, eliminar', cancel: 'Cancelar' });
        },
        async toggleEstado(m) {
            const nuevo = this.estado(m) === 'habilitada' ? 'deshabilitada' : 'habilitada';
            await db.materias.update(m.idMateria, { estado: nuevo });
            m.estado = nuevo;
            alertify.success(`Materia ${nuevo}.`);
        },
        abrirModal(id) { new bootstrap.Modal(document.getElementById(id)).show(); },
        cerrarModal(id) { bootstrap.Modal.getInstance(document.getElementById(id))?.hide(); }
    },
    template: `
        <div>
            <div class="d-flex align-items-center mb-3 border-bottom pb-2">
                <i class="bi bi-book me-2 fs-5 text-secondary"></i>
                <h5 class="mb-0 fw-semibold">Gestión de Materias</h5>
                <div class="d-flex gap-2 ms-auto">
                    <button class="btn btn-sm btn-outline-secondary" @click="cargar">
                        <i class="bi bi-arrow-clockwise"></i>
                    </button>
                    <button class="btn btn-sm text-white fw-semibold" style="background-color:#1a3a5c;" @click="abrirCrear">
                        <i class="bi bi-plus-lg me-1"></i>Nueva materia
                    </button>
                </div>
            </div>

            <!-- Barra de búsqueda -->
            <div class="mb-2" style="max-width:480px;">
                <div class="input-group shadow-sm">
                    <span class="input-group-text bg-body-secondary border-end-0"><i class="bi bi-search text-body-secondary"></i></span>
                    <input v-model="filtro" type="text" class="form-control border-start-0 bg-transparent"
                           placeholder="Buscar por código o nombre...">
                    <button v-if="filtro" class="btn btn-outline-secondary" @click="filtro=''"><i class="bi bi-x"></i></button>
                </div>
            </div>

            <!-- Chips de filtro por carrera -->
            <div class="d-flex flex-wrap gap-1 mb-3 p-2 bg-body-secondary bg-opacity-25 rounded border border-secondary-subtle" style="max-height:320px;overflow-y:auto;">
                <button class="btn btn-sm" :class="!filtroCarrera?'btn-dark':'btn-outline-secondary'"
                        @click="filtroCarrera=''">
                    <i class="bi bi-grid-3x3-gap me-1"></i>Todas
                </button>
                <button v-for="c in carrerasUnicas" :key="c" class="btn btn-sm"
                        :class="filtroCarrera===c?'btn-dark':'btn-outline-secondary'"
                        @click="filtroCarrera===c ? filtroCarrera='' : filtroCarrera=c"
                        :title="c">
                    {{ c }}
                </button>
            </div>

            <div v-if="cargando" class="text-center py-4"><div class="spinner-border text-secondary"></div></div>
            <div v-else-if="materias.length===0" class="text-center py-5 text-muted">
                <i class="bi bi-book fs-1 opacity-25"></i>
                <p class="mt-2">No hay materias registradas. <a href="#" @click.prevent="abrirCrear">Crear una</a>.</p>
            </div>
            <div v-else class="card border-0 shadow-sm bg-body-tertiary">
                <div class="table-responsive">
                    <table class="table table-hover align-middle mb-0 small">
                        <thead class="bg-body-secondary">
                            <tr>
                                <th class="text-body-secondary">Código</th>
                                <th class="text-body-secondary">Nombre</th>
                                <th class="text-body-secondary">Carrera</th>
                                <th class="text-body-secondary">Docente</th>
                                <th style="min-width:150px;" class="text-body-secondary">Cupo</th>
                                <th class="text-body-secondary">Estado</th>
                                <th class="text-end text-body-secondary">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="m in materiasFiltradas" :key="m.idMateria"
                                :class="estado(m)==='deshabilitada' ? 'table-light text-muted' : ''">
                                <td class="fw-semibold">{{ m.codigo }}</td>
                                <td>{{ m.nombre }}</td>
                                <td><span class="badge bg-body-secondary text-body-secondary border border-secondary-subtle">{{ m.carrera || '—' }}</span></td>
                                <td>{{ nombreDocente(m) }}</td>
                                <td>
                                    <div class="d-flex align-items-center gap-2">
                                        <div class="progress flex-grow-1" style="height:8px;" v-if="cupoMax(m)>0">
                                            <div class="progress-bar" :class="colorCupo(m)"
                                                 :style="'width:'+porcentajeCupo(m)+'%'"></div>
                                        </div>
                                        <small class="text-nowrap fw-semibold"
                                               :class="cupoOcupado(m)>=cupoMax(m)&&cupoMax(m)>0 ? 'text-danger' : ''">
                                            {{ cupoOcupado(m) }}/{{ cupoMax(m) || '∞' }}
                                        </small>
                                    </div>
                                    <small v-if="cupoOcupado(m)>=cupoMax(m)&&cupoMax(m)>0" class="text-danger">CUPO LLENO</small>
                                </td>
                                <td>
                                    <span class="badge" :class="estado(m)==='habilitada' ? 'bg-success' : 'bg-secondary'">
                                        {{ estado(m)==='habilitada' ? 'Habilitada' : 'Deshabilitada' }}
                                    </span>
                                </td>
                                <td class="text-end">
                                    <div class="d-flex gap-1 justify-content-end">
                                        <button class="btn btn-sm btn-outline-primary" @click="abrirEditar(m)" title="Editar">
                                            <i class="bi bi-pencil"></i>
                                        </button>
                                        <button class="btn btn-sm" @click="toggleEstado(m)" title="Habilitar/Deshabilitar"
                                                :class="estado(m)==='habilitada' ? 'btn-outline-warning' : 'btn-outline-success'">
                                            <i :class="estado(m)==='habilitada' ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                                        </button>
                                        <button class="btn btn-sm btn-outline-danger" @click="eliminar(m)" title="Eliminar">
                                            <i class="bi bi-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="card-footer bg-transparent border-top-0 text-body-secondary small">
                    {{ materiasFiltradas.length }} materias — <span class="text-danger fw-semibold">Solo se puede eliminar si no tienen inscritos</span>
                </div>
            </div>

            <!-- Modal Crear/Editar -->
            <div class="modal fade" id="modalMateria" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content border-0 shadow bg-body-tertiary">
                        <div class="modal-header bg-primary bg-opacity-75">
                            <h5 class="modal-title text-white">
                                <i :class="modal.accion==='crear' ? 'bi bi-plus-circle' : 'bi bi-pencil'" class="me-2"></i>
                                {{ modal.accion==='crear' ? 'Nueva Materia' : 'Editar Materia' }}
                            </h5>
                            <button class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row g-3">
                                <div class="col-5">
                                    <label class="form-label small fw-semibold text-body-secondary text-uppercase">Código *</label>
                                    <input v-model="form.codigo" class="form-control form-control-sm bg-transparent" placeholder="Ej. MAT-101" required>
                                </div>
                                <div class="col-4">
                                    <label class="form-label small fw-semibold text-body-secondary text-uppercase">Cupo máx.</label>
                                    <input v-model.number="form.cupo" type="number" min="0" class="form-control form-control-sm bg-transparent">
                                </div>
                                <div class="col-3">
                                    <label class="form-label small fw-semibold text-body-secondary text-uppercase">Estado</label>
                                    <select v-model="form.estado" class="form-select form-select-sm bg-transparent">
                                        <option value="habilitada">Habilitada</option>
                                        <option value="deshabilitada">Deshabilitada</option>
                                    </select>
                                </div>
                                <div class="col-12">
                                    <label class="form-label small fw-semibold text-body-secondary text-uppercase">Nombre *</label>
                                    <input v-model="form.nombre" class="form-control form-control-sm bg-transparent" placeholder="Nombre completo de la materia" required>
                                </div>
                                <div class="col-12">
                                    <label class="form-label small fw-semibold text-body-secondary text-uppercase">Docente asignado</label>
                                    <select v-model="form.docenteId" class="form-select form-select-sm bg-transparent">
                                        <option value="">— Sin asignar —</option>
                                        <option v-for="d in docentes" :key="d.idDocente" :value="String(d.idDocente)">
                                            {{ d.nombre }} — {{ d.escalafon || '?' }} ({{ d.especialidad || 'S/E' }})
                                        </option>
                                    </select>
                                    <!-- Info Docente Seleccionado -->
                                    <div v-if="docenteSeleccionado" class="mt-2 p-2 bg-body-secondary border border-secondary-subtle rounded small d-flex gap-2 align-items-center">
                                        <img :src="docenteSeleccionado.foto || 'https://via.placeholder.com/40'" class="rounded-circle border" style="width:40px;height:40px;object-fit:cover;">
                                        <div>
                                            <div class="fw-bold text-body">{{ docenteSeleccionado.nombre }}</div>
                                            <div class="text-body-secondary" style="font-size:0.8em;">
                                                <span class="badge bg-body text-body-secondary border border-secondary-subtle me-1">{{ docenteSeleccionado.escalafon || 'Sin escalafón' }}</span>
                                                {{ docenteSeleccionado.especialidad || 'Sin especialidad' }}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-12">
                                    <label class="form-label small fw-semibold text-body-secondary text-uppercase">Carrera</label>
                                    <select v-model="form.carreraId" class="form-select form-select-sm bg-transparent">
                                        <option value="">— Sin carrera (materia general) —</option>
                                        <option v-for="c in carreras" :key="c.idCarrera" :value="String(c.idCarrera)">
                                            {{ c.nombre }} ({{ c.codigo }})
                                        </option>
                                    </select>
                                    <div class="form-text text-body-secondary">Las materias sin carrera serán visibles para todos los alumnos.</div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer border-top-0">
                            <button class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Cancelar</button>
                            <button class="btn btn-sm text-white fw-semibold" style="background-color:#1a3a5c;"
                                    @click="guardar" :disabled="guardando">
                                <span v-if="guardando" class="spinner-border spinner-border-sm me-1"></span>
                                <i v-else class="bi bi-save me-1"></i>
                                {{ modal.accion==='crear' ? 'Crear materia' : 'Guardar cambios' }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
};