// =============================================
// ADMIN — Estadísticas Académicas
// =============================================

const estadisticasAdmin = {
    data() {
        return {
            cargando: false,
            stats: {
                alumnosPorCarrera: [],
                materiasPorCarrera: [],
                docentesActivos: 0,
                promediosPorMateria: [],
                totalInscritos: 0,
                promedioGeneral: null
            }
        };
    },
    async mounted() { await this.cargar(); },
    methods: {
        async cargar() {
            this.cargando = true;
            try {
                const [carreras, alumnos, materias, docentes, inscripciones, evaluaciones] = await Promise.all([
                    db.carreras.toArray(),
                    db.alumnos.toArray(),
                    db.materias.toArray(),
                    db.docentes.toArray(),
                    db.inscripciones.toArray(),
                    db.evaluaciones.toArray()
                ]);

                // Alumnos por carrera
                this.stats.alumnosPorCarrera = carreras.map(c => ({
                    nombre: c.nombre,
                    codigo: c.codigo,
                    total: alumnos.filter(a =>
                        String(a.carreraId) === String(c.idCarrera) ||
                        (a.carrera || '').toLowerCase() === (c.nombre || '').toLowerCase()
                    ).length
                })).sort((a, b) => b.total - a.total);

                // Sin carrera asignada
                const sinCarrera = alumnos.filter(a => !a.carreraId && !a.carrera).length;
                if (sinCarrera > 0) this.stats.alumnosPorCarrera.push({ nombre: 'Sin carrera asignada', codigo: '—', total: sinCarrera });

                // Materias por carrera
                this.stats.materiasPorCarrera = carreras.map(c => ({
                    nombre: c.nombre,
                    habilitadas: materias.filter(m =>
                        (String(m.carreraId) === String(c.idCarrera) || (m.carrera || '').toLowerCase() === (c.nombre || '').toLowerCase()) &&
                        (m.estado || 'habilitada') === 'habilitada'
                    ).length,
                    total: materias.filter(m =>
                        String(m.carreraId) === String(c.idCarrera) ||
                        (m.carrera || '').toLowerCase() === (c.nombre || '').toLowerCase()
                    ).length
                }));

                // Docentes activos
                this.stats.docentesActivos = docentes.filter(d => (d.estado || 'activo') === 'activo').length;

                // Promedio por materia (de evaluaciones)
                this.stats.promediosPorMateria = materias.map(m => {
                    const evals = evaluaciones.filter(e => String(e.idMateria) === String(m.idMateria) && e.notaComputo != null);
                    const prom = evals.length ? (evals.reduce((s, e) => s + (parseFloat(e.notaComputo) || 0), 0) / evals.length).toFixed(2) : null;
                    const aprobados = evals.filter(e => parseFloat(e.notaComputo) >= 6).length;
                    const inscritos = inscripciones.filter(i => String(i.idMateria) === String(m.idMateria)).length;
                    return { nombre: m.nombre, codigo: m.codigo, promedio: prom, aprobados, total: evals.length, inscritos };
                }).filter(m => m.inscritos > 0).sort((a, b) => (b.promedio || 0) - (a.promedio || 0));

                this.stats.totalInscritos = inscripciones.length;
                const todasNotas = evaluaciones.filter(e => e.notaComputo != null);
                this.stats.promedioGeneral = todasNotas.length
                    ? (todasNotas.reduce((s, e) => s + (parseFloat(e.notaComputo) || 0), 0) / todasNotas.length).toFixed(2)
                    : null;

            } finally {
                this.cargando = false;
            }
        },
        pctBar(total, max) { return max ? Math.round(Math.min(total / max * 100, 100)) : 0; }
    },
    template: `
        <div>
            <div class="d-flex align-items-center mb-3 border-bottom pb-2">
                <i class="bi bi-bar-chart-line me-2 fs-5 text-secondary"></i>
                <h5 class="mb-0 fw-semibold">Estadísticas Académicas</h5>
                <button class="btn btn-sm btn-outline-secondary ms-auto" @click="cargar"><i class="bi bi-arrow-clockwise"></i></button>
            </div>

            <div v-if="cargando" class="text-center py-5"><div class="spinner-border text-secondary"></div></div>
            <div v-else class="row g-3">

                <!-- Alumnos por carrera -->
                <div class="col-lg-6">
                    <div class="card border-0 shadow-sm h-100 bg-body-tertiary">
                        <div class="card-header bg-transparent border-bottom small fw-bold text-body-secondary text-uppercase py-3">
                            <i class="bi bi-people me-1"></i>Alumnos por carrera
                        </div>
                        <div class="card-body">
                            <div v-if="stats.alumnosPorCarrera.length===0" class="text-body-secondary text-center py-3 small">Sin datos</div>
                            <div v-for="c in stats.alumnosPorCarrera" :key="c.codigo" class="mb-3">
                                <div class="d-flex justify-content-between small mb-1">
                                    <span class="fw-semibold text-body">{{ c.nombre }}</span>
                                    <span class="badge bg-primary rounded-pill">{{ c.total }}</span>
                                </div>
                                <div class="progress" style="height:8px;">
                                    <div class="progress-bar bg-primary"
                                         :style="'width:'+pctBar(c.total, Math.max(...stats.alumnosPorCarrera.map(x=>x.total)))+'%'"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Materias por carrera -->
                <div class="col-lg-6">
                    <div class="card border-0 shadow-sm h-100 bg-body-tertiary">
                        <div class="card-header bg-transparent border-bottom small fw-bold text-body-secondary text-uppercase py-3">
                            <i class="bi bi-book me-1"></i>Materias por carrera
                        </div>
                        <div class="card-body">
                            <div v-if="stats.materiasPorCarrera.length===0" class="text-body-secondary text-center py-3 small">Sin datos</div>
                            <table v-else class="table table-sm small mb-0">
                                <thead class="bg-body-secondary"><tr><th class="text-body-secondary">Carrera</th><th class="text-center text-body-secondary">Habilitadas</th><th class="text-center text-body-secondary">Total</th></tr></thead>
                                <tbody>
                                    <tr v-for="c in stats.materiasPorCarrera" :key="c.nombre">
                                        <td class="text-body">{{ c.nombre }}</td>
                                        <td class="text-center"><span class="badge bg-success">{{ c.habilitadas }}</span></td>
                                        <td class="text-center text-body-secondary">{{ c.total }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Resumen general -->
                <div class="col-12">
                    <div class="row g-3">
                        <div class="col-sm-4">
                            <div class="card border-0 shadow-sm text-center py-3 bg-body-tertiary">
                                <div class="fw-bold fs-3 text-success">{{ stats.docentesActivos }}</div>
                                <div class="text-body-secondary small">Docentes activos</div>
                            </div>
                        </div>
                        <div class="col-sm-4">
                            <div class="card border-0 shadow-sm text-center py-3 bg-body-tertiary">
                                <div class="fw-bold fs-3 text-primary">{{ stats.totalInscritos }}</div>
                                <div class="text-body-secondary small">Inscripciones totales</div>
                            </div>
                        </div>
                        <div class="col-sm-4">
                            <div class="card border-0 shadow-sm text-center py-3 bg-body-tertiary">
                                <div class="fw-bold fs-3" :class="stats.promedioGeneral >= 6 ? 'text-success' : 'text-warning'">
                                    {{ stats.promedioGeneral || '—' }}
                                </div>
                                <div class="text-body-secondary small">Promedio general (cómputos)</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Rendimiento por materia -->
                <div class="col-12" v-if="stats.promediosPorMateria.length > 0">
                    <div class="card border-0 shadow-sm bg-body-tertiary">
                        <div class="card-header bg-transparent border-bottom small fw-bold text-body-secondary text-uppercase py-3">
                            <i class="bi bi-trophy me-1"></i>Rendimiento por materia
                        </div>
                        <div class="table-responsive">
                            <table class="table table-hover align-middle mb-0 small">
                                <thead class="bg-body-secondary">
                                    <tr><th class="text-body-secondary">Materia</th><th class="text-body-secondary">Código</th><th class="text-center text-body-secondary">Inscritos</th><th class="text-center text-body-secondary">Promedio</th><th class="text-center text-body-secondary">Aprobados</th></tr>
                                </thead>
                                <tbody>
                                    <tr v-for="m in stats.promediosPorMateria" :key="m.codigo">
                                        <td class="fw-semibold text-body">{{ m.nombre }}</td>
                                        <td class="text-body-secondary">{{ m.codigo }}</td>
                                        <td class="text-center text-body">{{ m.inscritos }}</td>
                                        <td class="text-center">
                                            <span v-if="m.promedio" class="badge" :class="m.promedio>=6?'bg-success':'bg-danger'">
                                                {{ m.promedio }}
                                            </span>
                                            <span v-else class="text-body-secondary">—</span>
                                        </td>
                                        <td class="text-center">
                                            <span v-if="m.total>0" class="text-body">{{ m.aprobados }}/{{ m.total }}</span>
                                            <span v-else class="text-body-secondary">—</span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
};