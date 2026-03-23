const busqueda_alumnos = {
    data(){
        return{
            buscar:'',
            alumnos:[]
        }
    },
    mounted(){
        this.obtenerAlumnos();
    },
    methods:{
        modificarAlumno(alumno){
            this.$emit('modificar', alumno);
        },
        async obtenerAlumnos(){
            let totalLocal = await db.alumnos.count();
            if(totalLocal <= 0){
                let formData = new FormData();
                formData.append('accion', 'consultar');
                try {
                    let respuesta = await fetch("private/modulos/alumnos/alumno.php", {
                        method: "POST",
                        body: formData
                    });
                    let data = await respuesta.json();
                    if (Array.isArray(data) && data.length > 0) {
                        await db.alumnos.bulkPut(data);
                    }
                } catch (error) { console.error(error); }
            }

            this.alumnos = await db.alumnos.filter(
                alumno => (
                    alumno.codigo.toLowerCase().includes(this.buscar.toLowerCase()) 
                    || alumno.nombre.toLowerCase().includes(this.buscar.toLowerCase())
                    || alumno.direccion.toLowerCase().includes(this.buscar.toLowerCase())
                )
            ).toArray();
        },
        async eliminarAlumno(alumno, e){
            e.stopPropagation();
            alertify.confirm('Confirmar Acción', `¿Desea eliminar a ${alumno.nombre}?`, async e=>{
                let formData = new FormData();
                formData.append('alumnos', JSON.stringify({idAlumno: alumno.idAlumno}));
                formData.append('accion', 'eliminar');

                try {
                    let respuesta = await fetch("private/modulos/alumnos/alumno.php", {
                        method: "POST",
                        body: formData
                    });
                    let res = await respuesta.json();
                    if (res === true) {
                        await db.alumnos.delete(alumno.idAlumno);
                        this.obtenerAlumnos();
                        alertify.success(`Eliminado con éxito`);
                    }
                } catch (error) { console.error(error); }
            }, () => {});
        },
    },
    template: `
        <div class="row">
            <div class="col-11">
                <div class="card shadow-lg border-0 mt-3" v-draggable style="background-color: #e0f2f1; border-radius: 20px; max-height: 480px; overflow: hidden;">
                    <div class="card-header border-0 d-flex justify-content-between align-items-center p-3" style="background-color: #00acc1; color: #ffffff;">
                        <span class="fw-bold fs-5"><i class="bi bi-person-lines-fill"></i> ALUMNOS</span>
                        <div class="w-50">
                            <input autocomplete="off" type="search" @keyup="obtenerAlumnos()" v-model="buscar" 
                                placeholder="Escriba nombre o código..." class="form-control form-control-sm shadow-none border-0" style="border-radius: 20px; background-color: #ffffff;">
                        </div>
                    </div>
                    <div class="card-body p-0" style="overflow-y: auto;">
                        <table class="table table-sm table-hover mb-0 align-middle">
                            <thead style="background-color: #b2ebf2; color: #006064; font-size: 0.8rem; text-transform: uppercase;">
                                <tr>
                                    <th class="ps-4 py-3">ID ACCESO</th>
                                    <th>CÁTEDRA / ESTUDIANTE</th>
                                    <th>DOMICILIO</th>
                                    <th>CONTACTO DIRECTO</th>
                                    <th class="text-end pe-4">GESTIÓN</th>
                                </tr>
                            </thead>
                            <tbody style="font-size: 0.88rem; background-color: #fff;">
                                <tr v-for="alumno in alumnos" :key="alumno.idAlumno" @click="modificarAlumno(alumno)" style="cursor: pointer; border-bottom: 1px solid #e0f7fa;">
                                    <td class="ps-4 py-3"><span class="badge" style="background-color: #00acc1; color: #fff;">{{ alumno.codigo }}</span></td>
                                    <td class="fw-bold text-dark">{{ alumno.nombre }}</td>
                                    <td class="text-muted small">{{ alumno.direccion }}</td>
                                    <td>
                                        <div class="fw-bold text-info small">{{ alumno.email }}</div>
                                        <div class="text-muted small">{{ alumno.telefono }}</div>
                                    </td>
                                    <td class="text-end pe-4">
                                        <button class="btn btn-sm btn-link text-danger p-0 fw-bold text-decoration-none" @click="eliminarAlumno(alumno, $event)">Borrar</button>
                                    </td>
                                </tr>
                                <tr v-if="alumnos.length === 0">
                                    <td colspan="5" class="text-center text-muted p-5">Haga clic en el buscador o registre un nuevo alumno.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `
};