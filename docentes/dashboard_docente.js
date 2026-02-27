// =============================================
// DOCENTE — Dashboard
// =============================================

const docenteDashboard = {
    data() {
        return {
            stats: {
                totalMaterias: 0,
                totalAlumnos: 0,
                promedioGeneral: null,
                computosAbiertos: 0
            },
            periodoActual: null,
            cargando: false
        };
    },
    async mounted() { await this.cargar(); },
    methods: {
        async cargar() {
            this.cargando = true;
            const docente = window.docenteData;
            if (!docente) { this.cargando = false; return; }

            const [materias, inscripciones, evaluaciones, periodos] = await Promise.all([
                db.materias.filter(m => String(m.docenteId) === String(docente.idDocente)).toArray(),
                db.inscripciones.toArray(),
                db.evaluaciones.toArray(),
                db.periodos.toArray()
            ]);

            const idsMaterias = new Set(materias.map(m => String(m.idMateria)));

            // Alumnos únicos en mis materias
            const inscritosEnMisMaterias = inscripciones.filter(i => idsMaterias.has(String(i.idMateria)));
            this.stats.totalMaterias = materias.length;
            this.stats.totalAlumnos  = inscritosEnMisMaterias.length;

            // Promedio general de evaluaciones de mis materias
            const misEvals = evaluaciones.filter(e => idsMaterias.has(String(e.idMateria)) && e.notaComputo != null);
            this.stats.promedioGeneral = misEvals.length
                ? (misEvals.reduce((s, e) => s + parseFloat(e.notaComputo), 0) / misEvals.length).toFixed(2)
                : null;

            // Cómputos abiertos
            this.stats.computosAbiertos = evaluaciones.filter(e =>
                idsMaterias.has(String(e.idMateria)) && e.estado === 'abierto' && e.notaComputo != null
            ).length > 0 ? 1 : 0; // simplificado

            this.periodoActual = periodos.find(p => p.estado === 'abierto') || null;
            this.cargando = false;
        }
    },
    template: `
        <div>
            <div class="d-flex align-items-center mb-3 border-bottom pb-2">
                <i class="bi bi-speedometer2 me-2 fs-5 text-body-secondary"></i>
                <h5 class="mb-0 fw-semibold">Dashboard Docente</h5>
                <button class="btn btn-sm btn-outline-secondary ms-auto" @click="cargar"><i class="bi bi-arrow-clockwise"></i></button>
            </div>

            <div v-if="!window?.docenteData" class="alert alert-warning">
                <i class="bi bi-exclamation-triangle me-2"></i>
                Tu usuario no está vinculado a ningún perfil de docente. Contacta al administrador.
            </div>

            <!-- Período activo -->
            <div class="alert d-flex align-items-center gap-3 mb-4"
                 :class="periodoActual ? 'alert-success border-0 shadow-sm' : 'alert-warning border-0 shadow-sm'">
                <i :class="periodoActual ? 'bi bi-calendar-check-fill' : 'bi bi-calendar-x-fill'" class="fs-3"></i>
                <div>
                    <div class="fw-semibold">
                        {{ periodoActual ? 'Período activo: Ciclo ' + periodoActual.ciclo + ' — ' + periodoActual.año : 'Sin período activo' }}
                    </div>
                    <small class="text-body-secondary">{{ periodoActual ? 'Las inscripciones están habilitadas.' : 'El administrador debe abrir un período.' }}</small>
                </div>
            </div>

            <!-- KPIs -->
            <div class="row g-3 mb-4">
                <div class="col-sm-6 col-lg-3">
                    <div class="card border-0 shadow-sm h-100 bg-body-tertiary">
                        <div class="card-body text-center py-4">
                            <div class="fs-2 fw-bold text-success">{{ stats.totalMaterias }}</div>
                            <div class="text-body-secondary small">Materias asignadas</div>
                        </div>
                    </div>
                </div>
                <div class="col-sm-6 col-lg-3">
                    <div class="card border-0 shadow-sm h-100 bg-body-tertiary">
                        <div class="card-body text-center py-4">
                            <div class="fs-2 fw-bold text-primary">{{ stats.totalAlumnos }}</div>
                            <div class="text-body-secondary small">Alumnos totales</div>
                        </div>
                    </div>
                </div>
                <div class="col-sm-6 col-lg-3">
                    <div class="card border-0 shadow-sm h-100 bg-body-tertiary">
                        <div class="card-body text-center py-4">
                            <div class="fs-2 fw-bold" :class="stats.promedioGeneral >= 6 ? 'text-success' : 'text-warning'">
                                {{ stats.promedioGeneral || '—' }}
                            </div>
                            <div class="text-body-secondary small">Promedio general</div>
                        </div>
                    </div>
                </div>
                <div class="col-sm-6 col-lg-3">
                    <div class="card border-0 shadow-sm h-100 bg-body-tertiary">
                        <div class="card-body text-center py-4">
                            <div class="fs-2 fw-bold text-info">3</div>
                            <div class="text-body-secondary small">Cómputos por ciclo</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Flujo académico -->
            <div class="card border-0 shadow-sm bg-body-tertiary">
                <div class="card-header bg-transparent border-bottom small fw-bold text-body-secondary text-uppercase py-3">
                    <i class="bi bi-diagram-3 me-1"></i>Flujo de evaluación
                </div>
                <div class="card-body">
                    <div class="d-flex flex-wrap gap-2 align-items-center justify-content-center py-2">
                        <div v-for="(step, i) in [
                            {icon:'bi bi-people', label:'Alumnos inscritos', color:'bg-primary'},
                            {icon:'bi bi-journal-plus', label:'Cómputo 1', color:'bg-info text-dark'},
                            {icon:'bi bi-journal-plus', label:'Cómputo 2', color:'bg-info text-dark'},
                            {icon:'bi bi-journal-plus', label:'Cómputo 3', color:'bg-info text-dark'},
                            {icon:'bi bi-calculator', label:'Promedio final', color:'bg-success'},
                        ]" :key="i" class="d-flex align-items-center gap-2">
                            <div class="d-flex flex-column align-items-center">
                                <div class="rounded-circle d-flex align-items-center justify-content-center text-white mb-1"
                                     :class="step.color" style="width:42px;height:42px;">
                                    <i :class="step.icon"></i>
                                </div>
                                <small style="font-size:.68rem;" class="text-body-secondary text-center" style="max-width:70px;">{{ step.label }}</small>
                            </div>
                            <i v-if="i<4" class="bi bi-chevron-right text-body-secondary"></i>
                        </div>
                    </div>
                    <div class="row g-2 mt-2">
                        <div class="col-md-4 text-center">
                            <small class="text-body-secondary">Cómputo = Lab1 × 30% + Lab2 × 30% + Parcial × 40%</small>
                        </div>
                        <div class="col-md-4 text-center">
                            <small class="text-body-secondary">Nota Final = Prom. de 3 cómputos</small>
                        </div>
                        <div class="col-md-4 text-center">
                            <small class="text-body-secondary">Aprobado ≥ 6.0</small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
};