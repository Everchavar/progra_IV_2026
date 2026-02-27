const docentes = {
    data(){
        return{
            docente:{
                idDocente:0,
                carnet:"",
                nombre:"",
                direccion:"",
                email:"",
                telefono:"",
                escalafon:"",
                foto: "",
                fechaNacimiento: "",
                sexo: ""
            },
            accion:'nuevo',
            idDocente:0,
            data_docentes:[],
            sesion: { autenticado: false, rol: '', username: '', id: null, carnet: '' }
        }
    },
    async mounted() {
        const stored = sessionStorage.getItem('sesionUniversidad');
        if (stored) {
            const s = JSON.parse(stored);
            this.sesion = s;
            
            if (s.rol === 'Docente' && s.id) {
                // UNIÓN RELACIONAL
                const perfil = await db.perfiles.where('usuarioId').equals(s.id).first();
                const expediente = await db.docentes.where('usuarioId').equals(s.id).first();

                if (perfil && expediente) {
                    this.modificarDocente({ ...perfil, ...expediente });
                }
            }
        }
    },
    emits: ['ir-busqueda'],
    methods:{
        buscarDocente(){
            this.$emit('ir-busqueda');
        },
        modificarDocente(datos){
            this.accion = 'modificar';
            this.idDocente = datos.idDocente;
            this.docente.carnet = datos.carnet;
            this.docente.nombre = datos.nombre;
            this.docente.direccion = datos.direccion;
            this.docente.email = datos.email || "";
            this.docente.telefono = datos.telefono;
            this.docente.escalafon = datos.escalafon;
            this.docente.foto = datos.foto || "";
            this.docente.fechaNacimiento = datos.fechaNacimiento || "";
            this.docente.sexo = datos.sexo || "";
            this.docente.usuarioId = datos.usuarioId;
        },
        seleccionarFoto(event) {
            const file = event.target.files[0];
            if (!file) return;
            if (file.size > 500 * 1024) { // 500KB limit
                alertify.error('La imagen es muy pesada (máx 500KB).');
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                this.docente.foto = e.target.result;
            };
            reader.readAsDataURL(file);
        },
        async guardarDocente() {
            if (!this.docente.usuarioId && this.sesion.rol !== 'Admin') {
                alertify.error("No se puede guardar sin usuario vinculado.");
                return;
            }

            // Perfil humano
            let datosPerfil = {
                usuarioId: this.docente.usuarioId || this.sesion.id,
                nombre: this.docente.nombre,
                direccion: this.docente.direccion,
                telefono: this.docente.telefono,
                fechaNacimiento: this.docente.fechaNacimiento,
                sexo: this.docente.sexo,
                foto: this.docente.foto
            };

            // Perfil técnico
            let datosAcademicos = {
                idDocente: this.accion=='modificar' ? this.idDocente : undefined,
                carnet: this.docente.carnet,
                usuarioId: this.docente.usuarioId || this.sesion.id,
                escalafon: this.docente.escalafon,
                estado: 'activo'
            };

            try {
                await db.transaction('rw', [db.perfiles, db.docentes], async () => {
                    const p = await db.perfiles.where('usuarioId').equals(datosPerfil.usuarioId).first();
                    if (p) await db.perfiles.update(p.id, datosPerfil);
                    else await db.perfiles.add(datosPerfil);

                    if (this.accion === 'modificar') {
                        await db.docentes.update(this.idDocente, datosAcademicos);
                    } else {
                        if (this.sesion.rol !== 'Admin') throw new Error("Permisos denegados.");
                        await db.docentes.add(datosAcademicos);
                    }
                });

                this.limpiarFormulario();
                alertify.success(`${datosPerfil.nombre} guardado correctamente`);
            } catch (e) {
                alertify.error("Error: " + e.message);
            }
        },
        getId(){
            return new Date().getTime();
        },
        limpiarFormulario(){
            this.accion = 'nuevo';
            this.idDocente = 0;
            this.docente.carnet = '';
            this.docente.nombre = '';
            this.docente.direccion = '';
            this.docente.email = '';
            this.docente.telefono = '';
            this.docente.escalafon = '';
            this.docente.foto = '';
            this.docente.fechaNacimiento = '';
            this.docente.sexo = '';
        },
    },
    template: `
        <div>
            <div class="d-flex align-items-center mb-3 border-bottom pb-2">
                <i class="bi bi-person-workspace me-2 fs-5 text-secondary"></i>
                <h5 class="mb-0 fw-semibold text-body">Registro de Docentes</h5>
                <span v-if="accion=='modificar'" class="badge bg-warning text-dark ms-2">Editando</span>
            </div>
            <form id="frmDocentes" @submit.prevent="guardarDocente" @reset.prevent="limpiarFormulario">
                <div class="card border-0 shadow-sm bg-body-tertiary" style="max-width: 480px;">
                    <div class="card-body p-4">

                        <!-- FOTO -->
                        <div class="mb-4 text-center">
                            <div class="position-relative d-inline-block">
                                <img :src="docente.foto || 'https://via.placeholder.com/150?text=Foto'"
                                     class="rounded-circle border"
                                     style="width:100px; height:100px; object-fit: cover;">
                                <label class="position-absolute bottom-0 end-0 bg-body border rounded-circle p-1 shadow-sm"
                                       style="cursor:pointer;" title="Subir foto">
                                    <i class="bi bi-camera-fill text-body small"></i>
                                    <input type="file" class="d-none" accept="image/*" @change="seleccionarFoto">
                                </label>
                            </div>
                        </div>

                        <div class="mb-3 row align-items-center">
                            <label class="col-sm-3 col-form-label text-body-secondary small fw-bold text-uppercase">Código</label>
                            <div class="col-sm-4">
                                <input placeholder="Ej. D-001" required v-model="docente.carnet" type="text" 
                                    class="form-control form-control-sm bg-transparent"
                                    :readonly="sesion.rol === 'Docente'" :disabled="sesion.rol === 'Docente'">
                            </div>
                        </div>
                        <div class="mb-3 row align-items-center">
                            <label class="col-sm-3 col-form-label text-body-secondary small fw-bold text-uppercase">Nombre</label>
                            <div class="col-sm-8">
                                <input placeholder="Nombre completo" required v-model="docente.nombre" type="text" 
                                    class="form-control form-control-sm bg-transparent"
                                    :readonly="sesion.rol === 'Docente'" :disabled="sesion.rol === 'Docente'">
                            </div>
                        </div>
                        <div class="mb-3 row align-items-center">
                            <label class="col-sm-3 col-form-label text-body-secondary small fw-bold text-uppercase">Dirección</label>
                            <div class="col-sm-9">
                                <input placeholder="Dirección" required v-model="docente.direccion" type="text" class="form-control form-control-sm bg-transparent">
                            </div>
                        </div>
                        <div class="mb-3 row align-items-center">
                            <label class="col-sm-3 col-form-label text-body-secondary small fw-bold text-uppercase">Correo</label>
                            <div class="col-sm-8">
                                <input placeholder="correo@universidad.edu" required v-model="docente.email" type="text" 
                                    class="form-control form-control-sm bg-transparent"
                                    :readonly="sesion.rol === 'Docente'" :disabled="sesion.rol === 'Docente'">
                                <div v-if="sesion.rol === 'Docente'" class="form-text small">Vinculado a tu cuenta de usuario.</div>
                            </div>
                        </div>
                        <div class="mb-3 row align-items-center">
                            <label class="col-sm-3 col-form-label text-body-secondary small fw-bold text-uppercase">Teléfono</label>
                            <div class="col-sm-5">
                                <input placeholder="0000-0000" required v-model="docente.telefono" type="text" class="form-control form-control-sm bg-transparent">
                            </div>
                        </div>
                        <div class="mb-3 row align-items-center">
                            <label class="col-sm-3 col-form-label text-body-secondary small fw-bold text-uppercase">Nacimiento</label>
                            <div class="col-sm-5">
                                <input required v-model="docente.fechaNacimiento" type="date" class="form-control form-control-sm bg-transparent">
                            </div>
                        </div>
                        <div class="mb-3 row align-items-center">
                            <label class="col-sm-3 col-form-label text-body-secondary small fw-bold text-uppercase">Género</label>
                            <div class="col-sm-5">
                                <select required v-model="docente.sexo" class="form-select form-select-sm bg-transparent"
                                    :readonly="sesion.rol === 'Docente'" :disabled="sesion.rol === 'Docente'">
                                    <option value="" disabled>Seleccione...</option>
                                    <option value="M">Masculino</option>
                                    <option value="F">Femenino</option>
                                </select>
                            </div>
                        </div>
                        <div class="mb-1 row align-items-center">
                            <label class="col-sm-3 col-form-label text-body-secondary small fw-bold text-uppercase">Escalafón</label>
                            <div class="col-sm-6">
                                <select required v-model="docente.escalafon" class="form-select form-select-sm bg-transparent">
                                    <option value="" disabled>Seleccione...</option>
                                    <option value="tecnico">Técnico</option>
                                    <option value="profesor">Profesor</option>
                                    <option value="ingeniero">Licenciado / Ingeniero</option>
                                    <option value="maestria">Maestría</option>
                                    <option value="doctor">Doctor</option>
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
                        <button type="button" @click="buscarDocente" class="btn btn-sm btn-outline-success px-3 ms-auto">
                            <i class="bi bi-search me-1"></i>Buscar
                        </button>
                    </div>
                </div>
            </form>
        </div>
    `
};