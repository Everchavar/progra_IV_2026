const inscripciones = {
    props: ['forms'],

    data() {
        return {
            inscripcion: {
                idInscripcion: '',
                codigo_alumno: '',
                materia: '',
                fecha_inscripcion: '',
                ciclo_periodo: '',
                observaciones: '',
            },
            materias: [],
            alumnos: [],
            accion: 'nuevo',
            idInscripcion: '',
        }
    },

    mounted() {
        this.cargarMaterias();
        this.cargarAlumnos();
    },

    methods: {
        async cargarMaterias() {
            this.materias = await db.materias.toArray();
        },

        async cargarAlumnos() {
            this.alumnos = await db.alumnos.toArray();
        },

        buscarInscripcion() {
            this.forms.busqueda_inscripciones.mostrar =
                !this.forms.busqueda_inscripciones.mostrar;
            this.$emit('buscar');
        },

        modificarInscripcion(inscripcion) {
            this.accion = 'modificar';
            this.idInscripcion = inscripcion.idInscripcion;
            this.inscripcion.codigo_alumno = inscripcion.codigo_alumno;
            this.inscripcion.materia = inscripcion.materia;
            this.inscripcion.fecha_inscripcion = inscripcion.fecha_inscripcion;
            this.inscripcion.ciclo_periodo = inscripcion.ciclo_periodo;
            this.inscripcion.observaciones = inscripcion.observaciones;
        },

        limpiarFormulario() {
            this.accion = 'nuevo';
            this.idInscripcion = '';
            this.inscripcion = {
                idInscripcion: '',
                codigo_alumno: '',
                materia: '',
                fecha_inscripcion: '',
                ciclo_periodo: '',
                observaciones: '',
            };
        },

        seleccionarMateria() {
            let materia = this.materias.find(
                m => String(m.nombre) === String(this.inscripcion.materia)
            );
            if (materia) {
                this.inscripcion.materia = materia.nombre;
            } else {
                this.inscripcion.materia = '';
            }
        },

        async guardarInscripcion() {
            if (!this.inscripcion.codigo_alumno ||
                !this.inscripcion.materia ||
                !this.inscripcion.fecha_inscripcion ||
                !this.inscripcion.ciclo_periodo) {
                alertify.error('Complete todos los campos obligatorios');
                return;
            }

            let datos = {
                idInscripcion: this.accion === 'modificar' ? this.idInscripcion : this.getId(),
                codigo_alumno: this.inscripcion.codigo_alumno,
                materia: this.inscripcion.materia,
                fecha_inscripcion: this.inscripcion.fecha_inscripcion,
                ciclo_periodo: this.inscripcion.ciclo_periodo,
                observaciones: this.inscripcion.observaciones,
            };

            let formData = new FormData();
            formData.append('inscripciones', JSON.stringify(datos));
            formData.append('accion', this.accion);

            try {
                let respuesta = await fetch("private/modulos/inscripciones/inscripcion.php", {
                    method: "POST",
                    body: formData
                });
                let res = await respuesta.json();

                if (res === true || (typeof res === 'object' && res.msg === 'ok')) {
                    db.inscripciones.put(datos);
                    this.limpiarFormulario();
                    alertify.success('Inscripción procesada con éxito');
                    this.$emit('guardar');
                }
            } catch (e) { console.error(e); }
        },

        getId() {
            return uuid.v4();
        }
    },

    template: `
        <div class="row">
            <div class="col-8">
                <form id="frmInscripciones" v-draggable @submit.prevent="guardarInscripcion" @reset.prevent="limpiarFormulario">
                    <div class="card mb-3 shadow-lg border-0" style="width: 48rem; background-color: #e0f7fa; border-radius: 20px; overflow: hidden;">
                        <div class="card-header border-0 p-4" style="background-color: #00acc1; color: #ffffff;">
                            <h4 class="mb-0 fw-bold"><i class="bi bi-ui-checks"></i> INSCRIPCIÓN</h4>
                            <p class="mb-0 small opacity-75">Seleccione el estudiante y la asignatura correspondiente</p>
                        </div>
                        <div class="card-body p-4">

                            <div class="row mb-3 align-items-center">
                                <div class="col-3 fw-bold text-secondary small">BUSCAR ALUMNO:</div>
                                <div class="col-7">
                                    <select v-model="inscripcion.codigo_alumno" class="form-select border-0 shadow-sm" required @focus="cargarAlumnos" style="background-color: #fff; border-radius: 12px;">
                                        <option value="">-- Listado de Estudiantes --</option>
                                        <option v-for="a in alumnos" :key="a.idAlumno" :value="a.codigo">
                                            {{ a.codigo }} - {{ a.nombre }}
                                        </option>
                                    </select>
                                </div>
                                <div class="col-1">
                                    <button type="button" class="btn btn-sm btn-light border shadow-sm" @click="cargarAlumnos" style="border-radius: 10px;">🔄</button>
                                </div>
                            </div>

                            <div class="row mb-3 align-items-center">
                                <div class="col-3 fw-bold text-secondary small">SELECCIONAR MATERIA:</div>
                                <div class="col-7">
                                    <select v-model="inscripcion.materia" @change="seleccionarMateria" class="form-select border-0 shadow-sm" :disabled="materias.length === 0" required @focus="cargarMaterias" style="background-color: #fff; border-radius: 12px;">
                                        <option value="">-- Catálogo de Asignaturas --</option>
                                        <option v-for="m in materias" :key="m.idMateria" :value="m.nombre">
                                            {{ m.codigo }} - {{ m.nombre }}
                                        </option>
                                    </select>
                                </div>
                                <div class="col-1">
                                    <button type="button" class="btn btn-sm btn-light border shadow-sm" @click="cargarMaterias" style="border-radius: 10px;">🔄</button>
                                </div>
                            </div>

                            <div class="row mb-3">
                                <div class="col-4">
                                    <label class="form-label fw-bold text-secondary small">FECHA REGISTRO:</label>
                                    <input v-model="inscripcion.fecha_inscripcion" type="date" class="form-control border-0 shadow-sm" required style="background-color: #fff; border-radius: 12px;">
                                </div>
                                <div class="col-8">
                                    <label class="form-label fw-bold text-secondary small">PERIODO ACADÉMICO:</label>
                                    <select v-model="inscripcion.ciclo_periodo" class="form-select border-0 shadow-sm" required style="background-color: #fff; border-radius: 12px;">
                                        <option value="" disabled>Seleccione ciclo lectivo</option>
                                        <option value="Ciclo 1-2026">Ciclo Académico 1-2026</option>
                                        <option value="Ciclo 2-2026">Ciclo Académico 2-2026</option>
                                    </select>
                                </div>
                            </div>

                            <div class="row">
                                <div class="col-12">
                                    <label class="form-label fw-bold text-secondary small">OBSERVACIONES ADICIONALES:</label>
                                    <textarea v-model="inscripcion.observaciones" class="form-control border-0 shadow-sm" rows="2" style="background-color: #fff; border-radius: 12px;"></textarea>
                                </div>
                            </div>

                        </div>
                        <div class="card-footer border-0 p-4 text-center" style="background-color: #b2ebf2;">
                            <button type="submit" class="btn btn-info px-4 fw-bold text-white me-2 shadow-sm" style="background-color: #0097a7; border: none; border-radius: 12px;">COMPLETAR INSCRIPCIÓN</button>
                            <button type="reset" class="btn btn-outline-info px-4 fw-bold me-2" style="border-radius: 12px;">NUEVA</button>
                            <button type="button" @click="buscarInscripcion" class="btn btn-light px-4 fw-bold border shadow-sm" style="border-radius: 12px; color: #00838f;">BUSCAR</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    `
};