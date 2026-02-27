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
            const query = this.buscar.toLowerCase().trim();
            let rawMatriculas = await db.matricula.toArray();
            let rawAlumnos = await db.alumnos.toArray();
            let rawPerfiles = await db.perfiles.toArray();
            
            const perMap = rawPerfiles.reduce((acc, p) => (acc[p.usuarioId] = p, acc), {});
            const aluMap = rawAlumnos.reduce((acc, a) => (acc[a.idAlumno] = a, acc), {});

            this.matriculas = rawMatriculas.map(m => {
                const al = aluMap[m.alumnoId];
                const perfil = al ? perMap[al.usuarioId] : null;
                return {
                    ...m,
                    _alumnoNombre: perfil ? perfil.nombre : (m._alumnoNombre || 'Desconocido'),
                    _carreraNombre: m._carreraNombre || ''
                };
            }).filter(m => 
                (m.codigo || '').toLowerCase().includes(query) ||
                (m._alumnoNombre || '').toLowerCase().includes(query)
            );
        },
        async eliminarMatricula(matricula, e){
            e.stopPropagation();
            alertify.confirm('Eliminar matrícula', `¿Eliminar la matrícula de ${matricula.nombreAlumno}?`, async e=>{
                await db.matricula.delete(matricula.idMatricula);
                this.obtenerMatriculas();
                alertify.success(`Matrícula eliminada`);
            }, () => {});
        },
    },
    template: `
        <div>
            <div class="d-flex align-items-center mb-3 border-bottom pb-2">
                <i class="bi bi-search me-2 fs-5 text-body-secondary"></i>
                <h5 class="mb-0 fw-semibold text-body">Búsqueda de Matrículas</h5>
            </div>
            <div class="mb-3" style="max-width: 380px;">
                <input autocomplete="off" type="search" @keyup="obtenerMatriculas()" v-model="buscar"
                    placeholder="Buscar por código, alumno o carrera..." class="form-control form-control-sm bg-transparent">
            </div>
            <div class="table-responsive">
                <table class="table table-sm table-hover align-middle" id="tblMatricula">
                    <thead class="bg-body-secondary">
                        <tr>
                            <th class="text-body-secondary small text-uppercase fw-bold">Código</th>
                            <th class="text-body-secondary small text-uppercase fw-bold">Alumno</th>
                            <th class="text-body-secondary small text-uppercase fw-bold">Carrera</th>
                            <th class="text-body-secondary small text-uppercase fw-bold">Ciclo</th>
                            <th class="text-body-secondary small text-uppercase fw-bold">Fecha</th>
                            <th class="text-body-secondary small text-uppercase fw-bold">Estado</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="matriculas.length === 0">
                            <td colspan="7" class="text-center text-body-secondary py-3 small italic">Sin resultados</td>
                        </tr>
                        <tr v-for="item in matriculas" :key="item.idMatricula" @click="modificarMatricula(item)" style="cursor:pointer;">
                            <td class="small text-body-secondary fw-semibold">{{ item.codigo }}</td>
                            <td class="small fw-semibold text-body">{{ item._alumnoNombre }}</td>
                            <td class="small text-body-secondary">{{ item._carreraNombre }}</td>
                            <td class="small text-body-secondary">{{ item._periodoCiclo || item.ciclo }}</td>
                            <td class="small text-body-secondary">{{ item.fechaCreacion || item.fecha }}</td>
                            <td>
                                <span :class="['badge', item.estado === 'Activo' ? 'text-bg-success' : item.estado === 'Pendiente' ? 'text-bg-warning' : 'text-bg-secondary']">
                                    {{ item.estado }}
                                </span>
                            </td>
                            <td>
                                <button class="btn btn-outline-danger btn-sm py-0 px-2" @click="eliminarMatricula(item, $event)">
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