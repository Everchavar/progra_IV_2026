const inscripciones = {
    props:['forms'],
    data(){
        return{
            inscripcion:{
                idInscripcion:0,
                idMatricula:"", 
                alumno:"",      
                materia:"",     
                fecha:"",
                ciclo:"" 
            },
            accion:'nuevo'
        }
    },
    methods:{
        // Función para convertir números a Romanos del 1 al 10
        getRomano(n) {
            const romanos = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
            return romanos[n - 1] || n;
        },
        buscarInscripcion(){
            this.forms.busqueda_inscripciones.mostrar = !this.forms.busqueda_inscripciones.mostrar;
            this.$emit('buscar');
        },
        modificarInscripcion(inscripcion){
            this.accion = 'modificar';
            this.idInscripcion = inscripcion.idInscripcion;
            this.inscripcion.idMatricula = inscripcion.idMatricula;
            this.inscripcion.alumno = inscripcion.alumno;
            this.inscripcion.materia = inscripcion.materia;
            this.inscripcion.fecha = inscripcion.fecha;
            this.inscripcion.ciclo = inscripcion.ciclo;
        },
        async guardarInscripcion() {
            let datos = {
                idInscripcion: this.accion=='modificar' ? this.idInscripcion : this.getId(),
                idMatricula: this.inscripcion.idMatricula,
                alumno: this.inscripcion.alumno,
                materia: this.inscripcion.materia,
                fecha: this.inscripcion.fecha,
                ciclo: this.inscripcion.ciclo
            };

            await db.inscripciones.put(datos);
            this.limpiarFormulario();
            alertify.success(`Inscripción guardada correctamente`);
        },
        getId(){
            return new Date().getTime();
        },
        limpiarFormulario(){
            this.accion = 'nuevo';
            this.idInscripcion = 0;
            this.inscripcion.idMatricula = '';
            this.inscripcion.alumno = '';
            this.inscripcion.materia = '';
            this.inscripcion.fecha = '';
            this.inscripcion.ciclo = '';
        },
    },
    template: `
        <div class="row">
            <div class="col-6">
                <form id="frmInscripcion" @submit.prevent="guardarInscripcion" @reset.prevent="limpiarFormulario">
                    <div class="card text-bg-dark mb-3">
                        <div class="card-header">REGISTRO DE INSCRIPCIÓN</div>
                        <div class="card-body">
                            <div class="row p-1">
                                <div class="col-3">MATRÍCULA ID:</div>
                                <div class="col-4">
                                    <input placeholder="Cód. Matrícula" required v-model="inscripcion.idMatricula" type="text" class="form-control">
                                </div>
                                <div class="col-2">FECHA:</div>
                                <div class="col-3">
                                    <input required v-model="inscripcion.fecha" type="date" class="form-control">
                                </div>
                            </div>
                            <div class="row p-1">
                                <div class="col-3">ALUMNO:</div>
                                <div class="col-9">
                                    <input placeholder="Nombre del alumno" required v-model="inscripcion.alumno" type="text" class="form-control">
                                </div>
                            </div>
                            <div class="row p-1">
                                <div class="col-3">MATERIA:</div>
                                <div class="col-9">
                                    <input placeholder="Materia a inscribir" required v-model="inscripcion.materia" type="text" class="form-control">
                                </div>
                            </div>
                            <div class="row p-1">
                                <div class="col-3">CICLO:</div>
                                <div class="col-9">
                                    <select v-model="inscripcion.ciclo" class="form-select" required>
                                        <option disabled value="">Seleccione el ciclo académico</option>
                                        <option v-for="n in 10" :key="n" :value="n">Ciclo {{ getRomano(n) }}</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div class="card-footer text-center">
                            <button type="submit" class="btn btn-primary m-1">INSCRIBIR</button>
                            <button type="reset" class="btn btn-warning m-1">NUEVO</button>
                            <button type="button" @click="buscarInscripcion" class="btn btn-success m-1">LISTADO</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    `
};