const busqueda_inscripciones = {
    props: ['forms'],
    data() {
        return {
            buscar: '',
            inscripciones: []
        }
    },
    mounted(){
        this.obtenerInscripciones();
    },
    methods: {
        modificarInscripcion(inscripcion) {
            this.$emit('modificar', inscripcion);
        },
        async obtenerInscripciones() {
            let totalLocal = await db.inscripciones.count();
            if (totalLocal <= 0) {
                let formData = new FormData();
                formData.append('accion', 'consultar');
                try {
                    let respuesta = await fetch("private/modulos/inscripciones/inscripcion.php", {
                        method: "POST",
                        body: formData
                    });
                    let data = await respuesta.json();
                    if (Array.isArray(data) && data.length > 0) {
                        await db.inscripciones.clear(); // Limpiamos para asegurar que todos tengan el nombre
                        await db.inscripciones.bulkPut(data);
                    }
                } catch (error) { console.error(error); }
            }

            this.inscripciones = await db.inscripciones.filter(
                inscripcion => (
                    inscripcion.codigo_alumno?.toLowerCase().includes(this.buscar.toLowerCase())
                    || String(inscripcion.nombre_alumno)?.toLowerCase().includes(this.buscar.toLowerCase())
                    || String(inscripcion.materia)?.toLowerCase().includes(this.buscar.toLowerCase())
                )
            ).toArray();
        },
        async eliminarInscripcion(inscripcion, e) {
            e.stopPropagation();
            alertify.confirm('Gestión Académica', `¿Confirmar eliminación definitiva?`, async e => {
                let formData = new FormData();
                formData.append('inscripciones', JSON.stringify({idInscripcion: inscripcion.idInscripcion}));
                formData.append('accion', 'eliminar');

                try {
                    let respuesta = await fetch("private/modulos/inscripciones/inscripcion.php", {
                        method: "POST",
                        body: formData
                    });
                    let res = await respuesta.json();
                    if (res === true) {
                        await db.inscripciones.delete(inscripcion.idInscripcion);
                        this.obtenerInscripciones();
                        alertify.success('Eliminado');
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
                        <span class="fw-bold fs-5"><i class="bi bi-file-earmark-check"></i> INSCRIPCIONES</span>
                        <div class="w-50">
                            <input autocomplete="off" type="search" @keyup="obtenerInscripciones()" v-model="buscar" 
                                placeholder="Filtrar registros..." class="form-control form-control-sm shadow-none border-0" style="border-radius: 20px; background-color: #ffffff;">
                        </div>
                    </div>
                    <div class="card-body p-0" style="overflow-y: auto;">
                        <table class="table table-sm table-hover mb-0 align-middle">
                            <thead style="background-color: #b2ebf2; color: #006064; font-size: 0.8rem; text-transform: uppercase;">
                                <tr>
                                    <th class="ps-4 py-3">EXPEDIENTE / ALUMNO</th>
                                    <th>ASIGNATURA</th>
                                    <th>FECHA DE REGISTRO</th>
                                    <th>CICLO / PERIODO</th>
                                    <th class="text-end pe-4">GESTIÓN</th>
                                </tr>
                            </thead>
                            <tbody style="font-size: 0.88rem; background-color: #fff;">
                                <tr v-for="inscripcion in inscripciones" :key="inscripcion.idInscripcion" @click="modificarInscripcion(inscripcion)" style="cursor: pointer; border-bottom: 1px solid #e0f7fa;">
                                    <td class="ps-4 py-3">
                                        <div class="fw-bold text-dark">{{ inscripcion.nombre_alumno || 'Cargando...' }}</div>
                                        <span class="badge" style="background-color: #00acc1; color: #fff;">{{ inscripcion.codigo_alumno }}</span>
                                    </td>
                                    <td class="fw-bold text-dark">{{ inscripcion.materia }}</td>
                                    <td class="text-muted small">{{ inscripcion.fecha_inscripcion }}</td>
                                    <td><span class="badge border border-info text-info fw-normal">{{ inscripcion.ciclo_periodo }}</span></td>
                                    <td class="text-end pe-4">
                                        <button class="btn btn-sm btn-link text-danger p-0 fw-bold text-decoration-none" @click="eliminarInscripcion(inscripcion, $event)">Borrar</button>
                                    </td>
                                </tr>
                                <tr v-if="inscripciones.length === 0">
                                    <td colspan="5" class="text-center text-muted p-5">Inicie una búsqueda o agregue nuevos datos.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `
};