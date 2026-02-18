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
            alertify.confirm('Eliminar materias', `¿Está seguro de eliminar el materia ${materia.nombre}?`, async e=>{
                await db.materias.delete(materia.idMateria);
                this.obtenerMaterias();
                alertify.success(`Materia ${materia.nombre} eliminada correctamente`);
            }, () => {
                //No hacer nada
            });
        },
    },
    template: `
        <div class="row">
            <div class="col-6">
                <table class="table table-striped table-hover" id="tblMaterias">
                    <thead>
                        <tr>
                            <th colspan="6">
                                <input autocomplete="off" type="search" @keyup="obtenerMaterias()" v-model="buscar" placeholder="Buscar materia" class="form-control">
                            </th>
                        </tr>
                        <tr>
                            <th>CODIGO</th>
                            <th>NOMBRE</th>
                            <th>UV</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="materia in materias" :key="materia.idMateria" @click="modificarMateria(materia)">
                            <td>{{ materia.codigo }}</td>
                            <td>{{ materia.nombre }}</td>
                            <td>{{ materia.uv }}</td>
                            <td>
                                <button class="btn btn-danger" @click="eliminarMateria(materia, $event)">DEL</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `
};