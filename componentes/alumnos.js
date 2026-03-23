const alumnos = {
    props:['forms'],
    data(){
        return{
            alumno:{
                idAlumno:0,
                codigo:"",
                nombre:"",
                direccion:"",
                email:"",
                telefono:""
            },
            accion:'nuevo',
            idAlumno:0,
            data_alumnos:[]
        }
    },
    methods:{
        buscarAlumno(){
            this.forms.busqueda_alumnos.mostrar = !this.forms.busqueda_alumnos.mostrar;
            this.$emit('buscar');
        },
        modificarAlumno(alumno){
            this.accion = 'modificar';
            this.idAlumno = alumno.idAlumno;
            this.alumno.codigo = alumno.codigo;
            this.alumno.nombre = alumno.nombre;
            this.alumno.direccion = alumno.direccion;
            this.alumno.email = alumno.email;
            this.alumno.telefono = alumno.telefono;
        },
        async guardarAlumno() {
            let datos = {
                idAlumno: this.accion=='modificar' ? this.idAlumno : this.getId(),
                codigo: this.alumno.codigo,
                nombre: this.alumno.nombre,
                direccion: this.alumno.direccion,
                email: this.alumno.email,
                telefono: this.alumno.telefono
            };
            if(this.accion=='nuevo'){
                let exist = await db.alumnos.filter(a => a.codigo.toLowerCase() === datos.codigo.toLowerCase()).toArray();
                if(exist.length > 0){
                    alertify.error(`El código ya existe: ${exist[0].nombre}`);
                    return;
                }
            }
            let formData = new FormData();
            formData.append('alumnos', JSON.stringify(datos));
            formData.append('accion', this.accion);

            try {
                let respuesta = await fetch("private/modulos/alumnos/alumno.php", {
                    method: "POST",
                    body: formData
                });
                let res = await respuesta.json();
                
                if (res === true || (typeof res === 'object' && res.msg === 'ok')) {
                    db.alumnos.put(datos);
                    this.limpiarFormulario();
                    alertify.success('Alumno registrado en el sistema');
                    this.$emit('guardar');
                }
            } catch (e) { console.error(e); }
        },
        getId(){
            return uuid.v4();
        },
        limpiarFormulario(){
            this.accion = 'nuevo';
            this.idAlumno = 0;
            this.alumno.codigo = '';
            this.alumno.nombre = '';
            this.alumno.direccion = '';
            this.alumno.email = '';
            this.alumno.telefono = '';
        },
    },
    template: `
        <div class="row">
            <div class="col-8">
                <form id="frmAlumnos" v-draggable @submit.prevent="guardarAlumno" @reset.prevent="limpiarFormulario">
                    <div class="card mb-3 shadow-lg border-0" style="background-color: #e0f7fa; border-radius: 20px; overflow: hidden;">
                        <div class="card-header border-0 p-4" style="background-color: #00acc1; color: #ffffff;">
                            <h4 class="mb-0 fw-bold"><i class="bi bi-person-badge"></i> REGISTRO DE ALUMNOS</h4>
                            <p class="mb-0 small opacity-75">Ingrese la información detallada del estudiante</p>
                        </div>
                        <div class="card-body p-4">
                            <div class="row mb-3">
                                <div class="col-4">
                                    <label class="form-label fw-bold text-secondary small">CÓDIGO ÚNICO:</label>
                                    <input placeholder="Cod-00" required v-model="alumno.codigo" type="text" class="form-control border-0 shadow-sm" style="background-color: #fff; border-radius: 12px;">
                                </div>
                                <div class="col-8">
                                    <label class="form-label fw-bold text-secondary small">NOMBRE COMPLETO:</label>
                                    <input placeholder="Nombres y Apellidos" required v-model="alumno.nombre" type="text" class="form-control border-0 shadow-sm" style="background-color: #fff; border-radius: 12px;">
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-12">
                                    <label class="form-label fw-bold text-secondary small">DIRECCIÓN RESIDENCIAL:</label>
                                    <input required v-model="alumno.direccion" type="text" class="form-control border-0 shadow-sm" style="background-color: #fff; border-radius: 12px;">
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-7">
                                    <label class="form-label fw-bold text-secondary small">CORREO INSTITUCIONAL:</label>
                                    <input placeholder="estudiante@ejemplo.com" required v-model="alumno.email" type="email" class="form-control border-0 shadow-sm" style="background-color: #fff; border-radius: 12px;">
                                </div>
                                <div class="col-5">
                                    <label class="form-label fw-bold text-secondary small">TELÉFONO / MÓVIL:</label>
                                    <input placeholder="0000-0000" required v-model="alumno.telefono" type="text" class="form-control border-0 shadow-sm" style="background-color: #fff; border-radius: 12px;">
                                </div>
                            </div>
                        </div>
                        <div class="card-footer border-0 p-4 text-center" style="background-color: #b2ebf2;">
                            <button type="submit" class="btn btn-info px-4 fw-bold text-white me-2 shadow-sm" style="background-color: #0097a7; border: none; border-radius: 12px;">PROCESAR DATOS</button>
                            <button type="reset" class="btn btn-outline-info px-4 fw-bold me-2" style="border-radius: 12px;">LIMPIAR</button>
                            <button type="button" @click="buscarAlumno" class="btn btn-light px-4 fw-bold border shadow-sm" style="border-radius: 12px; color: #00838f;">BUSCAR</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    `
};