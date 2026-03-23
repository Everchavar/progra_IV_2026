const busqueda_materias = {
    data(){
        return{
            buscar:'',
            materias:[]
        }
    },
    mounted(){
        this.obtenerMaterias();
    },
    methods:{
        modificarMateria(materia){
            this.$emit('modificar', materia);
        },
        async obtenerMaterias(){
            let totalLocal = await db.materias.count();
            if(totalLocal <= 0){
                let formData = new FormData();
                formData.append('accion', 'consultar');
                try {
                    let respuesta = await fetch("private/modulos/materias/materia.php", {
                        method: "POST",
                        body: formData
                    });
                    let data = await respuesta.json();
                    if (Array.isArray(data) && data.length > 0) {
                        await db.materias.bulkPut(data);
                    }
                } catch (error) { console.error(error); }
            }

            this.materias = await db.materias.orderBy('codigo').filter(
                materia => materia.codigo.toLowerCase().includes(this.buscar.toLowerCase()) 
                    || materia.nombre.toLowerCase().includes(this.buscar.toLowerCase())
            ).toArray();
        },
        async eliminarMateria(materia, e){
            e.stopPropagation();
            alertify.confirm('Confirmar Acción', `¿Confirma la eliminación de la materia ${materia.nombre}?`, async e=>{
                let formData = new FormData();
                formData.append('materias', JSON.stringify({idMateria: materia.idMateria}));
                formData.append('accion', 'eliminar');

                try {
                    let respuesta = await fetch("private/modulos/materias/materia.php", {
                        method: "POST",
                        body: formData
                    });
                    let res = await respuesta.json();
                    if (res === true) {
                        await db.materias.delete(materia.idMateria);
                        this.obtenerMaterias();
                        alertify.success(`Eliminado correctamente`);
                    }
                } catch (error) { console.error(error); }
            }, () => {});
        },
    },
    template: `
        <div class="row">
            <div class="col-8">
                <div class="card shadow-lg border-0 mt-3" v-draggable style="background-color: #e0f2f1; border-radius: 20px; max-height: 480px; overflow: hidden;">
                    <div class="card-header border-0 d-flex justify-content-between align-items-center p-3" style="background-color: #00acc1; color: #ffffff;">
                        <span class="fw-bold fs-5"><i class="bi bi-stack"></i> MATERIAS</span>
                        <div class="w-40">
                            <input autocomplete="off" type="search" @keyup="obtenerMaterias()" v-model="buscar" 
                                placeholder="Filtrar materia..." class="form-control form-control-sm shadow-none border-0" style="border-radius: 20px; background-color: #ffffff;">
                        </div>
                    </div>
                    <div class="card-body p-0" style="overflow-y: auto;">
                        <table class="table table-sm table-hover mb-0 align-middle text-center">
                            <thead style="background-color: #b2ebf2; color: #006064; font-size: 0.8rem; text-transform: uppercase;">
                                <tr>
                                    <th class="ps-4 py-3">CÓDIGO</th>
                                    <th>ASIGNATURA</th>
                                    <th>UNIDADES VALORATIVAS</th>
                                    <th class="text-end pe-4">ACCIONES</th>
                                </tr>
                            </thead>
                            <tbody style="font-size: 0.88rem; background-color: #fff;">
                                <tr v-for="materia in materias" :key="materia.idMateria" @click="modificarMateria(materia)" style="cursor: pointer; border-bottom: 1px solid #e0f7fa;">
                                    <td class="ps-4 py-3"><span class="badge" style="background-color: #00acc1; color: #fff;">{{ materia.codigo }}</span></td>
                                    <td class="fw-bold text-dark text-start">{{ materia.nombre }}</td>
                                    <td class="fw-bold text-info">{{ materia.uv }} UV</td>
                                    <td class="text-end pe-4">
                                        <button class="btn btn-sm btn-link text-danger p-0 fw-bold text-decoration-none" @click="eliminarMateria(materia, $event)">Borrar</button>
                                    </td>
                                </tr>
                                <tr v-if="materias.length === 0">
                                    <td colspan="4" class="text-center text-muted p-5">Sin registros de materias.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `
};