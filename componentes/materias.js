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
            if(this.accion=='nuevo'){
                let exist = await db.materias.filter(m => m.codigo.toLowerCase() === datos.codigo.toLowerCase()).toArray();
                if(exist.length > 0){
                    alertify.error(`Cód. ya existe: ${exist[0].nombre}`);
                    return;
                }
            }
            let formData = new FormData();
            formData.append('materias', JSON.stringify(datos));
            formData.append('accion', this.accion);

            try {
                let respuesta = await fetch("private/modulos/materias/materia.php", {
                    method: "POST",
                    body: formData
                });
                let res = await respuesta.json();
                
                if (res === true || (typeof res === 'object' && res.msg === 'ok')) {
                    db.materias.put(datos);
                    this.limpiarFormulario();
                    alertify.success('Materia guardada correctamente');
                    this.$emit('guardar');
                }
            } catch (e) { console.error(e); }
        },
        getId(){
            return uuid.v4();
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
        <div class="row">
            <div class="col-8">
                <form id="frmMaterias" v-draggable @submit.prevent="guardarMateria" @reset.prevent="limpiarFormulario">
                    <div class="card mb-3 shadow-lg border-0" style="background-color: #e0f7fa; border-radius: 20px; overflow: hidden;">
                        <div class="card-header border-0 p-4" style="background-color: #00acc1; color: #ffffff;">
                            <h4 class="mb-0 fw-bold"><i class="bi bi-journal-bookmark-fill"></i> MATERIAS</h4>
                            <p class="mb-0 small opacity-75">Catálogo institucional de materias</p>
                        </div>
                        <div class="card-body p-4">
                            <div class="row mb-3">
                                <div class="col-4">
                                    <label class="form-label fw-bold text-secondary small">CÓDIGO CATÁLOGO:</label>
                                    <input placeholder="MAT-XXX" required v-model="materia.codigo" type="text" class="form-control border-0 shadow-sm" style="background-color: #fff; border-radius: 12px;">
                                </div>
                                <div class="col-8">
                                    <label class="form-label fw-bold text-secondary small">NOMBRE DE ASIGNATURA:</label>
                                    <input placeholder="Ej. Programación IV" required v-model="materia.nombre" type="text" class="form-control border-0 shadow-sm" style="background-color: #fff; border-radius: 12px;">
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-4">
                                    <label class="form-label fw-bold text-secondary small">UNIDADES VALORATIVAS (UV):</label>
                                    <input placeholder="0-5" required v-model="materia.uv" type="number" step="1" class="form-control border-0 shadow-sm" style="background-color: #fff; border-radius: 12px;">
                                </div>
                            </div>
                        </div>
                        <div class="card-footer border-0 p-4 text-center" style="background-color: #b2ebf2;">
                            <button type="submit" class="btn btn-info px-4 fw-bold text-white me-2 shadow-sm" style="background-color: #0097a7; border: none; border-radius: 12px;">GUARDAR EN CATÁLOGO</button>
                            <button type="reset" class="btn btn-outline-info px-4 fw-bold me-2" style="border-radius: 12px;">NUEVO</button>
                            <button type="button" @click="buscarMateria" class="btn btn-light px-4 fw-bold border shadow-sm" style="border-radius: 12px; color: #00838f;">BUSCAR</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    `
};