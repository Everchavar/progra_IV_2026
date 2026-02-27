const busqueda_alumnos = {
    data(){
        return{
            buscar:'',
            alumnos:[]
        }
    },
    methods:{
        modificarAlumno(alumno){
            this.$emit('modificar', alumno);
        },
        async obtenerAlumnos(){
            const search = this.buscar.toLowerCase();
            
            // 1. Obtener todos los alumnos y todos los perfiles relacionados
            const allAlumnos = await db.alumnos.toArray();
            const allPerfiles = await db.perfiles.toArray();
            
            // 2. Mapear para búsqueda rápida por usuarioId
            const perfilesMap = allPerfiles.reduce((acc, p) => {
                acc[p.usuarioId] = p;
                return acc;
            }, {});

            // 3. Filtrar y Unir
            this.alumnos = allAlumnos
                .map(a => ({ ...a, ...(perfilesMap[a.usuarioId] || {}) }))
                .filter(a => 
                    a.carnet.toLowerCase().includes(search) || 
                    (a.nombre && a.nombre.toLowerCase().includes(search))
                );
        },
        async eliminarAlumno(alumno, e){
            e.stopPropagation();
            alertify.confirm('Eliminar alumno', `¿Está seguro de eliminar a ${alumno.nombre}?`, async e=>{
                await db.alumnos.delete(alumno.idAlumno);
                this.obtenerAlumnos();
                alertify.success(`Alumno ${alumno.nombre} eliminado`);
            }, () => {});
        },
    },
    template: `
        <div>
            <div class="d-flex align-items-center mb-3 border-bottom pb-2">
                <i class="bi bi-search me-2 fs-5 text-body-secondary"></i>
                <h5 class="mb-0 fw-semibold text-body">Búsqueda de Alumnos</h5>
            </div>
            <div class="mb-3" style="max-width: 340px;">
                <input autocomplete="off" type="search" @keyup="obtenerAlumnos()" v-model="buscar"
                    placeholder="Buscar por carnet o nombre..." class="form-control form-control-sm bg-transparent">
            </div>
            <div class="table-responsive">
                <table class="table table-sm table-hover align-middle" id="tblAlumnos">
                    <thead class="bg-body-secondary">
                        <tr>
                            <th class="text-body-secondary small text-uppercase fw-bold">Carnet</th>
                            <th class="text-body-secondary small text-uppercase fw-bold">Nombre</th>
                            <th class="text-body-secondary small text-uppercase fw-bold">Dirección</th>
                            <th class="text-body-secondary small text-uppercase fw-bold">Email</th>
                            <th class="text-body-secondary small text-uppercase fw-bold">Teléfono</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="alumnos.length === 0">
                            <td colspan="6" class="text-center text-body-secondary py-3 small italic">Sin resultados</td>
                        </tr>
                        <tr v-for="alumno in alumnos" :key="alumno.idAlumno" @click="modificarAlumno(alumno)" style="cursor:pointer;">
                            <td class="small font-monospace">{{ alumno.carnet }}</td>
                            <td class="small fw-semibold text-body">{{ alumno.nombre }}</td>
                            <td class="small text-body-secondary">{{ alumno.direccion }}</td>
                            <td class="small text-body-secondary">{{ alumno.email }}</td>
                            <td class="small text-body-secondary">{{ alumno.telefono }}</td>
                            <td>
                                <button class="btn btn-outline-danger btn-sm py-0 px-2" @click="eliminarAlumno(alumno, $event)">
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