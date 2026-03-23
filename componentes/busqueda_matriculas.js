const busqueda_matriculas = {
    data(){
        return{
            buscar:'',
            matriculas:[]
        }
    },
    mounted(){
        this.obtenerMatriculas();
    },
    methods:{
        modificarMatricula(matricula){
            this.$emit('modificar', matricula);
        },
        async obtenerMatriculas(){
            let totalLocal = await db.matriculas.count();
            if (totalLocal <= 0) {
                let formData = new FormData();
                formData.append('accion', 'consultar');
                try {
                    let respuesta = await fetch("private/modulos/matriculas/matricula.php", {
                        method: "POST",
                        body: formData
                    });
                    let data = await respuesta.json();
                    if (Array.isArray(data) && data.length > 0) {
                        await db.matriculas.bulkPut(data);
                    }
                } catch (error) { console.error(error); }
            }

            this.matriculas = await db.matriculas.filter(
                m => m.codigo_alumno.toLowerCase().includes(this.buscar.toLowerCase()) 
                    || m.ciclo.toLowerCase().includes(this.buscar.toLowerCase())
            ).toArray();
        },
        async eliminarMatricula(matricula, e){
            e.stopPropagation();
            alertify.confirm('Control Financiero', `¿Desea anular la transacción para ${matricula.codigo_alumno}?`, async e=>{
                let formData = new FormData();
                formData.append('matriculas', JSON.stringify({idMatricula: matricula.idMatricula}));
                formData.append('accion', 'eliminar');

                try {
                    let respuesta = await fetch("private/modulos/matriculas/matricula.php", {
                        method: "POST",
                        body: formData
                    });
                    let res = await respuesta.json();
                    if (res === true) {
                        await db.matriculas.delete(matricula.idMatricula);
                        this.obtenerMatriculas();
                        alertify.success('Trámite anulado');
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
                        <span class="fw-bold fs-5"><i class="bi bi-wallet-fill"></i> MATRÍCULAS</span>
                        <div class="w-50">
                            <input autocomplete="off" type="search" @keyup="obtenerMatriculas()" v-model="buscar" 
                                placeholder=" Filtrar registros de pago..." class="form-control form-control-sm shadow-none border-0" style="border-radius: 20px; background-color: #ffffff;">
                        </div>
                    </div>
                    <div class="card-body p-0" style="overflow-y: auto;">
                        <table class="table table-sm table-hover mb-0 align-middle">
                            <thead style="background-color: #b2ebf2; color: #006064; font-size: 0.8rem; text-transform: uppercase;">
                                <tr>
                                    <th class="ps-4 py-3">ALUMNO</th>
                                    <th>FECHA DE TRAMITE</th>
                                    <th>CANTIDAD</th>
                                    <th>PERIODO LECTIVO</th>
                                    <th>REFERENCIA DOC.</th>
                                    <th class="text-end pe-4">GESTIÓN</th>
                                </tr>
                            </thead>
                            <tbody style="font-size: 0.88rem; background-color: #fff;">
                                <tr v-for="m in matriculas" :key="m.idMatricula" @click="modificarMatricula(m)" style="cursor: pointer; border-bottom: 1px solid #e0f7fa;">
                                    <td class="ps-4 py-3"><span class="badge" style="background-color: #00acc1; color: #fff;">{{ m.codigo_alumno }}</span></td>
                                    <td class="text-dark">{{ m.fecha_matricula }}</td>
                                    <td class="fw-bold text-success">USD {{ m.pago }}</td>
                                    <td><span class="badge border border-info text-info fw-normal">{{ m.ciclo }}</span></td>
                                    <td class="text-muted small italic">{{ m.comprobante }}</td>
                                    <td class="text-end pe-4">
                                        <button class="btn btn-sm btn-link text-danger p-0 fw-bold text-decoration-none" @click="eliminarMatricula(m, $event)">Borrar</button>
                                    </td>
                                </tr>
                                <tr v-if="matriculas.length === 0">
                                    <td colspan="6" class="text-center text-muted p-5">Sin registros de pago encontrados.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `
};