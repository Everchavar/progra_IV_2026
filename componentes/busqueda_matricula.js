const busqueda_matricula = {
    data(){
        return{
            buscar:'',
            matriculas:[]
        }
    },
    methods:{
        modificarMatricula(matricula){
            this.$emit('modificar', matricula);
        },
        async obtenerMatriculas(){
            this.matriculas = await db.matricula.filter(
                matricula => matricula.codigo.toLowerCase().includes(this.buscar.toLowerCase()) 
                    || matricula.nombreAlumno.toLowerCase().includes(this.buscar.toLowerCase())
                    || matricula.carrera.toLowerCase().includes(this.buscar.toLowerCase())
            ).toArray();
        },
        async eliminarMatricula(matricula, e){
            e.stopPropagation();
            alertify.confirm('Eliminar Matrícula', `¿Está seguro de eliminar la matrícula de ${matricula.nombreAlumno}?`, async e=>{
                await db.matricula.delete(matricula.idMatricula);
                this.obtenerMatriculas();
                alertify.success(`Matrícula de ${matricula.nombreAlumno} eliminada correctamente`);
            }, () => {
                //No hacer nada
            });
        },
    },
    template: `
        <div class="row">
            <div class="col-12">
                <table class="table table-striped table-hover" id="tblMatricula">
                    <thead>
                        <tr>
                            <th colspan="7">
                                <input autocomplete="off" type="search" @keyup="obtenerMatriculas()" v-model="buscar" placeholder="Buscar por código, alumno o carrera..." class="form-control">
                            </th>
                        </tr>
                        <tr>
                            <th>CÓDIGO</th>
                            <th>ALUMNO</th>
                            <th>CARRERA</th>
                            <th>CICLO</th>
                            <th>FECHA</th>
                            <th>ESTADO</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in matriculas" :key="item.idMatricula" @click="modificarMatricula(item)" style="cursor:pointer">
                            <td>{{ item.codigo }}</td>
                            <td>{{ item.nombreAlumno }}</td>
                            <td>{{ item.carrera }}</td>
                            <td>{{ item.ciclo }}</td>
                            <td>{{ item.fecha }}</td>
                            <td>
                                <span :class="['badge', item.estado === 'Activo' ? 'text-bg-success' : 'text-bg-secondary']">
                                    {{ item.estado }}
                                </span>
                            </td>
                            <td>
                                <button class="btn btn-danger btn-sm" @click="eliminarMatricula(item, $event)">DEL</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `
};