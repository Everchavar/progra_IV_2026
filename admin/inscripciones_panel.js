// =============================================
// ADMIN — Gestión de Inscripciones
// Vista por materia con cupos y alumnos inscritos
// =============================================

const inscripcionesAdmin = {
    data() {
        return {
            materiasConInscritos: [],
            materiaSeleccionada: null,
            filtro: '',
            cargando: false
        };
    },
    async mounted() { await this.cargar(); },
    computed: {
        materiasFiltradas() {
            const f = this.filtro.toLowerCase().trim();
            if (!f) return this.materiasConInscritos;
            return this.materiasConInscritos.filter(m =>
                (m.codigo || '').toLowerCase().includes(f) ||
                (m.nombre || '').toLowerCase().includes(f)
            );
        }
    },
    methods: {
        async cargar() {
            this.cargando = true;
            const [materias, inscripciones, matriculas] = await Promise.all([
                db.materias.toArray(),
                db.inscripciones.toArray(),
                db.matricula.toArray()
            ]);

            this.materiasConInscritos = materias.map(mat => {
                const inscs = inscripciones.filter(
                    i => String(i.materiaId || i.idMateria) === String(mat.idMateria)
                );
                const inscritosConDatos = inscs.map(i => {
                    const matr = matriculas.find(m => String(m.idMatricula) === String(i.matriculaId || i.idMatricula));
                    return {
                        ...i,
                        nombreAlumno: i.alumno || matr?.nombreAlumno || '—',
                        cicloMatricula: matr?.ciclo || i.ciclo || '—',
                        codigoMatricula: matr?.codigo || '—'
                    };
                });
                return {
                    ...mat,
                    inscritos: inscritosConDatos,
                    cupoOcupado: inscs.length,
                    cupoMax: mat.cupo || 0,
                    estado: mat.estado || 'habilitada'
                };
            }).sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));

            if (this.materiaSeleccionada) {
                this.materiaSeleccionada = this.materiasConInscritos.find(
                    m => String(m.idMateria) === String(this.materiaSeleccionada.idMateria)
                ) || null;
            }
            this.cargando = false;
        },
        seleccionar(m) {
            this.materiaSeleccionada = this.materiaSeleccionada?.idMateria === m.idMateria ? null : m;
        },
        porcentaje(m) {
            if (!m.cupoMax) return 0;
            return Math.min(Math.round(m.cupoOcupado / m.cupoMax * 100), 100);
        },
        colorBarra(m) {
            const p = this.porcentaje(m);
            if (p >= 100) return 'bg-danger';
            if (p >= 80)  return 'bg-warning';
            return 'bg-success';
        },
        async eliminarInscripcion(inscripcion) {
            alertify.confirm(
                'Eliminar inscripción',
                `¿Quitar a "${inscripcion.nombreAlumno}" de esta materia?`,
                async () => {
                    await db.inscripciones.delete(inscripcion.idInscripcion);
                    alertify.success('Inscripción eliminada.');
                    await this.cargar();
                },
                () => {}
            ).set('labels', { ok: 'Sí, eliminar', cancel: 'Cancelar' });
        }
    },
    template: `
        <div>
            <div class="d-flex align-items-center mb-3 border-bottom pb-2">
                <i class="bi bi-pencil-square me-2 fs-5 text-secondary"></i>
                <h5 class="mb-0 fw-semibold">Gestión de Inscripciones</h5>
                <button class="btn btn-sm btn-outline-secondary ms-auto" @click="cargar">
                    <i class="bi bi-arrow-clockwise"></i>
                </button>
            </div>

            <div class="mb-3" style="max-width:400px;">
                <div class="input-group shadow-sm">
                    <span class="input-group-text bg-body-secondary border-end-0"><i class="bi bi-search text-body-secondary"></i></span>
                    <input v-model="filtro" type="text" class="form-control border-start-0 bg-transparent"
                           placeholder="Filtrar por materia...">
                    <button v-if="filtro" class="btn btn-outline-secondary" @click="filtro=''">
                        <i class="bi bi-x"></i>
                    </button>
                </div>
            </div>

            <div v-if="cargando" class="text-center py-4"><div class="spinner-border text-secondary"></div></div>
            <div v-else-if="materiasConInscritos.length===0" class="text-center py-5 text-muted">
                <i class="bi bi-pencil-square fs-1 opacity-25"></i>
                <p class="mt-2">No hay materias registradas.</p>
            </div>

            <div v-else class="row g-3">
                <!-- Columna izquierda: lista de materias -->
                <div :class="materiaSeleccionada ? 'col-md-5' : 'col-12'">
                    <div class="card border-0 shadow-sm">
                        <div class="list-group list-group-flush">
                            <button v-for="m in materiasFiltradas" :key="m.idMateria"
                                    class="list-group-item list-group-item-action d-flex flex-column gap-1 px-3 py-2"
                                    :class="materiaSeleccionada?.idMateria===m.idMateria ? 'active' : ''"
                                    @click="seleccionar(m)">
                                <div class="d-flex justify-content-between align-items-start">
                                    <div class="fw-semibold small">{{ m.nombre }}</div>
                                    <span class="badge ms-2 flex-shrink-0"
                                          :class="m.cupoOcupado>0 ? (materiaSeleccionada?.idMateria===m.idMateria ? 'bg-white text-primary' : 'bg-primary') : 'bg-body-secondary text-body-secondary'">
                                        {{ m.cupoOcupado }} inscritos
                                    </span>
                                </div>
                                <div class="d-flex align-items-center gap-2">
                                    <div class="progress flex-grow-1" style="height:5px;" v-if="m.cupoMax>0">
                                        <div class="progress-bar"
                                             :class="materiaSeleccionada?.idMateria===m.idMateria ? 'bg-white' : colorBarra(m)"
                                             :style="'width:'+porcentaje(m)+'%'"></div>
                                    </div>
                                    <small class="text-nowrap opacity-75">
                                        {{ m.cupoOcupado }}/{{ m.cupoMax || '∞' }}
                                        <span v-if="m.cupoMax>0 && m.cupoOcupado>=m.cupoMax" class="text-danger fw-bold"> LLENO</span>
                                    </small>
                                </div>
                                <div class="d-flex gap-1">
                                    <span class="badge" style="font-size:.65rem;"
                                          :class="m.estado==='habilitada' ? 'bg-success' : 'bg-secondary'">
                                        {{ m.estado==='habilitada' ? 'Habilitada' : 'Deshabilitada' }}
                                    </span>
                                    <small class="text-muted opacity-75">{{ m.codigo }}</small>
                                </div>
                            </button>
                        </div>
                        <div class="card-footer bg-transparent border-top-0 text-body-secondary small">
                            {{ materiasFiltradas.length }} materias
                        </div>
                    </div>
                </div>

                <!-- Columna derecha: detalle de inscritos -->
                <div v-if="materiaSeleccionada" class="col-md-7">
                    <div class="card border-0 shadow-sm h-100 bg-body-tertiary">
                        <div class="card-header bg-transparent border-bottom d-flex align-items-center justify-content-between py-3">
                            <div>
                                <div class="fw-bold text-primary">{{ materiaSeleccionada.nombre }}</div>
                                <small class="text-body-secondary fw-semibold">{{ materiaSeleccionada.codigo }}</small>
                            </div>
                            <button class="btn btn-sm btn-outline-secondary rounded-circle" @click="materiaSeleccionada=null" style="width:32px;height:32px;padding:0;">
                                <i class="bi bi-x fs-5"></i>
                            </button>
                        </div>

                        <!-- Barra de cupo grande -->
                        <div class="p-3 border-bottom">
                            <div class="d-flex justify-content-between small fw-semibold mb-1">
                                <span>Cupo ocupado</span>
                                <span :class="materiaSeleccionada.cupoMax>0 && materiaSeleccionada.cupoOcupado>=materiaSeleccionada.cupoMax ? 'text-danger' : 'text-success'">
                                    {{ materiaSeleccionada.cupoOcupado }} / {{ materiaSeleccionada.cupoMax || '∞' }}
                                </span>
                            </div>
                            <div class="progress" style="height:10px;" v-if="materiaSeleccionada.cupoMax>0">
                                <div class="progress-bar" :class="colorBarra(materiaSeleccionada)"
                                     :style="'width:'+porcentaje(materiaSeleccionada)+'%'"></div>
                            </div>
                            <div v-if="materiaSeleccionada.cupoMax>0 && materiaSeleccionada.cupoOcupado>=materiaSeleccionada.cupoMax"
                                 class="text-danger fw-semibold small mt-1">
                                <i class="bi bi-exclamation-triangle-fill me-1"></i>CUPO LLENO — Sin lugares disponibles
                            </div>
                            <div v-else-if="materiaSeleccionada.cupoMax>0" class="text-success small mt-1">
                                <i class="bi bi-check-circle me-1"></i>
                                {{ materiaSeleccionada.cupoMax - materiaSeleccionada.cupoOcupado }} lugar(es) disponible(s)
                            </div>
                        </div>

                        <!-- Lista de alumnos inscritos -->
                        <div class="card-body p-0">
                            <div v-if="materiaSeleccionada.inscritos.length===0"
                                 class="text-center py-5 text-muted">
                                <i class="bi bi-person-x fs-2 opacity-25"></i>
                                <p class="small mt-2">Ningún alumno inscrito en esta materia.</p>
                            </div>
                            <div v-else class="table-responsive">
                                <table class="table table-hover align-middle mb-0 small">
                                    <thead class="bg-body-secondary">
                                        <tr>
                                            <th class="text-body-secondary">Alumno</th>
                                            <th class="text-body-secondary">Matrícula</th>
                                            <th class="text-body-secondary">Ciclo</th>
                                            <th class="text-end text-body-secondary">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="i in materiaSeleccionada.inscritos" :key="i.idInscripcion">
                                            <td class="fw-semibold text-body">{{ i.nombreAlumno }}</td>
                                            <td class="text-body-secondary">{{ i.codigoMatricula }}</td>
                                            <td class="text-body-secondary">{{ i.cicloMatricula }}</td>
                                            <td class="text-end">
                                                <button class="btn btn-sm btn-outline-danger" @click="eliminarInscripcion(i)" title="Eliminar inscripción">
                                                    <i class="bi bi-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
};