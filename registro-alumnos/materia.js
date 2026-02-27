const materias = {
    props:['forms'],
    data(){
        return{
            materia:{
                idMateria:0,
                codigo:"",
                nombre:"",
                uv:'',
            },
            accion:'nuevo',
            idMateria:0,
            data_materias:[]
        }
    },
    methods:{
        buscarMateria(){
            this.forms.busqueda_materias.mostrar = !this.forms.busqueda_materias.mostrar;
            this.$emit('buscar');
        },
        modificarMateria(materia){
            this.accion = 'modificar';
            this.idMateria = materia.idMateria;
            this.materia.codigo = materia.codigo;
            this.materia.nombre = materia.nombre;
            this.materia.uv = materia.uv;
        },
        async guardarMateria() {
            let datos = {
                idMateria: this.accion=='modificar' ? this.idMateria : this.getId(),
                codigo: this.materia.codigo,
                nombre: this.materia.nombre,
                uv: this.materia.uv,
            };
            this.buscar = datos.codigo;

            if(this.data_materias.length > 0 && this.accion=='nuevo'){
                alertify.error(`El codigo de la materia ya existe, ${this.data_materias[0].nombre}`);
                return;
            }
            db.materias.put(datos);
            this.limpiarFormulario();
            alertify.success(`Materia ${datos.nombre} guardada correctamente`);
        },
        getId(){
            return new Date().getTime();
        },
        limpiarFormulario(){
            this.accion = 'nuevo';
            this.idMateria = 0;
            this.materia.codigo = '';
            this.materia.nombre = '';
            this.materia.uv = '';
        },
    },
    template: `
        <div>
            <div class="d-flex align-items-center mb-3 border-bottom pb-2">
                <i class="bi bi-book me-2 fs-5 text-body-secondary"></i>
                <h5 class="mb-0 fw-semibold text-body">Registro de Materias</h5>
                <span v-if="accion=='modificar'" class="badge bg-warning text-dark ms-2">Editando</span>
            </div>
            <form id="frmMaterias" @submit.prevent="guardarMateria" @reset.prevent="limpiarFormulario">
                <div class="card border-0 shadow-sm bg-body-tertiary" style="max-width: 420px;">
                    <div class="card-body p-4">
                        <div class="mb-3 row align-items-center">
                            <label class="col-sm-3 col-form-label text-body-secondary small fw-bold text-uppercase">Código</label>
                            <div class="col-sm-4">
                                <input placeholder="Ej. MAT-101" required v-model="materia.codigo" type="text" class="form-control form-control-sm bg-transparent">
                            </div>
                        </div>
                        <div class="mb-3 row align-items-center">
                            <label class="col-sm-3 col-form-label text-body-secondary small fw-bold text-uppercase">Nombre</label>
                            <div class="col-sm-8">
                                <input placeholder="Nombre de la materia" required v-model="materia.nombre" type="text" class="form-control form-control-sm bg-transparent">
                            </div>
                        </div>
                        <div class="mb-1 row align-items-center">
                            <label class="col-sm-3 col-form-label text-body-secondary small fw-bold text-uppercase">UV</label>
                            <div class="col-sm-3">
                                <input placeholder="0" required v-model="materia.uv" type="number" min="1" class="form-control form-control-sm bg-transparent">
                            </div>
                            <div class="col-sm-5">
                                <small class="text-body-secondary">Unidades valorativas</small>
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
                        <button type="button" @click="buscarMateria" class="btn btn-sm btn-outline-success px-3 ms-auto">
                            <i class="bi bi-search me-1"></i>Buscar
                        </button>
                    </div>
                </div>
            </form>
        </div>
    `
};