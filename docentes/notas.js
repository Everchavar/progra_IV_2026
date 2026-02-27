// =============================================
// DOCENTE — Sistema de Notas
// 3 Cómputos: Lab1(30%) + Lab2(30%) + Examen(40%)
// =============================================

const notasDocente = {
    data() {
        return {
            // Selección
            misMateriasOpts: [],
            materiaSelId: '',
            computoSel: 1,
            // Datos cargados
            filas: [],           // { inscripcion, nombre, carrera, ev: { lab1, lab2, examen, notaComputo, observaciones, estado, id } }
            estadoComputo: 'abierto',
            cargando: false,
            guardando: {},
            // Stats en tiempo real
            totalAprobados: 0,
            totalReprobados: 0,
            promedioGrupo: null
        };
    },
    async mounted() {
        await this.cargarMisMaterias();
    },
    computed: {
        materiaActual() {
            return this.misMateriasOpts.find(m => String(m.idMateria) === String(this.materiaSelId)) || null;
        },
        computosCerrados() {
            return this.filas.length > 0 && this.filas.every(f => f.ev.estado === 'cerrado');
        }
    },
    methods: {
        async cargarMisMaterias() {
            const s = JSON.parse(sessionStorage.getItem('sesionUniversidad') || '{}');
            const userId = s.id;
            if (!userId) return;

            const docente = await db.docentes.where('usuarioId').equals(userId).first();
            if (!docente) return;

            this.misMateriasOpts = await db.materias.where('docenteId').equals(docente.idDocente).toArray();
        },
        async cargarFilas() {
            if (!this.materiaSelId) return;
            this.cargando = true;
            this.filas = [];

            try {
                const [inscripciones, alumnos, perfiles, evaluaciones] = await Promise.all([
                    db.inscripciones.filter(i => String(i.idMateria) === String(this.materiaSelId)).toArray(),
                    db.alumnos.toArray(),
                    db.perfiles.toArray(),
                    db.evaluaciones.filter(e =>
                        String(e.idMateria) === String(this.materiaSelId) &&
                        e.computo === this.computoSel
                    ).toArray()
                ]);

                this.filas = inscripciones.map(insc => {
                    const alum = alumnos.find(a => a.idAlumno === insc.idAlumno);
                    const perf = alum ? perfiles.find(p => p.usuarioId === alum.usuarioId) : null;
                    const ev = evaluaciones.find(e => String(e.idInscripcion) === String(insc.idInscripcion));
                    return {
                        inscripcion: insc,
                        nombre: perf?.nombre || 'Desconocido',
                        carrera: alum?.carreraId || '—',
                        ev: {
                            id: ev?.id || null,
                            lab1: ev?.lab1 ?? '',
                            lab2: ev?.lab2 ?? '',
                            examen: ev?.examen ?? '',
                            notaComputo: ev?.notaComputo ?? null,
                            observaciones: ev?.observaciones || '',
                            estado: ev?.estado || 'abierto'
                        }
                    };
                });
            } catch (e) {
                console.error(e);
            }

            // Determinar estado del cómputo
            this.estadoComputo = this.filas.some(f => f.ev.estado === 'cerrado') ? 'cerrado' : 'abierto';
            this.calcularStats();
            this.cargando = false;
        },
        calcularNota(fila) {
            const l1 = parseFloat(fila.ev.lab1) || 0;
            const l2 = parseFloat(fila.ev.lab2) || 0;
            const ex = parseFloat(fila.ev.examen) || 0;
            if (!fila.ev.lab1 && !fila.ev.lab2 && !fila.ev.examen) return null;
            return +(l1 * 0.3 + l2 * 0.3 + ex * 0.4).toFixed(2);
        },
        onNotaChange(fila) {
            fila.ev.notaComputo = this.calcularNota(fila);
            this.calcularStats();
        },
        calcularStats() {
            const conNota = this.filas.filter(f => f.ev.notaComputo != null);
            this.totalAprobados  = conNota.filter(f => parseFloat(f.ev.notaComputo) >= 6).length;
            this.totalReprobados = conNota.filter(f => parseFloat(f.ev.notaComputo) < 6).length;
            this.promedioGrupo   = conNota.length
                ? (conNota.reduce((s, f) => s + parseFloat(f.ev.notaComputo), 0) / conNota.length).toFixed(2)
                : null;
        },
        async guardarNota(fila) {
            if (this.estadoComputo === 'cerrado') return;
            const insc = fila.inscripcion;
            this.$set ? null : null; // Vue 3 reactive
            const datos = {
                idInscripcion: insc.idInscripcion,
                idMateria: this.materiaSelId,
                computo: this.computoSel,
                lab1: parseFloat(fila.ev.lab1) || null,
                lab2: parseFloat(fila.ev.lab2) || null,
                examen: parseFloat(fila.ev.examen) || null,
                notaComputo: this.calcularNota(fila),
                observaciones: fila.ev.observaciones || '',
                estado: 'abierto'
            };
            if (fila.ev.id) {
                await db.evaluaciones.update(fila.ev.id, datos);
            } else {
                const id = await db.evaluaciones.add(datos);
                fila.ev.id = id;
            }
            fila.ev.notaComputo = datos.notaComputo;
            this.calcularStats();
        },
        async cerrarComputo() {
            alertify.confirm(
                'Cerrar Cómputo',
                `¿Cerrar el Cómputo ${this.computoSel}? Las notas quedarán bloqueadas y no podrán editarse.`,
                async () => {
                    // Guardar todas las notas pendientes
                    for (const fila of this.filas) {
                        await this.guardarNota(fila);
                    }
                    // Marcar como cerrado
                    for (const fila of this.filas) {
                        if (fila.ev.id) {
                            await db.evaluaciones.update(fila.ev.id, { estado: 'cerrado', fechaCierre: new Date().toISOString() });
                            fila.ev.estado = 'cerrado';
                        }
                    }
                    this.estadoComputo = 'cerrado';
                    alertify.success(`Cómputo ${this.computoSel} cerrado exitosamente.`);
                },
                () => {}
            ).set('labels', { ok: 'Sí, cerrar', cancel: 'Cancelar' });
        },
        claseNota(nota) {
            if (nota == null) return '';
            return parseFloat(nota) >= 6 ? 'text-success fw-bold' : 'text-danger fw-bold';
        },
        validarInput(v) {
            const n = parseFloat(v);
            return isNaN(n) ? true : (n >= 0 && n <= 10);
        }
    },
    template: `
        <div>
            <div class="d-flex align-items-center mb-3 border-bottom pb-2">
                <i class="bi bi-journal-text me-2 fs-5 text-body-secondary"></i>
                <h5 class="mb-0 fw-semibold text-body">Ingreso de Notas</h5>
            </div>

            <div v-if="!window?.docenteData" class="alert alert-warning">
                Perfil no vinculado — contacta al administrador.
            </div>
            <div v-else>
                <!-- Selección de materia y cómputo -->
                <div class="row g-3 mb-4">
                    <div class="col-md-5">
                        <label class="form-label small fw-bold text-body-secondary text-uppercase">Materia</label>
                        <select v-model="materiaSelId" class="form-select bg-transparent" @change="cargarFilas">
                            <option value="">— Selecciona una materia —</option>
                            <option v-for="m in misMateriasOpts" :key="m.idMateria" :value="String(m.idMateria)">
                                {{ m.nombre }} ({{ m.codigo }})
                            </option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <label class="form-label small fw-bold text-body-secondary text-uppercase">Cómputo</label>
                        <div class="d-flex gap-2">
                            <button v-for="c in [1,2,3]" :key="c"
                                    class="btn flex-fill fw-bold"
                                    :class="computoSel===c ? 'btn-primary' : 'btn-outline-secondary'"
                                    @click="computoSel=c; cargarFilas()">
                                Cómputo {{ c }}
                            </button>
                        </div>
                    </div>
                    <div class="col-md-4 d-flex align-items-end">
                        <div class="d-flex gap-2 w-100">
                            <button v-if="filas.length>0 && estadoComputo==='abierto'"
                                    class="btn btn-warning btn-sm fw-semibold" @click="cerrarComputo">
                                <i class="bi bi-lock me-1"></i>Cerrar cómputo {{ computoSel }}
                            </button>
                            <span v-if="estadoComputo==='cerrado'" class="badge bg-danger d-flex align-items-center gap-1 px-3">
                                <i class="bi bi-lock-fill"></i> Cómputo {{ computoSel }} CERRADO
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Info de ponderación -->
                <div class="alert bg-body-tertiary border d-flex gap-3 align-items-center mb-3 py-2 small">
                    <i class="bi bi-calculator text-body-secondary fs-5"></i>
                    <span class="text-body-secondary">
                        <strong class="text-body">Fórmula:</strong> Nota Cómputo = Lab.1 × 30% + Lab.2 × 30% + Parcial × 40%
                        &nbsp;|&nbsp; Nota Final = Prom. de 3 cómputos
                        &nbsp;|&nbsp; Aprobado ≥ <strong class="text-body">6.0</strong>
                    </span>
                </div>

                <!-- Stats del grupo -->
                <div v-if="filas.length>0" class="row g-2 mb-3">
                    <div class="col-4">
                        <div class="card border-0 shadow-sm bg-body-tertiary text-center py-2">
                            <div class="fw-bold fs-5" :class="promedioGrupo >= 6 ? 'text-success' : 'text-warning'">
                                {{ promedioGrupo || '—' }}
                            </div>
                            <div class="text-body-secondary" style="font-size:.7rem;">Promedio grupo</div>
                        </div>
                    </div>
                    <div class="col-4">
                        <div class="card border-0 shadow-sm bg-body-tertiary text-center py-2">
                            <div class="fw-bold fs-5 text-success">{{ totalAprobados }}</div>
                            <div class="text-body-secondary" style="font-size:.7rem;">Aprobados</div>
                        </div>
                    </div>
                    <div class="col-4">
                        <div class="card border-0 shadow-sm bg-body-tertiary text-center py-2">
                            <div class="fw-bold fs-5 text-danger">{{ totalReprobados }}</div>
                            <div class="text-body-secondary" style="font-size:.7rem;">Reprobados</div>
                        </div>
                    </div>
                </div>

                <div v-if="!materiaSelId" class="text-center text-body-secondary py-5">
                    <i class="bi bi-arrow-up-circle fs-1 opacity-25"></i>
                    <p class="mt-2">Selecciona una materia y un cómputo para comenzar.</p>
                </div>
                <div v-else-if="cargando" class="text-center py-4"><div class="spinner-border text-secondary"></div></div>
                <div v-else-if="filas.length===0" class="text-center py-5 text-body-secondary">
                    <i class="bi bi-person-x fs-1 opacity-25"></i>
                    <p class="mt-2">No hay alumnos inscritos en esta materia.</p>
                </div>
 
                <div v-else class="card border-0 shadow-sm bg-body-tertiary">
                    <div class="table-responsive">
                        <table class="table table-hover align-middle mb-0 small">
                            <thead class="bg-body-secondary">
                                <tr>
                                    <th class="text-body-secondary">Alumno</th>
                                    <th class="text-body-secondary">Carrera</th>
                                    <th style="width:100px;" class="text-body-secondary">
                                        Lab. 1
                                        <small class="d-block text-body-secondary fw-normal">30%</small>
                                    </th>
                                    <th style="width:100px;" class="text-body-secondary">
                                        Lab. 2
                                        <small class="d-block text-body-secondary fw-normal">30%</small>
                                    </th>
                                    <th style="width:100px;" class="text-body-secondary">
                                        Parcial
                                        <small class="d-block text-body-secondary fw-normal">40%</small>
                                    </th>
                                    <th class="text-center text-body-secondary">Nota Cómputo</th>
                                    <th class="text-body-secondary">Observaciones</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="fila in filas" :key="fila.inscripcion.idInscripcion"
                                    :class="fila.ev.estado==='cerrado'?'bg-body-secondary bg-opacity-50 text-body-secondary':''">
                                    <td class="fw-bold text-body">{{ fila.nombre }}</td>
                                    <td class="text-body-secondary small">{{ fila.carrera }}</td>
                                    <td>
                                        <input v-if="estadoComputo==='abierto'"
                                               v-model="fila.ev.lab1" type="number" min="0" max="10" step="0.1"
                                               class="form-control form-control-sm bg-transparent" style="width:80px;"
                                               @input="onNotaChange(fila)"
                                               @blur="guardarNota(fila)">
                                        <span v-else>{{ fila.ev.lab1 ?? '—' }}</span>
                                    </td>
                                    <td>
                                        <input v-if="estadoComputo==='abierto'"
                                               v-model="fila.ev.lab2" type="number" min="0" max="10" step="0.1"
                                               class="form-control form-control-sm bg-transparent" style="width:80px;"
                                               @input="onNotaChange(fila)"
                                               @blur="guardarNota(fila)">
                                        <span v-else>{{ fila.ev.lab2 ?? '—' }}</span>
                                    </td>
                                    <td>
                                        <input v-if="estadoComputo==='abierto'"
                                               v-model="fila.ev.examen" type="number" min="0" max="10" step="0.1"
                                               class="form-control form-control-sm bg-transparent" style="width:80px;"
                                               @input="onNotaChange(fila)"
                                               @blur="guardarNota(fila)">
                                        <span v-else>{{ fila.ev.examen ?? '—' }}</span>
                                    </td>
                                    <td class="text-center">
                                        <span v-if="fila.ev.notaComputo!=null" class="badge fs-6 shadow-sm"
                                              :class="parseFloat(fila.ev.notaComputo)>=6?'bg-success':'bg-danger'">
                                            {{ fila.ev.notaComputo }}
                                        </span>
                                        <span v-else class="text-body-secondary opacity-50">—</span>
                                    </td>
                                    <td>
                                        <input v-if="estadoComputo==='abierto'"
                                               v-model="fila.ev.observaciones" type="text"
                                               class="form-control form-control-sm bg-transparent"
                                               placeholder="Opcional..."
                                               @blur="guardarNota(fila)">
                                        <span v-else class="text-body-secondary small">{{ fila.ev.observaciones || '—' }}</span>
                                    </td>
                                    <td>
                                        <i v-if="fila.ev.estado==='cerrado'" class="bi bi-lock-fill text-warning" title="Cómputo cerrado"></i>
                                        <button v-else class="btn btn-sm btn-outline-success" @click="guardarNota(fila)" title="Guardar">
                                            <i class="bi bi-floppy"></i>
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="card-footer bg-transparent border-top-0 small text-body-secondary">
                        <i class="bi bi-info-circle me-1"></i>{{ filas.length }} alumnos inscritos
                        <span v-if="estadoComputo==='abierto'"> — Auto-guardado inteligente activado. </span>
                        <span v-else class="badge bg-danger ms-2"> <i class="bi bi-lock-fill"></i> CÓMPUTO CERRADO </span>
                    </div>
                </div>
            </div>
        </div>
    `
};