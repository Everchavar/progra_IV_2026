const matricula = {
    props:['forms'],
    data(){
        return{
            matricula:{
                idMatricula:0,
                codigo:"",
                nombreAlumno:"",
                carrera:"",
                ciclo:"",
                fecha:"",
                estado:"Activo"
            },
            accion:'nuevo',
            idMatricula:0,
            data_matricula:[]
        }
    },
    methods:{
        buscarMatricula(){
            this.forms.busqueda_matricula.mostrar = !this.forms.busqueda_matricula.mostrar;
            this.$emit('buscar');
        },
        modificarMatricula(matricula){
            this.accion = 'modificar';
            this.idMatricula = matricula.idMatricula;
            this.matricula.codigo = matricula.codigo;
            this.matricula.nombreAlumno = matricula.nombreAlumno;
            this.matricula.carrera = matricula.carrera;
            this.matricula.ciclo = matricula.ciclo;
            this.matricula.fecha = matricula.fecha;
            this.matricula.estado = matricula.estado;
        },
        async guardarMatricula() {
            let datos = {
                idMatricula: this.accion=='modificar' ? this.idMatricula : this.getId(),
                codigo: this.matricula.codigo,
                nombreAlumno: this.matricula.nombreAlumno,
                carrera: this.matricula.carrera,
                ciclo: this.matricula.ciclo,
                fecha: this.matricula.fecha,
                estado: this.matricula.estado
            };
            
            if(this.data_matricula.length > 0 && this.accion=='nuevo'){
                alertify.error(`El código de matrícula ya existe para: ${this.data_matricula[0].nombreAlumno}`);
                return;
            }

            db.matricula.put(datos);
            this.limpiarFormulario();
            alertify.success(`Matrícula de ${datos.nombreAlumno} guardada correctamente`);
        },
        getId(){
            return new Date().getTime();
        },
        limpiarFormulario(){
            this.accion = 'nuevo';
            this.idMatricula = 0;
            this.matricula.codigo = '';
            this.matricula.nombreAlumno = '';
            this.matricula.carrera = '';
            this.matricula.ciclo = '';
            this.matricula.fecha = '';
            this.matricula.estado = 'Activo';
        },
    },
    template: `
        <div class="row">
            <div class="col-6">
                <form id="frmMatricula" @submit.prevent="guardarMatricula" @reset.prevent="limpiarFormulario">
                    <div class="card text-bg-dark mb-3" style="max-width: 40rem;">
                        <div class="card-header">GESTIÓN DE MATRÍCULAS</div>
                        <div class="card-body">
                            <div class="row p-1">
                                <div class="col-3">CÓDIGO:</div>
                                <div class="col-3">
                                    <input placeholder="MAT-001" required v-model="matricula.codigo" type="text" class="form-control">
                                </div>
                                <div class="col-2">FECHA:</div>
                                <div class="col-4">
                                    <input required v-model="matricula.fecha" type="date" class="form-control">
                                </div>
                            </div>
                            <div class="row p-1">
                                <div class="col-3">ALUMNO:</div>
                                <div class="col-9">
                                    <input placeholder="Nombre completo del estudiante" required v-model="matricula.nombreAlumno" type="text" class="form-control">
                                </div>
                            </div>
                            <div class="row p-1">
                                <div class="col-3">CARRERA:</div>
                                <div class="col-9">
                                    <input placeholder="Ej. Ingeniería en Sistemas" required v-model="matricula.carrera" type="text" class="form-control">
                                </div>
                            </div>
                            <div class="row p-1">
                                <div class="col-3">CICLO:</div>
                                <div class="col-3">
                                    <input placeholder="01-2026" required v-model="matricula.ciclo" type="text" class="form-control">
                                </div>
                                <div class="col-2">ESTADO:</div>
                                <div class="col-4">
                                    <select v-model="matricula.estado" class="form-select">
                                        <option value="Activo">Activo</option>
                                        <option value="Inactivo">Inactivo</option>
                                        <option value="Pendiente">Pendiente</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div class="card-footer">
                            <div class="row">
                                <div class="col text-center">
                                    <button type="submit" class="btn btn-primary">GUARDAR</button>
                                    <button type="reset" class="btn btn-warning">NUEVO</button>
                                    <button type="button" @click="buscarMatricula" class="btn btn-success">BUSCAR</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    `
};