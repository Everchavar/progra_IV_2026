const matriculas = {
    props:['forms'],
    data(){
        return{
            matricula:{
                idMatricula:0,
                codigo_alumno:"",
                fecha_matricula:"",
                pago:0,
                ciclo:"",
                comprobante:""
            },
            alumnos:[],
            accion:'nuevo',
            idMatricula:0
        }
    },
    mounted(){
        this.cargarAlumnos();
    },
    methods:{
        async cargarAlumnos(){
            this.alumnos = await db.alumnos.toArray();
        },
        buscarMatricula(){
            this.forms.busqueda_matriculas.mostrar = !this.forms.busqueda_matriculas.mostrar;
            this.$emit('buscar');
        },
        modificarMatricula(matricula){
            this.accion = 'modificar';
            this.idMatricula = matricula.idMatricula;
            this.matricula.codigo_alumno = matricula.codigo_alumno;
            this.matricula.fecha_matricula = matricula.fecha_matricula;
            this.matricula.pago = matricula.pago;
            this.matricula.ciclo = matricula.ciclo;
            this.matricula.comprobante = matricula.comprobante;
        },
        async guardarMatricula() {
            if(!this.matricula.codigo_alumno){
                alertify.error('Seleccione un alumno');
                return;
            }

            let datos = {
                idMatricula: this.accion=='modificar' ? this.idMatricula : this.getId(),
                codigo_alumno: this.matricula.codigo_alumno,
                fecha_matricula: this.matricula.fecha_matricula,
                pago: this.matricula.pago,
                ciclo: this.matricula.ciclo,
                comprobante: this.matricula.comprobante
            };
            
            let formData = new FormData();
            formData.append('matriculas', JSON.stringify(datos));
            formData.append('accion', this.accion);

            try {
                let respuesta = await fetch("private/modulos/matriculas/matricula.php", {
                    method: "POST",
                    body: formData
                });
                let res = await respuesta.json();
                
                if (res === true || (typeof res === 'object' && res.msg === 'ok')) {
                    db.matriculas.put(datos);
                    this.limpiarFormulario();
                    alertify.success('Matrícula tramitada correctamente');
                    this.$emit('guardar');
                }
            } catch (e) { console.error(e); }
        },
        getId(){
            return uuid.v4();
        },
        limpiarFormulario(){
            this.accion = 'nuevo';
            this.idMatricula = 0;
            this.matricula.codigo_alumno = '';
            this.matricula.fecha_matricula = '';
            this.matricula.pago = 0;
            this.matricula.ciclo = '';
            this.matricula.comprobante = '';
        },
    },
    template: `
        <div class="row">
            <div class="col-8">
                <form id="frmMatriculas" v-draggable @submit.prevent="guardarMatricula" @reset.prevent="limpiarFormulario">
                    <div class="card mb-3 shadow-lg border-0" style="width: 48rem; background-color: #e0f7fa; border-radius: 20px; overflow: hidden;">
                        <div class="card-header border-0 p-4" style="background-color: #00acc1; color: #ffffff;">
                            <h4 class="mb-0 fw-bold"><i class="bi bi-wallet-fill"></i> MATRÍCULA</h4>
                            <p class="mb-0 small opacity-75">Control de pavos y ciclos oficiales</p>
                        </div>
                        <div class="card-body p-4">
                            <div class="row mb-3 align-items-center">
                                <div class="col-3 fw-bold text-secondary small">ESTUDIANTE:</div>
                                <div class="col-7">
                                    <select v-model="matricula.codigo_alumno" class="form-select border-0 shadow-sm" required @focus="cargarAlumnos" style="background-color: #fff; border-radius: 12px;">
                                        <option value="">-- Buscar Estudiante --</option>
                                        <option v-for="a in alumnos" :key="a.idAlumno" :value="a.codigo">
                                            {{ a.codigo }} - {{ a.nombre }}
                                        </option>
                                    </select>
                                </div>
                                <div class="col-1">
                                    <button type="button" class="btn btn-sm btn-light border shadow-sm" @click="cargarAlumnos" style="border-radius: 10px;">🔄</button>
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-4">
                                    <label class="form-label fw-bold text-secondary small">FECHA PAGO:</label>
                                    <input required v-model="matricula.fecha_matricula" type="date" class="form-control border-0 shadow-sm" style="background-color: #fff; border-radius: 12px;">
                                </div>
                                <div class="col-4">
                                    <label class="form-label fw-bold text-secondary small">MONTO USD:</label>
                                    <input placeholder="0.00" required v-model="matricula.pago" type="number" step="0.01" class="form-control border-0 shadow-sm" style="background-color: #fff; border-radius: 12px;">
                                </div>
                                <div class="col-4">
                                    <label class="form-label fw-bold text-secondary small">CICLO LECTIVO:</label>
                                    <select v-model="matricula.ciclo" class="form-select border-0 shadow-sm" required style="background-color: #fff; border-radius: 12px;">
                                        <option value="" disabled>Seleccione ciclo</option>
                                        <option value="Ciclo 1-2026">Ciclo 1-2026</option>
                                        <option value="Ciclo 2-2026">Ciclo 2-2026</option>
                                    </select>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-12">
                                    <label class="form-label fw-bold text-secondary small">REFERENCIA / COMPROBANTE:</label>
                                    <input placeholder="Número de factura o transacción" v-model="matricula.comprobante" type="text" class="form-control border-0 shadow-sm" style="background-color: #fff; border-radius: 12px;">
                                </div>
                            </div>
                        </div>
                        <div class="card-footer border-0 p-4 text-center" style="background-color: #b2ebf2;">
                            <button type="submit" class="btn btn-info px-4 fw-bold text-white me-2 shadow-sm" style="background-color: #0097a7; border: none; border-radius: 12px;">REGISTRAR PAGO</button>
                            <button type="reset" class="btn btn-outline-info px-4 fw-bold me-2" style="border-radius: 12px;">NUEVA</button>
                            <button type="button" @click="buscarMatricula" class="btn btn-light px-4 fw-bold border shadow-sm" style="border-radius: 12px; color: #00838f;">BUSCAR</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    `
};