const busqueda_materias = {
    data(){
        return{
            buscar:'',
            materias:[]
        }
    },
    methods:{
        modificarMateria(materia){
            this.$emit('modificar', materia);
        },
        async obtenerMaterias(){
            this.materias = await db.materias.orderBy('codigo').filter(
                materia => materia.codigo.toLowerCase().includes(this.buscar.toLowerCase())
                    || materia.nombre.toLowerCase().includes(this.buscar.toLowerCase())
            ).toArray();
        },
        async eliminarMateria(materia, e){
            e.stopPropagation();
            alertify.confirm('Eliminar materia', `¿Está seguro de eliminar ${materia.nombre}?`, async e=>{
                await db.materias.delete(materia.idMateria);
                this.obtenerMaterias();
                alertify.success(`Materia ${materia.nombre} eliminada`);
            }, () => {});
        },
    },
    template: `
        <div>
            <div class="d-flex align-items-center mb-3 border-bottom pb-2">
                <i class="bi bi-search me-2 fs-5 text-body-secondary"></i>
                <h5 class="mb-0 fw-semibold text-body">Búsqueda de Materias</h5>
            </div>
            <div class="mb-3" style="max-width: 340px;">
                <input autocomplete="off" type="search" @keyup="obtenerMaterias()" v-model="buscar"
                    placeholder="Buscar por código o nombre..." class="form-control form-control-sm bg-transparent">
            </div>
            <div class="table-responsive">
                <table class="table table-sm table-hover align-middle" id="tblMaterias">
                    <thead class="bg-body-secondary">
                        <tr>
                            <th class="text-body-secondary small text-uppercase fw-bold">Código</th>
                            <th class="text-body-secondary small text-uppercase fw-bold">Nombre</th>
                            <th class="text-body-secondary small text-uppercase fw-bold text-center">UV</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="materias.length === 0">
                            <td colspan="4" class="text-center text-body-secondary py-3 small italic">Sin resultados</td>
                        </tr>
                        <tr v-for="materia in materias" :key="materia.idMateria" @click="modificarMateria(materia)" style="cursor:pointer;">
                            <td class="small text-body-secondary fw-semibold">{{ materia.codigo }}</td>
                            <td class="small fw-semibold text-body">{{ materia.nombre }}</td>
                            <td class="small text-center">
                                <span class="badge shadow-sm" style="background-color:#1a3a5c;">{{ materia.uv }} UV</span>
                            </td>
                            <td>
                                <button class="btn btn-outline-danger btn-sm py-0 px-2" @click="eliminarMateria(materia, $event)">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `
};