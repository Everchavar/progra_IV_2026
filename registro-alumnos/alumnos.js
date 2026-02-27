const alumnos = {
    props:['forms'],
    data(){
        return{
            alumno:{
                idAlumno:0,
                carnet:"",
                nombre:"",
                direccion:"",
                email:"",
                telefono:"",
                fechaNacimiento: "",
                sexo: ""
            },
            accion:'nuevo',
            idAlumno:0,
            data_alumnos:[],
            sesion: { autenticado: false, rol: '', username: '', id: null, carnet: '' }
        }
    },
    async mounted() {
        const stored = sessionStorage.getItem('sesionUniversidad');
        if (stored) {
            const s = JSON.parse(stored);
            this.sesion = s;
            
            if (s.rol === 'Alumno' && s.id) {
                // UNIÓN RELACIONAL: usuario -> perfil -> alumno
                const perfil = await db.perfiles.where('usuarioId').equals(s.id).first();
                const expediente = await db.alumnos.where('usuarioId').equals(s.id).first();

                if (perfil && expediente) {
                    this.modificarAlumno({ ...perfil, ...expediente });
                }
            }
        }
    },
    methods:{
        buscarAlumno(){
            this.forms.busqueda_alumnos.mostrar = !this.forms.busqueda_alumnos.mostrar;
            this.$emit('buscar');
        },
        modificarAlumno(datos){
            this.accion = 'modificar';
            this.idAlumno = datos.idAlumno;
            this.alumno.carnet = datos.carnet;
            this.alumno.nombre = datos.nombre;
            this.alumno.direccion = datos.direccion;
            this.alumno.email = datos.email || ""; // El email está en la tabla usuarios, pero lo guardamos en el form por conveniencia
            this.alumno.telefono = datos.telefono;
            this.alumno.fechaNacimiento = datos.fechaNacimiento || "";
            this.alumno.sexo = datos.sexo || "";
            // Guardamos el usuarioId si existe (importante para relacional)
            this.alumno.usuarioId = datos.usuarioId;
        },
        async guardarAlumno() {
            if (!this.alumno.usuarioId && this.sesion.rol !== 'Admin') {
                alertify.error("Error de sesión: No se puede guardar sin usuario vinculado.");
                return;
            }

            // Datos para la tabla perfiles
            let datosPerfil = {
                usuarioId: this.alumno.usuarioId || this.sesion.id,
                nombre: this.alumno.nombre,
                direccion: this.alumno.direccion,
                telefono: this.alumno.telefono,
                fechaNacimiento: this.alumno.fechaNacimiento,
                sexo: this.alumno.sexo
            };

            // Datos para la tabla alumnos (académico)
            let datosAcademicos = {
                idAlumno: this.accion=='modificar' ? this.idAlumno : undefined,
                carnet: this.alumno.carnet,
                usuarioId: this.alumno.usuarioId || this.sesion.id,
                estado: 'activo'
            };

            try {
                await db.transaction('rw', [db.perfiles, db.alumnos], async () => {
                    // 1. Actualizar o Crear Perfil
                    const p = await db.perfiles.where('usuarioId').equals(datosPerfil.usuarioId).first();
                    if (p) await db.perfiles.update(p.id, datosPerfil);
                    else await db.perfiles.add(datosPerfil);

                    // 2. Actualizar o Crear Expediente Alumno
                    if (this.accion === 'modificar') {
                        await db.alumnos.update(this.idAlumno, datosAcademicos);
                    } else {
                        // En arquitectura v11, "nuevo" alumno manual solo debería ocurrir vía Admin
                        if (this.sesion.rol !== 'Admin') throw new Error("Solo el administrador puede crear perfiles nuevos.");
                        await db.alumnos.add(datosAcademicos);
                    }
                });

                this.limpiarFormulario();
                alertify.success(`${datosPerfil.nombre} guardado correctamente`);
            } catch (e) {
                alertify.error("Error al guardar: " + e.message);
            }
        },
        getId(){
            return new Date().getTime();
        },
        limpiarFormulario(){
            this.accion = 'nuevo';
            this.idAlumno = 0;
            this.alumno.carnet = '';
            this.alumno.nombre = '';
            this.alumno.direccion = '';
            this.alumno.email = '';
            this.alumno.telefono = '';
            this.alumno.fechaNacimiento = '';
            this.alumno.sexo = '';
        },
    },
    template: `
        <div>
            <div class="d-flex align-items-center mb-3 border-bottom pb-2">
                <i class="bi bi-person-badge me-2 fs-5 text-body-secondary"></i>
                <h5 class="mb-0 fw-semibold text-body">Registro de Alumnos</h5>
                <span v-if="accion=='modificar'" class="badge bg-warning text-dark ms-2">Editando</span>
            </div>
            <form id="frmAlumnos" @submit.prevent="guardarAlumno" @reset.prevent="limpiarFormulario">
                <div class="card border-0 shadow-sm bg-body-tertiary" style="max-width: 480px;">
                    <div class="card-body p-4">
                        <div class="mb-3 row align-items-center">
                            <label class="col-sm-3 col-form-label text-body-secondary small fw-bold text-uppercase">Carnet</label>
                            <div class="col-sm-4">
                                <input placeholder="Ej. 2026-ISI-00001" required v-model="alumno.carnet" type="text" 
                                    class="form-control form-control-sm bg-transparent"
                                    :readonly="sesion.rol === 'Alumno'" :disabled="sesion.rol === 'Alumno'">
                            </div>
                        </div>
                        <div class="mb-3 row align-items-center">
                            <label class="col-sm-3 col-form-label text-body-secondary small fw-bold text-uppercase">Nombre</label>
                            <div class="col-sm-8">
                                <input placeholder="Nombre completo" required v-model="alumno.nombre" type="text" 
                                    class="form-control form-control-sm bg-transparent"
                                    :readonly="sesion.rol === 'Alumno'" :disabled="sesion.rol === 'Alumno'">
                            </div>
                        </div>
                        <div class="mb-3 row align-items-center">
                            <label class="col-sm-3 col-form-label text-body-secondary small fw-bold text-uppercase">Dirección</label>
                            <div class="col-sm-9">
                                <input placeholder="Dirección" required v-model="alumno.direccion" type="text" class="form-control form-control-sm bg-transparent">
                            </div>
                        </div>
                        <div class="mb-3 row align-items-center">
                            <label class="col-sm-3 col-form-label text-body-secondary small fw-bold text-uppercase">Correo</label>
                            <div class="col-sm-8">
                                <input placeholder="correo@universidad.edu" required v-model="alumno.email" type="text" 
                                    class="form-control form-control-sm bg-transparent"
                                    :readonly="sesion.rol === 'Alumno'" :disabled="sesion.rol === 'Alumno'">
                                <div v-if="sesion.rol === 'Alumno'" class="form-text small">Vinculado a tu cuenta de usuario.</div>
                            </div>
                        </div>
                        <div class="mb-3 row align-items-center">
                            <label class="col-sm-3 col-form-label text-body-secondary small fw-bold text-uppercase">Teléfono</label>
                            <div class="col-sm-5">
                                <input placeholder="0000-0000" required v-model="alumno.telefono" type="text" class="form-control form-control-sm bg-transparent">
                            </div>
                        </div>
                        <div class="mb-3 row align-items-center">
                            <label class="col-sm-3 col-form-label text-body-secondary small fw-bold text-uppercase">Nacimiento</label>
                            <div class="col-sm-5">
                                <input required v-model="alumno.fechaNacimiento" type="date" class="form-control form-control-sm bg-transparent">
                            </div>
                        </div>
                        <div class="mb-1 row align-items-center">
                            <label class="col-sm-3 col-form-label text-body-secondary small fw-bold text-uppercase">Género</label>
                            <div class="col-sm-5">
                                <select required v-model="alumno.sexo" class="form-select form-select-sm bg-transparent"
                                    :readonly="sesion.rol === 'Alumno'" :disabled="sesion.rol === 'Alumno'">
                                    <option value="" disabled>Seleccione...</option>
                                    <option value="M">Masculino</option>
                                    <option value="F">Femenino</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="card-footer bg-transparent border-top d-flex gap-2 px-4 py-3">
                        <button type="submit" class="btn btn-sm px-3" style="background-color:#1a3a5c; color:white;">
                            <i class="bi bi-save me-1"></i>Guardar
                        </button>
                        <button type="reset" class="btn btn-sm btn-outline-secondary px-3">
                            <i class="bi bi-arrow-counterclockwise me-1"></i>Nuevo
                        </button>
                        <button type="button" @click="buscarAlumno" class="btn btn-sm btn-outline-success px-3 ms-auto">
                            <i class="bi bi-search me-1"></i>Buscar
                        </button>
                    </div>
                </div>
            </form>
        </div>
    `
};