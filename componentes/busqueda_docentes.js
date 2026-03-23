const busqueda_docentes = {
    data(){
        return{
            buscar:'',
            docentes:[]
        }
    },
        mounted(){
            this.obtenerDocentes();
        },
        methods:{
            modificarDocente(docente){
                this.$emit('modificar', docente);
            },
            async obtenerDocentes(){
                let totalLocal = await db.docentes.count();
                if(totalLocal <= 0){
                    let formData = new FormData();
                    formData.append('accion', 'consultar');
                    try {
                        let respuesta = await fetch("private/modulos/docentes/docente.php", {
                            method: "POST",
                            body: formData
                        });
                        let data = await respuesta.json();
                        if (Array.isArray(data) && data.length > 0) {
                            await db.docentes.bulkPut(data);
                        }
                    } catch (error) { console.error(error); }
                }

                this.docentes = await db.docentes.filter(
                    docente => docente.codigo.toLowerCase().includes(this.buscar.toLowerCase()) 
                        || docente.nombre.toLowerCase().includes(this.buscar.toLowerCase())
                        || docente.email.toLowerCase().includes(this.buscar.toLowerCase())
                ).toArray();
            },
        async eliminarDocente(docente, e){
            e.stopPropagation();
            alertify.confirm('Confirmar Acción', `¿Confirma la eliminación definitiva del docente ${docente.nombre}?`, async e=>{
                let formData = new FormData();
                formData.append('docentes', JSON.stringify({idDocente: docente.idDocente}));
                formData.append('accion', 'eliminar');

                try {
                    let respuesta = await fetch("private/modulos/docentes/docente.php", {
                        method: "POST",
                        body: formData
                    });
                    let res = await respuesta.json();
                    if (res === true) {
                        await db.docentes.delete(docente.idDocente);
                        this.obtenerDocentes();
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
                    <div class="card-header border-0 d-flex justify-content-between align-items-center p-3" style="background-color: #80deea; color: #006064;">
                        <span class="fw-bold fs-5"><i class="bi bi-shield-lock-fill"></i> DOCENTES</span>
                        <div class="w-50">
                            <input autocomplete="off" type="search" @keyup="obtenerDocentes()" v-model="buscar" 
                                placeholder="Buscar por nombre o nivel..." class="form-control form-control-sm shadow-none border-0" style="border-radius: 20px; background-color: #ffffff;">
                        </div>
                    </div>
                    <div class="card-body p-0" style="overflow-y: auto;">
                        <table class="table table-sm table-hover mb-0 align-middle">
                            <thead style="background-color: #b2ebf2; color: #006064; font-size: 0.8rem; text-transform: uppercase;">
                                <tr>
                                    <th class="ps-4 py-3">CÓDIGO EMPL.</th>
                                    <th>CÁTEDRA / DOCENTE</th>
                                    <th>CALIFICACIÓN</th>
                                    <th>CENTRO DE APOYO</th>
                                    <th class="text-end pe-4">GESTIÓN</th>
                                </tr>
                            </thead>
                            <tbody style="font-size: 0.88rem; background-color: #fff;">
                                <tr v-for="docente in docentes" :key="docente.idDocente" @click="modificarDocente(docente)" style="cursor: pointer; border-bottom: 1px solid #e0f7fa;">
                                    <td class="ps-4 py-3"><span class="badge" style="background-color: #00acc1; color: #fff;">{{ docente.codigo }}</span></td>
                                    <td>
                                        <div class="fw-bold text-dark">{{ docente.nombre }}</div>
                                        <div class="small fw-bold text-info" style="font-size: 0.75rem;">{{ docente.email }}</div>
                                    </td>
                                    <td><span class="badge border border-info text-info fw-normal px-2" style="background-color: #fff;">{{ docente.escalafon }}</span></td>
                                    <td class="text-muted small">
                                        {{ docente.telefono }}<br>
                                        <span class="opacity-75" style="font-size: 0.7rem;">{{ docente.direccion }}</span>
                                    </td>
                                    <td class="text-end pe-4">
                                        <button class="btn btn-sm btn-link text-danger p-0 fw-bold text-decoration-none" @click="eliminarDocente(docente, $event)">Borrar</button>
                                    </td>
                                </tr>
                                <tr v-if="docentes.length === 0">
                                    <td colspan="5" class="text-center text-muted p-5">La búsqueda no arrojó resultados académicos.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `
};