const inscripciones = {
    props:['forms'],
    data(){
        return{
            inscripcion:{
                idInscripcion:0,
                idMatricula:"",
                alumno:"",
                idMateria:"",
                materia:"",
                fecha:"",
                ciclo:""
            },
            accion:'nuevo',
            // Cantidad de materias que el alumno quiere inscribir (1-5)
            cantidadMaterias: 5,
            // Materias ya inscritas para la matrícula seleccionada
            materiasInscritas: [],
            // Datos relacionales cargados desde DB
            matriculasActivas:[],
            materiasDisponibles:[],
            // Mensajes de advertencia
            sinMatriculas: false,
            sinMaterias: false,
        }
    },
    async mounted(){
        await this.cargarDatosRelacionales();
    },
    watch:{
        // Recarga los datos cada vez que se abre el panel
        'forms.inscripciones.mostrar'(visible){
            if(visible) this.cargarDatosRelacionales();
        }
    },
    methods:{
        getRomano(n) {
            const romanos = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
            return romanos[n - 1] || n;
        },
        // Carga matrículas activas y materias desde la DB
        async cargarDatosRelacionales(){
            this.matriculasActivas = await db.matricula
                .filter(m => m.estado === 'Activo')
                .toArray();
            this.sinMatriculas = this.matriculasActivas.length === 0;

            // Solo mostrar materias habilitadas (estado=habilitada o sin estado = legacy)
            const todasMaterias = await db.materias.toArray();
            const habilitadas = todasMaterias.filter(m => (m.estado || 'habilitada') === 'habilitada');

            try {
                const sesion = JSON.parse(sessionStorage.getItem('sesionUniversidad') || '{}');
                const userId = sesion.id;
                
                if (userId) {
                    const alumno = await db.alumnos.where('usuarioId').equals(userId).first();
                    if (alumno && (alumno.carreraId || alumno.carrera)) {
                        const carreraId = alumno.carreraId;
                        this.materiasDisponibles = habilitadas.filter(m => !m.carreraId || m.carreraId === carreraId);
                    } else {
                        this.materiasDisponibles = habilitadas;
                    }
                } else {
                    this.materiasDisponibles = habilitadas;
                }
            } catch (e) {
                console.warn('Error filtrando materias por carrera:', e);
                this.materiasDisponibles = habilitadas;
            }
            this.sinMaterias = this.materiasDisponibles.length === 0;
        },
        // Al seleccionar una matrícula, rellena el alumno y carga sus materias ya inscritas
        async onMatriculaChange(){
            const mat = this.matriculasActivas.find(m => m.idMatricula == this.inscripcion.idMatricula);
            if(mat){
                const perfil = await db.perfiles.where('usuarioId').equals(mat.usuarioId || 0).first();
                this.inscripcion.alumno = perfil ? perfil.nombre : 'Desconocido';
                this.inscripcion.idAlumno = mat.idAlumno;
            } else {
                this.inscripcion.alumno = '';
                this.inscripcion.idAlumno = null;
            }
            this.inscripcion.idMateria = '';
            this.inscripcion.materia   = '';
            await this.cargarMateriasInscritas();
        },
        async cargarMateriasInscritas(){
            if(!this.inscripcion.idAlumno){
                this.materiasInscritas = [];
                return;
            }
            this.materiasInscritas = await db.inscripciones
                .where('idAlumno').equals(Number(this.inscripcion.idAlumno))
                .toArray();
        },
        // Al seleccionar una materia, guarda el nombre
        onMateriaChange(){
            const mat = this.materiasDisponibles.find(m => m.idMateria == this.inscripcion.idMateria);
            if(mat){
                this.inscripcion.materia = mat.nombre;
            } else {
                this.inscripcion.materia = '';
            }
        },
        buscarInscripcion(){
            this.forms.busqueda_inscripciones.mostrar = !this.forms.busqueda_inscripciones.mostrar;
            this.$emit('buscar');
        },
        modificarInscripcion(ins){
            this.accion = 'modificar';
            this.idInscripcion = ins.idInscripcion;
            this.inscripcion.idMatricula = ins.idMatricula;
            this.inscripcion.alumno  = ins.alumno;
            this.inscripcion.idMateria = ins.idMateria || '';
            this.inscripcion.materia = ins.materia;
            this.inscripcion.fecha   = ins.fecha;
            this.inscripcion.ciclo   = ins.ciclo;
            this.cargarMateriasInscritas();
        },
        async guardarInscripcion() {
            if(!this.inscripcion.idMatricula){
                alertify.error('Debe seleccionar una matrícula activa.');
                return;
            }
            if(!this.inscripcion.idMateria){
                alertify.error('Debe seleccionar una materia.');
                return;
            }

            // ── VALIDACIONES INSTITUCIONALES ──────────────────────
            // 1. Verificar que la materia esté habilitada
            const matObj = await db.materias.get(this.inscripcion.idMateria);
            if (matObj && (matObj.estado || 'habilitada') === 'deshabilitada') {
                alertify.error('Esta materia está deshabilitada. No se pueden hacer inscripciones.');
                return;
            }

            // 2. Verificar que haya un período de matrícula abierto
            const periodoAbierto = await db.periodos.filter(p => p.estado === 'abierto').first();
            if (!periodoAbierto) {
                alertify.error('No hay un período de matrícula abierto. Contacta al administrador.');
                return;
            }

            // 3. Verificar cupo disponible
            if (matObj && matObj.cupo > 0) {
                const inscritos = await db.inscripciones
                    .filter(i => String(i.idMateria) === String(this.inscripcion.idMateria)).count();
                if (inscritos >= matObj.cupo) {
                    alertify.error(`El cupo de "${matObj.nombre}" está lleno (${inscritos}/${matObj.cupo}).`);
                    return;
                }
            }
            // ─────────────────────────────────────────────────────

            // Recargar las materias inscritas para tener datos frescos
            await this.cargarMateriasInscritas();

            // Al modificar, excluir el registro actual del conteo
            const esModificar = this.accion === 'modificar';
            const inscripcionesFiltradas = esModificar
                ? this.materiasInscritas.filter(i => i.idInscripcion != this.idInscripcion)
                : this.materiasInscritas;

            // 1) Verificar materia duplicada (comparar idMateria como string para evitar fallos de tipo)
            const yaInscrito = inscripcionesFiltradas.some(
                i => String(i.idMateria) === String(this.inscripcion.idMateria)
            );
            if(yaInscrito){
                alertify.error(`¡No puedes inscribir "${this.inscripcion.materia}" dos veces! Esa materia ya está registrada para este alumno. Inscribe una materia diferente.`);
                return;
            }

            // 2) Verificar límite según la cantidad elegida por el usuario
            const limite = parseInt(this.cantidadMaterias) || 5;
            if(inscripcionesFiltradas.length >= limite){
                alertify.error(`Este alumno ya tiene ${inscripcionesFiltradas.length} materia(s) inscrita(s) y el límite que elegiste es ${limite}. Cambia el límite o elimina una materia.`);
                return;
            }

            let datos = {
                idInscripcion: esModificar ? this.idInscripcion : this.getId(),
                matriculaId:   Number(this.inscripcion.idMatricula),
                alumno:        this.inscripcion.alumno,
                materiaId:     Number(this.inscripcion.idMateria),
                materia:       this.inscripcion.materia,
                fecha:         this.inscripcion.fecha,
                ciclo:         this.inscripcion.ciclo
            };
            await db.inscripciones.put(datos);
            // Actualizar lista local sin recargar todo
            await this.cargarMateriasInscritas();
            // Limpiar solo la selección de materia para inscribir otra rápidamente
            this.inscripcion.idMateria = '';
            this.inscripcion.materia   = '';
            this.inscripcion.fecha     = '';
            alertify.success(`"${datos.materia}" inscrita correctamente (${this.materiasInscritas.length}/${limite})`);
        },
        getId(){
            return new Date().getTime();
        },
        limpiarFormulario(){
            this.accion = 'nuevo';
            this.idInscripcion = 0;
            this.inscripcion.idMatricula = '';
            this.inscripcion.alumno  = '';
            this.inscripcion.idMateria = '';
            this.inscripcion.materia = '';
            this.inscripcion.fecha   = '';
            this.inscripcion.ciclo   = '';
            this.materiasInscritas   = [];
            this.cantidadMaterias    = 5;
            this.cargarDatosRelacionales();
        },
    },
    template: `
        <div>
            <div class="d-flex align-items-center mb-3 border-bottom pb-2">
                <i class="bi bi-pencil-square me-2 fs-5 text-body-secondary"></i>
                <h5 class="mb-0 fw-semibold text-body">{{ (forms.sesion && forms.sesion.rol === 'Alumno') || inscripcion.alumno ? 'Mis Inscripciones' : 'Registro de Inscripciones' }}</h5>
                <span v-if="accion=='modificar'" class="badge bg-warning text-dark ms-2">Editando</span>
            </div>

            <!-- Alertas de prerrequisitos faltantes (Solo para admin o si el alumno no tiene matricula) -->
            <div v-if="sinMatriculas" class="alert alert-warning d-flex align-items-center py-2 mb-3" style="max-width:560px;">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                <div class="small">
                    <strong>No se encontró una matrícula activa.</strong>
                    {{ forms.sesion && forms.sesion.rol === 'Alumno' ? 'Contacta al administrador para completar tu proceso de matrícula.' : 'Ve al módulo Matrícula y crea una primero.' }}
                </div>
            </div>

            <form id="frmInscripcion" @submit.prevent="guardarInscripcion" @reset.prevent="limpiarFormulario">
                <div class="card border-0 shadow-sm bg-body-tertiary" style="max-width: 560px;">
                    <div class="card-body p-4">

                        <!-- Resumen para Alumno -->
                        <div v-if="inscripcion.idMatricula" class="mb-3 p-3 rounded bg-body-secondary bg-opacity-25 border border-secondary-subtle">
                            <div class="d-flex justify-content-between small text-body-secondary mb-1">
                                <span class="fw-bold">Materias inscritas este ciclo</span>
                                <span class="fw-bold text-primary">
                                    {{ materiasInscritas.length }} / {{ cantidadMaterias }}
                                </span>
                            </div>
                            <div class="progress" style="height:6px;">
                                <div class="progress-bar bg-primary"
                                    :style="'width:' + Math.min((materiasInscritas.length / 5) * 100, 100) + '%'">
                                </div>
                            </div>
                            <!-- Lista rápida de materias ya inscritas -->
                            <div v-if="materiasInscritas.length > 0" class="mt-2">
                                <ul class="list-unstyled mb-0">
                                    <li v-for="mi in materiasInscritas" :key="mi.idInscripcion" class="small d-flex align-items-center gap-2 mb-1">
                                        <i class="bi bi-check-circle-fill text-success"></i>
                                        <span class="text-body fw-semibold">{{ mi.materia }}</span>
                                        <span class="text-body-secondary small ms-auto">{{ mi.ciclo }}</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <!-- Selector de Matrícula (Solo lectura para Alumno si ya tiene una) -->
                        <div class="mb-3">
                            <label class="form-label text-body-secondary small fw-bold text-uppercase">Matrícula Correspondiente</label>
                            <select v-if="!(forms.sesion && forms.sesion.rol === 'Alumno')" v-model="inscripcion.idMatricula" @change="onMatriculaChange"
                                class="form-select form-select-sm bg-transparent"
                                :class="sinMatriculas ? 'is-invalid' : ''"
                                required :disabled="sinMatriculas">
                                <option value="" disabled>Seleccione una matrícula activa...</option>
                                <option v-for="m in matriculasActivas" :key="m.idMatricula" :value="m.idMatricula">
                                    {{ m.codigo }} — {{ m.nombreAlumno }}
                                </option>
                            </select>
                            <div v-else class="form-control form-control-sm bg-body-secondary border-secondary-subtle fw-semibold text-body">
                                {{ matriculasActivas.find(m => m.idMatricula == inscripcion.idMatricula)?.codigo || 'Cargando información...' }}
                            </div>
                        </div>

                        <!-- Materia (Solo si el admin está inscribiendo o si permites al alumno inscribir) -->
                        <div class="mb-3" v-if="!(forms.sesion && forms.sesion.rol === 'Alumno')">
                            <label class="form-label text-body-secondary small fw-bold text-uppercase">Materia</label>
                            <select v-model="inscripcion.idMateria" @change="onMateriaChange"
                                class="form-select form-select-sm bg-transparent"
                                required :disabled="sinMaterias || materiasInscritas.length >= cantidadMaterias">
                                <option value="" disabled>Seleccione una materia...</option>
                                <option v-for="m in materiasDisponibles" :key="m.idMateria" :value="m.idMateria"
                                    :disabled="materiasInscritas.some(i => String(i.idMateria) === String(m.idMateria))">
                                    {{ m.codigo }} — {{ m.nombre }}
                                </option>
                            </select>
                        </div>

                        <div class="row mb-1" v-if="!(forms.sesion && forms.sesion.rol === 'Alumno')">
                            <div class="col-6">
                                <label class="form-label text-body-secondary small fw-bold text-uppercase">Fecha de Registro</label>
                                <input required v-model="inscripcion.fecha" type="date" class="form-control form-control-sm bg-transparent">
                            </div>
                            <div class="col-6">
                                <label class="form-label text-body-secondary small fw-bold text-uppercase">Ciclo</label>
                                <input :value="inscripcion.ciclo" type="text" class="form-control form-control-sm bg-body-secondary border-secondary-subtle" readonly>
                            </div>
                        </div>
                        
                        <!-- Si es Alumno, mostrar un mensaje de que la inscripción es gestionada por la universidad -->
                        <div v-if="forms.sesion && forms.sesion.rol === 'Alumno'" class="mt-2 text-body-secondary small">
                            <i class="bi bi-info-circle me-1"></i>Esta lista muestra las materias que tienes autorizadas para cursar en el ciclo actual. Si hay algún error, contacta a registro académico.
                        </div>

                    </div>
                    <!-- Botonera Admin -->
                    <div v-if="!(forms.sesion && forms.sesion.rol === 'Alumno')" class="card-footer bg-transparent border-top d-flex gap-2 px-4 py-3">
                        <button type="submit" class="btn btn-sm px-3" style="background-color:#1a3a5c; color:white;"
                            :disabled="sinMatriculas || sinMaterias || materiasInscritas.length >= cantidadMaterias">
                            <i class="bi bi-save me-1"></i>Inscribir
                        </button>
                        <button type="reset" class="btn btn-sm btn-outline-secondary px-3">
                            <i class="bi bi-arrow-counterclockwise me-1"></i>Nuevo
                        </button>
                        <button type="button" @click="buscarInscripcion" class="btn btn-sm btn-outline-success px-3 ms-auto">
                            <i class="bi bi-search me-1"></i>Listado
                        </button>
                    </div>
                </div>
            </form>
        </div>
    `
};