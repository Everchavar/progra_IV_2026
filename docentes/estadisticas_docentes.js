// =============================================
// DOCENTE — Estadísticas Académicas
// =============================================

const estadisticasDocente = {
    data() {
        return {
            materias: [],
            cargando: false
        };
    },
    async mounted() { await this.cargar(); },
    methods: {
        async cargar() {
            this.cargando = true;
            const docente = window.docenteData;
            if (!docente) { this.cargando = false; return; }

            const [todasMaterias, inscripciones, evaluaciones, alumnos] = await Promise.all([
                db.materias.filter(m => String(m.docenteId) === String(docente.idDocente)).toArray(),
                db.inscripciones.toArray(),
                db.evaluaciones.toArray(),
                db.alumnos.toArray()
            ]);

            this.materias = todasMaterias.map(mat => {
                const inscs = inscripciones.filter(i => String(i.idMateria) === String(mat.idMateria));
                const evals = evaluaciones.filter(e => String(e.idMateria) === String(mat.idMateria) && e.notaComputo != null);

                // Alumnos con nota final calculada
                const alumnosConFinal = inscs.map(insc => {
                    const alum = alumnos.find(a => a.nombre === insc.alumno);
                    const evs = evals.filter(e => String(e.idInscripcion) === String(insc.idInscripcion));
                    const computos = [1, 2, 3].map(c => evs.find(e => e.computo === c));
                    const notas = computos.filter(c => c?.notaComputo != null).map(c => parseFloat(c.notaComputo));
                    const notaFinal = notas.length ? (notas.reduce((a, b) => a + b, 0) / notas.length) : null;
                    return {
                        nombre: insc.alumno || '—',
                        carrera: alum?.carrera || '—',
                        comp1: computos[0]?.notaComputo ?? null,
                        comp2: computos[1]?.notaComputo ?? null,
                        comp3: computos[2]?.notaComputo ?? null,
                        notaFinal: notaFinal !== null ? +notaFinal.toFixed(2) : null,
                        aprobado: notaFinal !== null ? notaFinal >= 6 : null
                    };
                }).sort((a, b) => (b.notaFinal || 0) - (a.notaFinal || 0));

                const conFinal = alumnosConFinal.filter(a => a.notaFinal !== null);
                const promedio = conFinal.length
                    ? (conFinal.reduce((s, a) => s + a.notaFinal, 0) / conFinal.length).toFixed(2)
                    : null;

                // Distribución por carrera
                const distribCarrera = {};
                inscs.forEach(i => {
                    const al = alumnos.find(a => a.nombre === i.alumno);
                    const car = al?.carrera || 'Sin carrera';
                    distribCarrera[car] = (distribCarrera[car] || 0) + 1;
                });

                return {
                    ...mat,
                    alumnos: alumnosConFinal,
                    totalInscritos: inscs.length,
                    aprobados: alumnosConFinal.filter(a => a.aprobado === true).length,
                    reprobados: alumnosConFinal.filter(a => a.aprobado === false).length,
                    sinEvaluar: alumnosConFinal.filter(a => a.notaFinal === null).length,
                    promedio,
                    distribCarrera,
                    mostrarDetalle: false
                };
            });

            this.cargando = false;
        }
    },
    template: `
        <div>
            <div class="d-flex align-items-center mb-3 border-bottom pb-2">
                <i class="bi bi-bar-chart-line me-2 fs-5 text-body-secondary"></i>
                <h5 class="mb-0 fw-semibold">Estadísticas Académicas</h5>
                <button class="btn btn-sm btn-outline-secondary ms-auto" @click="cargar"><i class="bi bi-arrow-clockwise"></i></button>
            </div>

            <div v-if="!window?.docenteData" class="alert alert-warning">Perfil no vinculado.</div>
            <div v-else-if="cargando" class="text-center py-4"><div class="spinner-border text-secondary"></div></div>
            <div v-else-if="materias.length===0" class="text-center py-5 text-body-secondary">
                <i class="bi bi-bar-chart-line fs-1 opacity-25"></i>
                <p class="mt-2">No hay materias asignadas.</p>
            </div>

            <div v-else class="d-flex flex-column gap-4">
                <div v-for="mat in materias" :key="mat.idMateria" class="card border-0 shadow-sm bg-body-tertiary">
                    <div class="card-header bg-transparent d-flex justify-content-between align-items-center py-3">
                        <div>
                            <span class="fw-bold text-primary">{{ mat.nombre }}</span>
                            <small class="text-body-secondary ms-2 fw-semibold">{{ mat.codigo }}</small>
                            <small class="ms-2 badge bg-body-secondary text-body-secondary border-0">{{ mat.carrera || 'Sin carrera' }}</small>
                        </div>
                        <button class="btn btn-sm btn-outline-secondary rounded-circle" @click="mat.mostrarDetalle=!mat.mostrarDetalle" style="width:32px;height:32px;padding:0;">
                            <i :class="mat.mostrarDetalle?'bi bi-chevron-up':'bi bi-chevron-down'" class="fs-6"></i>
                        </button>
                    </div>
                    <div class="card-body">
                        <!-- KPIs de la materia -->
                        <div class="row g-3 mb-3">
                            <div class="col-6 col-sm-3 text-center">
                                <div class="fw-bold fs-4 text-primary">{{ mat.totalInscritos }}</div>
                                <div class="text-body-secondary small">Inscritos</div>
                            </div>
                            <div class="col-6 col-sm-3 text-center">
                                <div class="fw-bold fs-4" :class="mat.promedio>=6?'text-success':'text-warning'">{{ mat.promedio || '—' }}</div>
                                <div class="text-body-secondary small">Promedio final</div>
                            </div>
                            <div class="col-6 col-sm-3 text-center">
                                <div class="fw-bold fs-4 text-success">{{ mat.aprobados }}</div>
                                <div class="text-body-secondary small">Aprobados ✅</div>
                            </div>
                            <div class="col-6 col-sm-3 text-center">
                                <div class="fw-bold fs-4 text-danger">{{ mat.reprobados }}</div>
                                <div class="text-body-secondary small">Reprobados ❌</div>
                            </div>
                        </div>

                        <!-- Barra aprobados/reprobados -->
                        <div v-if="mat.totalInscritos>0" class="mb-3">
                            <div class="d-flex gap-0" style="height:12px; border-radius:6px; overflow:hidden;">
                                <div class="bg-success" :style="'width:'+(mat.aprobados/mat.totalInscritos*100)+'%'"></div>
                                <div class="bg-danger" :style="'width:'+(mat.reprobados/mat.totalInscritos*100)+'%'"></div>
                                <div class="bg-body-secondary" :style="'width:'+(mat.sinEvaluar/mat.totalInscritos*100)+'%'"></div>
                            </div>
                            <div class="d-flex gap-3 mt-1 small text-body-secondary">
                                <span><span class="badge bg-success me-1" style="width:10px;height:10px;padding:0;display:inline-block;"></span>Aprobados</span>
                                <span><span class="badge bg-danger me-1" style="width:10px;height:10px;padding:0;display:inline-block;"></span>Reprobados</span>
                                <span><span class="badge bg-body-secondary border me-1" style="width:10px;height:10px;padding:0;display:inline-block;"></span>Sin evaluar ({{ mat.sinEvaluar }})</span>
                            </div>
                        </div>

                        <!-- Distribución por carrera -->
                        <div v-if="Object.keys(mat.distribCarrera).length>0" class="mb-2">
                            <small class="text-body-secondary text-uppercase fw-bold" style="font-size:.65rem;letter-spacing:1px;">Distribución por carrera</small>
                            <div class="d-flex flex-wrap gap-2 mt-1">
                                <span v-for="(cnt, car) in mat.distribCarrera" :key="car"
                                      class="badge bg-body-secondary text-body-secondary border-0">
                                    {{ car }}: {{ cnt }}
                                </span>
                            </div>
                        </div>

                        <!-- Detalle expandible -->
                        <div v-if="mat.mostrarDetalle && mat.alumnos.length>0" class="mt-3 border-top pt-3">
                            <small class="text-body-secondary text-uppercase fw-bold" style="font-size:.65rem;letter-spacing:1px;">Listado por rendimiento</small>
                            <div class="table-responsive mt-1">
                                <table class="table table-sm table-hover align-middle mb-0 small">
                                    <thead class="bg-body-secondary">
                                        <tr><th class="text-body-secondary">#</th><th class="text-body-secondary">Alumno</th><th class="text-body-secondary">Carrera</th><th class="text-center text-body-secondary">C1</th><th class="text-center text-body-secondary">C2</th><th class="text-center text-body-secondary">C3</th><th class="text-center text-body-secondary">Final</th></tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="(al, idx) in mat.alumnos" :key="al.nombre">
                                            <td class="text-body-secondary">{{ idx+1 }}</td>
                                            <td class="fw-bold text-body">{{ al.nombre }}</td>
                                            <td class="text-body-secondary small">{{ al.carrera }}</td>
                                            <td class="text-center">{{ al.comp1 ?? '—' }}</td>
                                            <td class="text-center">{{ al.comp2 ?? '—' }}</td>
                                            <td class="text-center">{{ al.comp3 ?? '—' }}</td>
                                            <td class="text-center">
                                                <span v-if="al.notaFinal!=null" class="badge shadow-sm"
                                                      :class="al.aprobado?'bg-success':'bg-danger'">
                                                    {{ al.notaFinal }}
                                                </span>
                                                <span v-else class="text-body-secondary opacity-50">—</span>
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