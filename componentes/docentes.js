const docentes = {
    props:['forms'],
    data(){
        return{
            docente:{
                idDocente:0,
                codigo:"",
                nombre:"",
                direccion:"",
                email:"",
                telefono:"",
                escalafon:""
            },
            accion:'nuevo',
            idDocente:0,
            data_docentes:[]
        }
    },
    methods:{
        buscarDocente(){
            this.forms.busqueda_docentes.mostrar = !this.forms.busqueda_docentes.mostrar;
            this.$emit('buscar');
        },
        modificarDocente(docente){
            this.accion = 'modificar';
            this.idDocente = docente.idDocente;
            this.docente.codigo = docente.codigo;
            this.docente.nombre = docente.nombre;
            this.docente.direccion = docente.direccion;
            this.docente.email = docente.email;
            this.docente.telefono = docente.telefono;
            this.docente.escalafon = docente.escalafon;
        },
        async guardarDocente() {
            let datos = {
                idDocente: this.accion=='modificar' ? this.idDocente : this.getId(),
                codigo: this.docente.codigo,
                nombre: this.docente.nombre,
                direccion: this.docente.direccion,
                email: this.docente.email,
                telefono: this.docente.telefono,
                escalafon: this.docente.escalafon
            };
            if(this.accion=='nuevo'){
                let exist = await db.docentes.filter(d => d.codigo.toLowerCase() === datos.codigo.toLowerCase()).toArray();
                if(exist.length > 0){
                    alertify.error(`Docente ya registrado: ${exist[0].nombre}`);
                    return;
                }
            }
            let formData = new FormData();
            formData.append('docentes', JSON.stringify(datos));
            formData.append('accion', this.accion);

            try {
                let respuesta = await fetch("private/modulos/docentes/docente.php", {
                    method: "POST",
                    body: formData
                });
                let res = await respuesta.json();
                
                if (res === true || (typeof res === 'object' && res.msg === 'ok')) {
                    db.docentes.put(datos);
                    this.limpiarFormulario();
                    alertify.success('Información de Docente Guardada');
                    this.$emit('guardar');
                }
            } catch (e) { console.error(e); }
        },
        getId(){
            return uuid.v4();
        },
        limpiarFormulario(){
            this.accion = 'nuevo';
            this.idDocente = 0;
            this.docente.codigo = '';
            this.docente.nombre = '';
            this.docente.direccion = '';
            this.docente.email = '';
            this.docente.telefono = '';
            this.docente.escalafon = '';
        },
    },
    template: `
        <div class="row">
            <div class="col-8">
                <form id="frmDocentes" v-draggable @submit.prevent="guardarDocente" @reset.prevent="limpiarFormulario">
                    <div class="card mb-3 shadow-lg border-0" style="background-color: #e0f7fa; border-radius: 20px; overflow: hidden;">
                        <div class="card-header border-0 p-4" style="background-color: #00acc1; color: #ffffff;">
                            <h4 class="mb-0 fw-bold"><i class="bi bi-person-workspace"></i> DOCENTES</h4>
                            <p class="mb-0 small opacity-75">Administración de facultad académica</p>
                        </div>
                        <div class="card-body p-4">
                            <div class="row mb-3">
                                <div class="col-4">
                                    <label class="form-label fw-bold text-secondary small">CÓDIGO DOCENTE:</label>
                                    <input placeholder="Cod-D" required v-model="docente.codigo" type="text" class="form-control border-0 shadow-sm" style="background-color: #fff; border-radius: 12px;">
                                </div>
                                <div class="col-8">
                                    <label class="form-label fw-bold text-secondary small">NOMBRE COMPLETO:</label>
                                    <input placeholder="Nombre completo" required v-model="docente.nombre" type="text" class="form-control border-0 shadow-sm" style="background-color: #fff; border-radius: 12px;">
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-12">
                                    <label class="form-label fw-bold text-secondary small">LUGAR DE DOMICILIO:</label>
                                    <input required v-model="docente.direccion" type="text" class="form-control border-0 shadow-sm" style="background-color: #fff; border-radius: 12px;">
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-5">
                                    <label class="form-label fw-bold text-secondary small">ESCALAFÓN PROFESIONAL:</label>
                                    <select required v-model="docente.escalafon" class="form-select border-0 shadow-sm" style="background-color: #fff; border-radius: 12px;">
                                        <option value="tecnico">Técnico Superior</option>
                                        <option value="profesor">Profesorado</option>
                                        <option value="ingeniero">Licenciado / Ingeniero</option>
                                        <option value="maestria">Maestría Académica</option>
                                        <option value="doctor">Doctorado (PhD)</option>
                                    </select>
                                </div>
                                <div class="col-4">
                                    <label class="form-label fw-bold text-secondary small">CORREO:</label>
                                    <input required v-model="docente.email" type="email" class="form-control border-0 shadow-sm" style="background-color: #fff; border-radius: 12px;">
                                </div>
                                <div class="col-3">
                                    <label class="form-label fw-bold text-secondary small">CÉLULAR:</label>
                                    <input required v-model="docente.telefono" type="text" class="form-control border-0 shadow-sm" style="background-color: #fff; border-radius: 12px;">
                                </div>
                            </div>
                        </div>
                        <div class="card-footer border-0 p-4 text-center" style="background-color: #b2ebf2;">
                            <button type="submit" class="btn btn-info px-4 fw-bold text-white me-2 shadow-sm" style="background-color: #0097a7; border: none; border-radius: 12px;">REGISTRAR DOCENTE</button>
                            <button type="reset" class="btn btn-outline-info px-4 fw-bold me-2" style="border-radius: 12px;">LIMPIAR</button>
                            <button type="button" @click="buscarDocente" class="btn btn-light px-4 fw-bold border shadow-sm" style="border-radius: 12px; color: #00838f;">BUSCAR</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    `
};