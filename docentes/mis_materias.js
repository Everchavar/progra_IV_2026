// =============================================
// DOCENTE — Mis Materias
// Vista de materias asignadas + alumnos inscritos
// =============================================

const misMaterias = {
    data() {
        return {
            materias: [],
            filtroCarrera: '',
            materiaDetalle: null,
            alumnosDetalle: [],
            cargando: false,
            cargandoDetalle: false
        };
    },
    async mounted() { await this.cargar(); },
    computed: {
        materiasFiltradas() {
            if (!this.filtroCarrera) return this.materias;
            return this.materias.filter(m =>
                (m.carrera || '').toLowerCase().includes(this.filtroCarrera.toLowerCase())
            );
        },
        carrerasUnicas() {
            return [...new Set(this.materias.map(m => m.carrera).filter(Boolean))];
        }
    },
    methods: {
        async cargar() {
            this.cargando = true;
            try {
                const s = JSON.parse(sessionStorage.getItem('sesionUniversidad') || '{}');
                const userId = s.id;
                if (!userId) { this.cargando = false; return; }

                const docente = await db.docentes.where('usuarioId').equals(userId).first();
                if (!docente) { this.cargando = false; return; }

                const todasMaterias = await db.materias.where('docenteId').equals(docente.idDocente).toArray();
                const inscripciones = await db.inscripciones.toArray();

                this.materias = todasMaterias.map(mat => {
                    const inscs = inscripciones.filter(i => String(i.idMateria) === String(mat.idMateria));
                    return {
                        ...mat,
                        totalInscritos: inscs.length,
                        cupoOcupado: inscs.length,
                        distribCarrera: {}, // Opcional: implementar join con carreras si es necesario
                        estado: mat.estado || 'habilitada'
                    };
                });
            } catch (e) {
                console.error(e);
            } finally {
                this.cargando = false;
            }
        },
        async verDetalle(mat) {
            this.materiaDetalle = mat;
            this.cargandoDetalle = true;

            try {
                const [inscripciones, evaluaciones, alumnos, perfiles] = await Promise.all([
                    db.inscripciones.filter(i => String(i.idMateria) === String(mat.idMateria)).toArray(),
                    db.evaluaciones.filter(e => String(e.idMateria) === String(mat.idMateria)).toArray(),
                    db.alumnos.toArray(),
                    db.perfiles.toArray()
                ]);

                this.alumnosDetalle = inscripciones.map(insc => {
                    const alumnoObj = alumnos.find(a => a.idAlumno === insc.idAlumno);
                    const perfilObj = alumnoObj ? perfiles.find(p => p.usuarioId === alumnoObj.usuarioId) : null;
                    
                    const evsAlumno = evaluaciones.filter(e => String(e.idInscripcion) === String(insc.idInscripcion));
                    const computos = [1,2,3].map(c => evsAlumno.find(e => e.computo === c));
                    const notaFinal = computos.filter(c => c?.notaComputo != null).length > 0
                        ? (computos.reduce((s, c) => s + (c?.notaComputo ? parseFloat(c.notaComputo) : 0), 0) /
                           computos.filter(c => c?.notaComputo != null).length).toFixed(2)
                        : null;

                    return {
                        nombre: perfilObj?.nombre || 'Desconocido',
                        carrera: alumnoObj?.carreraId || '—', // Opcional: join con carreras
                        matricula: insc.idInscripcion, 
                        comp1: computos[0]?.notaComputo ?? '—',
                        comp2: computos[1]?.notaComputo ?? '—',
                        comp3: computos[2]?.notaComputo ?? '—',
                        notaFinal,
                        aprobado: notaFinal !== null ? parseFloat(notaFinal) >= 6 : null
                    };
                }).sort((a, b) => (parseFloat(b.notaFinal) || 0) - (parseFloat(a.notaFinal) || 0));
            } catch (e) {
                console.error(e);
            } finally {
                this.cargandoDetalle = false;
            }
        },
        cerrarDetalle() { this.materiaDetalle = null; this.alumnosDetalle = []; }
    },
    template: `
        <div>
            <div class="d-flex align-items-center mb-3 border-bottom pb-2">
                <i class="bi bi-book me-2 fs-5 text-body-secondary"></i>
                <h5 class="mb-0 fw-semibold">Mis Materias</h5>
                <button class="btn btn-sm btn-outline-secondary ms-auto" @click="cargar"><i class="bi bi-arrow-clockwise"></i></button>
            </div>

            <div v-if="!window?.docenteData" class="alert alert-warning">
                Perfil de docente no vinculado. Contacta al administrador.
            </div>
            <div v-else-if="cargando" class="text-center py-4"><div class="spinner-border text-secondary"></div></div>
            <div v-else-if="materias.length===0" class="text-center py-5 text-muted">
                <i class="bi bi-book fs-1 opacity-25"></i>
                <p class="mt-2">No hay materias asignadas a tu perfil.</p>
            </div>

            <div v-else>
                <!-- Filtro por carrera -->
                <div v-if="carrerasUnicas.length>0" class="mb-3 d-flex gap-2 flex-wrap">
                    <button class="btn btn-sm" :class="!filtroCarrera?'btn-primary':'btn-outline-secondary'" @click="filtroCarrera=''">Todas</button>
                    <button v-for="c in carrerasUnicas" :key="c" class="btn btn-sm"
                            :class="filtroCarrera===c?'btn-primary':'btn-outline-secondary'" @click="filtroCarrera=c">
                        {{ c }}
                    </button>
                </div>

                <!-- Vista de 2 columnas si hay detalle seleccionado -->
                <div :class="materiaDetalle ? 'row g-3' : ''">
                    <div :class="materiaDetalle ? 'col-md-5' : 'col-12'">
                        <div class="row g-3" :class="materiaDetalle ? 'row-cols-1' : 'row-cols-1 row-cols-md-2 row-cols-xl-3'">
                            <div v-for="mat in materiasFiltradas" :key="mat.idMateria" class="col">
                                <div class="card border-0 shadow-sm h-100 bg-body-tertiary"
                                     :class="materiaDetalle?.idMateria===mat.idMateria?'border-success border':''"
                                     style="cursor:pointer;" @click="verDetalle(mat)">
                                    <div class="card-body">
                                        <div class="d-flex justify-content-between align-items-start mb-2">
                                            <span class="badge" :class="mat.estado==='habilitada'?'bg-success':'bg-secondary'">
                                                {{ mat.estado==='habilitada'?'Habilitada':'Deshabilitada' }}
                                            </span>
                                            <small class="text-body-secondary">{{ mat.codigo }}</small>
                                        </div>
                                        <h6 class="card-title mb-1 text-body">{{ mat.nombre }}</h6>
                                        <div class="text-body-secondary small mb-2">{{ mat.carrera || 'Sin carrera asignada' }}</div>
                                        <div class="d-flex justify-content-between align-items-center">
                                            <span class="text-primary fw-bold">
                                                <i class="bi bi-people me-1"></i>{{ mat.totalInscritos }} alumnos
                                            </span>
                                            <span class="text-body-secondary small">
                                                Cupo: {{ mat.cupoOcupado }}/{{ mat.cupo || '∞' }}
                                            </span>
                                        </div>
                                        <!-- Distribución por carrera -->
                                        <div v-if="Object.keys(mat.distribCarrera).length>0" class="mt-2">
                                            <div v-for="(cnt, car) in mat.distribCarrera" :key="car"
                                                 class="d-flex justify-content-between small border-top pt-1">
                                                <span class="text-body-secondary">{{ car }}</span>
                                                <span class="badge bg-body-secondary text-body-secondary">{{ cnt }}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Panel detalle alumnos -->
                    <div v-if="materiaDetalle" class="col-md-7">
                        <div class="card border-0 shadow-sm bg-body-tertiary">
                            <div class="card-header bg-transparent d-flex justify-content-between align-items-center py-3">
                                <div>
                                    <span class="fw-bold text-primary">{{ materiaDetalle.nombre }}</span>
                                    <small class="text-body-secondary ms-2">Lista de alumnos</small>
                                </div>
                                <button class="btn btn-sm btn-outline-secondary rounded-circle" @click="cerrarDetalle" style="width:32px;height:32px;padding:0;">
                                    <i class="bi bi-x fs-5"></i>
                                </button>
                            </div>
                            <div v-if="cargandoDetalle" class="text-center py-4"><div class="spinner-border text-secondary"></div></div>
                            <div v-else-if="alumnosDetalle.length===0" class="text-center py-4 text-muted small p-3">
                                <i class="bi bi-person-x fs-2 opacity-25"></i><p class="mt-2">Sin alumnos inscritos.</p>
                            </div>
                            <div v-else class="table-responsive">
                                <table class="table table-hover align-middle mb-0 small">
                                    <thead class="bg-body-secondary">
                                        <tr><th class="text-body-secondary">Alumno</th><th class="text-body-secondary">Carrera</th><th class="text-center text-body-secondary">C1</th><th class="text-center text-body-secondary">C2</th><th class="text-center text-body-secondary">C3</th><th class="text-center text-body-secondary">Final</th></tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="al in alumnosDetalle" :key="al.matricula">
                                            <td class="fw-semibold text-body">{{ al.nombre }}</td>
                                            <td class="text-body-secondary">{{ al.carrera }}</td>
                                            <td class="text-center">{{ al.comp1 }}</td>
                                            <td class="text-center">{{ al.comp2 }}</td>
                                            <td class="text-center">{{ al.comp3 }}</td>
                                            <td class="text-center">
                                                <span v-if="al.notaFinal" class="badge"
                                                      :class="al.aprobado?'bg-success':'bg-danger'">
                                                    {{ al.notaFinal }}
                                                </span>
                                                <span v-else class="text-body-secondary">—</span>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                                <div class="card-footer bg-transparent border-top-0 text-body-secondary small">
                                    {{ alumnosDetalle.length }} alumnos — ordenados por rendimiento
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
};