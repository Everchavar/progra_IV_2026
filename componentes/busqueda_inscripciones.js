const busqueda_inscripciones = {
    data(){
        return{
            buscar:'',
            inscripciones:[]
        }
    },
    methods:{
        getRomano(n) {
            const romanos = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
            return romanos[n - 1] || n;
        },
        modificarInscripcion(ins){
            this.$emit('modificar', ins);
        },
        async obtenerInscripciones(){
            this.inscripciones = await db.inscripciones.filter(
                ins => ins.alumno.toLowerCase().includes(this.buscar.toLowerCase()) 
                    || ins.materia.toLowerCase().includes(this.buscar.toLowerCase())
            ).toArray();
        },
        async eliminarInscripcion(ins, e){
            e.stopPropagation();
            alertify.confirm('Eliminar', `¿Eliminar materia ${ins.materia}?`, async e=>{
                await db.inscripciones.delete(ins.idInscripcion);
                this.obtenerInscripciones();
                alertify.success(`Eliminado`);
            }, () => {});
        },
    },
    template: `
        <div class="row">
            <div class="col-12">
                <table class="table table-striped table-hover">
                    <thead>
                        <tr>
                            <th colspan="5">
                                <input type="search" @keyup="obtenerInscripciones()" v-model="buscar" placeholder="Buscar por alumno o materia..." class="form-control">
                            </th>
                        </tr>
                        <tr>
                            <th>ALUMNO</th>
                            <th>MATERIA</th>
                            <th>FECHA</th>
                            <th class="text-center">CICLO</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="ins in inscripciones" :key="ins.idInscripcion" @click="modificarInscripcion(ins)" style="cursor:pointer">
                            <td>{{ ins.alumno }}</td>
                            <td>{{ ins.materia }}</td>
                            <td>{{ ins.fecha }}</td>
                            <td class="text-center">
                                <span class="badge bg-info text-dark">{{ getRomano(ins.ciclo) }}</span>
                            </td>
                            <td>
                                <button class="btn btn-danger btn-sm" @click="eliminarInscripcion(ins, $event)">ELIMINAR</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `
};