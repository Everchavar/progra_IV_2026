// =============================================
// ALUMNO — Mis Notas
// Vista de evaluaciones por materia y cómputo
// =============================================

const misNotas = {
    data() {
        return {
            materias: [],
            cargando: false,
            error: null
        };
    },
    async mounted() { await this.cargar(); },
    computed: {
        totalAprobadas() { return this.materias.filter(m => m.notaFinal !== null && m.notaFinal >= 6).length; },
        totalReprobadas() { return this.materias.filter(m => m.notaFinal !== null && m.notaFinal < 6).length; }
    },
    methods: {
        async cargar() {
            this.cargando = true;
            this.error = null;
            try {
                const s = JSON.parse(sessionStorage.getItem('sesionUniversidad') || '{}');
                const userId = s.id;
                if (!userId) { this.cargando = false; return; }

                // 1. Encontrar registro de alumno
                const alumno = await db.alumnos.where('usuarioId').equals(userId).first();
                if (!alumno) { this.materias = []; this.cargando = false; return; }

                // 2. Obtener inscripciones del alumno
                const misInscripciones = await db.inscripciones
                    .where('idAlumno').equals(alumno.idAlumno)
                    .toArray();

                if (misInscripciones.length === 0) {
                    this.materias = [];
                    this.cargando = false;
                    return;
                }

                // Obtener materias y evaluaciones
                const [todasMaterias, todasEvaluaciones] = await Promise.all([
                    db.materias.toArray(),
                    db.evaluaciones.toArray()
                ]);

                // Agrupar por materia
                this.materias = misInscripciones.map(insc => {
                    const mat = todasMaterias.find(m => String(m.idMateria) === String(insc.idMateria));
                    const evsInsc = todasEvaluaciones.filter(e =>
                        String(e.idInscripcion) === String(insc.idInscripcion)
                    );

                    // 3 cómputos
                    const computos = [1, 2, 3].map(c => {
                        const ev = evsInsc.find(e => e.computo === c);
                        return {
                            numero: c,
                            lab1: ev?.lab1 ?? null,
                            lab2: ev?.lab2 ?? null,
                            examen: ev?.examen ?? null,
                            notaComputo: ev?.notaComputo ?? null,
                            estado: ev?.estado || null,
                            observaciones: ev?.observaciones || ''
                        };
                    });

                    // Nota final: promedio de cómputos con nota
                    const computosConNota = computos.filter(c => c.notaComputo !== null);
                    const notaFinal = computosConNota.length
                        ? +(computosConNota.reduce((s, c) => s + parseFloat(c.notaComputo), 0) / computosConNota.length).toFixed(2)
                        : null;

                    return {
                        idInscripcion: insc.idInscripcion,
                        materia: mat?.nombre || insc.materia || '—',
                        codigo: mat?.codigo || '—',
                        carrera: mat?.carrera || '—',
                        computos,
                        notaFinal,
                        aprobado: notaFinal !== null ? notaFinal >= 6 : null,
                        completado: computosConNota.length === 3
                    };
                });

            } catch (e) {
                this.error = 'Error al cargar notas: ' + e.message;
            }
            this.cargando = false;
        }
    },
    template: `
        <div class="container-fluid py-3">
            <div class="d-flex align-items-center mb-3 border-bottom pb-2">
                <i class="bi bi-journal-check me-2 fs-5 text-body-secondary"></i>
                <h5 class="mb-0 fw-semibold text-body">Mis Notas</h5>
                <button class="btn btn-sm btn-outline-secondary ms-auto" @click="cargar"><i class="bi bi-arrow-clockwise"></i></button>
            </div>

            <div v-if="error" class="alert alert-danger">{{ error }}</div>

            <!-- Resumen -->
            <div v-if="materias.length>0" class="row g-2 mb-4">
                <div class="col-4">
                    <div class="card border-0 shadow-sm bg-body-tertiary text-center py-3">
                        <div class="fw-bold fs-3 text-primary">{{ materias.length }}</div>
                        <div class="text-body-secondary small">Materias inscritas</div>
                    </div>
                </div>
                <div class="col-4">
                    <div class="card border-0 shadow-sm bg-body-tertiary text-center py-3">
                        <div class="fw-bold fs-3 text-success">{{ totalAprobadas }}</div>
                        <div class="text-body-secondary small">Aprobadas ✅</div>
                    </div>
                </div>
                <div class="col-4">
                    <div class="card border-0 shadow-sm bg-body-tertiary text-center py-3">
                        <div class="fw-bold fs-3 text-danger">{{ totalReprobadas }}</div>
                        <div class="text-body-secondary small">Reprobadas ❌</div>
                    </div>
                </div>
            </div>

            <div v-if="cargando" class="text-center py-5"><div class="spinner-border text-secondary"></div></div>
            <div v-else-if="materias.length===0 && !error" class="text-center py-5 text-body-secondary">
                <i class="bi bi-journal-x fs-1 opacity-25"></i>
                <p class="mt-2">No tienes evaluaciones registradas aún.</p>
            </div>

            <div v-else class="row g-3">
                <div v-for="mat in materias" :key="mat.idInscripcion" class="col-12">
                    <div class="card border-0 shadow-sm bg-body-tertiary">
                        <!-- Header de la materia -->
                        <div class="card-header bg-transparent d-flex align-items-center justify-content-between py-3 border-bottom">
                            <div>
                                <span class="fw-bold text-primary">{{ mat.materia }}</span>
                                <small class="text-body-secondary ms-2 fw-semibold">{{ mat.codigo }}</small>
                                <small v-if="mat.carrera!=='—'" class="ms-2 badge bg-body-secondary text-body-secondary border-0">{{ mat.carrera }}</small>
                            </div>
                            <div class="d-flex align-items-center gap-2">
                                <span v-if="mat.notaFinal!==null" class="badge fs-6 py-2 px-3 shadow-sm"
                                      :class="mat.aprobado?'bg-success':'bg-danger'">
                                    <i :class="mat.aprobado?'bi bi-check-circle':'bi bi-x-circle'" class="me-1"></i>
                                    {{ mat.notaFinal }} — {{ mat.aprobado?'Aprobado':'Reprobado' }}
                                </span>
                                <span v-else class="badge bg-body-secondary text-body-secondary border">Pendiente</span>
                            </div>
                        </div>

                        <!-- Tabla de cómputos -->
                        <div class="card-body p-0">
                            <div class="table-responsive">
                                <table class="table table-hover align-middle mb-0 small">
                                    <thead class="bg-body-secondary">
                                        <tr>
                                            <th class="text-body-secondary">Cómputo</th>
                                            <th class="text-center text-body-secondary">Lab. 1 (30%)</th>
                                            <th class="text-center text-body-secondary">Lab. 2 (30%)</th>
                                            <th class="text-center text-body-secondary">Parcial (40%)</th>
                                            <th class="text-center fw-bold text-body-secondary">Nota Cómputo</th>
                                            <th class="text-body-secondary">Estado</th>
                                            <th class="text-body-secondary">Observaciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="comp in mat.computos" :key="comp.numero"
                                            :class="comp.notaComputo===null?'bg-body-secondary bg-opacity-10':''">
                                            <td class="fw-semibold">
                                                <span class="badge bg-primary">C{{ comp.numero }}</span>
                                            </td>
                                            <td class="text-center">{{ comp.lab1 ?? '—' }}</td>
                                            <td class="text-center">{{ comp.lab2 ?? '—' }}</td>
                                            <td class="text-center">{{ comp.examen ?? '—' }}</td>
                                            <td class="text-center">
                                                <span v-if="comp.notaComputo!==null" class="badge fs-6 shadow-sm"
                                                      :class="parseFloat(comp.notaComputo)>=6?'bg-success':'bg-danger'">
                                                    {{ comp.notaComputo }}
                                                </span>
                                                <span v-else class="text-body-secondary opacity-50">—</span>
                                            </td>
                                            <td>
                                                <span v-if="comp.estado==='cerrado'" class="badge bg-body-secondary text-body-secondary border">
                                                    <i class="bi bi-lock-fill me-1"></i>Cerrado
                                                </span>
                                                <span v-else-if="comp.notaComputo!==null" class="badge bg-warning text-dark">
                                                    <i class="bi bi-unlock me-1"></i>Abierto
                                                </span>
                                                <span v-else class="text-body-secondary small">Sin evaluar</span>
                                            </td>
                                            <td class="text-body-secondary italic">{{ comp.observaciones || '—' }}</td>
                                        </tr>
                                    </tbody>
                                    <tfoot v-if="mat.notaFinal!==null" class="bg-body-tertiary">
                                        <tr>
                                            <td colspan="4" class="text-end fw-bold pe-3 text-body">Promedio Final:</td>
                                            <td class="text-center">
                                                <span class="badge fs-5 py-2 px-3 shadow"
                                                      :class="mat.aprobado?'bg-success':'bg-danger'">
                                                    {{ mat.notaFinal }}
                                                </span>
                                            </td>
                                            <td colspan="2">
                                                <span :class="mat.aprobado?'text-success':'text-danger'" class="fw-bold fs-6">
                                                    {{ mat.aprobado?'✅ APROBADO':'❌ REPROBADO' }}
                                                </span>
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
};