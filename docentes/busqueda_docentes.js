const busqueda_docentes = {
    data(){
        return{
            buscar:'',
            docentes:[]
        }
    },
    emits: ['modificar', 'ir-registro'],
    methods:{
        modificarDocente(docente){
            this.$emit('modificar', docente);
        },
        async obtenerDocentes(){
            const search = this.buscar.toLowerCase();
            
            // UNIÓN RELACIONAL v11
            const allDocentes = await db.docentes.toArray();
            const allPerfiles = await db.perfiles.toArray();
            
            const perfilesMap = allPerfiles.reduce((acc, p) => {
                acc[p.usuarioId] = p;
                return acc;
            }, {});

            this.docentes = allDocentes
                .map(d => ({ ...d, ...(perfilesMap[d.usuarioId] || {}) }))
                .filter(d => 
                    d.carnet.toLowerCase().includes(search) || 
                    (d.nombre && d.nombre.toLowerCase().includes(search))
                );
        },
        async eliminarDocente(docente, e){
            e.stopPropagation();
            alertify.confirm('Eliminar docente', `¿Está seguro de eliminar a ${docente.nombre}?`, async e=>{
                await db.docentes.delete(docente.idDocente);
                this.obtenerDocentes();
                alertify.success(`Docente ${docente.nombre} eliminado`);
            }, () => {});
        },
    },
    template: `
        <div>
            <div class="d-flex align-items-center mb-3 border-bottom pb-2">
                <i class="bi bi-search me-2 fs-5 text-secondary"></i>
                <h5 class="mb-0 fw-semibold">Búsqueda de Docentes</h5>
                <button class="btn btn-sm btn-outline-secondary ms-auto px-3"
                        @click="$emit('ir-registro')">
                    <i class="bi bi-arrow-left me-1"></i>Volver al registro
                </button>
            </div>
            <div class="mb-3" style="max-width: 340px;">
                <input autocomplete="off" type="search" @keyup="obtenerDocentes()" v-model="buscar"
                    placeholder="Buscar por carnet o nombre..." class="form-control form-control-sm bg-transparent">
            </div>
            <div class="table-responsive">
                <table class="table table-sm table-hover align-middle" id="tblDocentes">
                    <thead class="table-light">
                        <tr>
                            <th class="text-body-secondary small text-uppercase fw-bold">Carnet</th>
                            <th class="text-muted small text-uppercase fw-semibold">Nombre</th>
                            <th class="text-muted small text-uppercase fw-semibold">Dirección</th>
                            <th class="text-muted small text-uppercase fw-semibold">Email</th>
                            <th class="text-muted small text-uppercase fw-semibold">Teléfono</th>
                            <th class="text-muted small text-uppercase fw-semibold">Escalafón</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="docentes.length === 0">
                            <td colspan="7" class="text-center text-muted py-3 small">Sin resultados</td>
                        </tr>
                        <tr v-for="docente in docentes" :key="docente.idDocente"
                            @click="modificarDocente(docente)" style="cursor:pointer;">
                            <td class="small font-monospace">{{ docente.carnet }}</td>
                            <td class="small fw-semibold">{{ docente.nombre }}</td>
                            <td class="small text-muted">{{ docente.direccion }}</td>
                            <td class="small text-muted">{{ docente.email }}</td>
                            <td class="small text-muted">{{ docente.telefono }}</td>
                            <td>
                                <span class="badge bg-secondary text-capitalize">{{ docente.escalafon }}</span>
                            </td>
                            <td>
                                <button class="btn btn-outline-danger btn-sm py-0 px-2"
                                        @click="eliminarDocente(docente, $event)">
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