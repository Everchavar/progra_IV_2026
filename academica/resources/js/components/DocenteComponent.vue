<template>
    <div v-draggable>
        <form id="frmDocentes" @submit.prevent="guardarDocente" @reset.prevent="limpiarFormulario">
            <div class="card text-bg-dark mb-3" style="width: 36rem;">
                <div class="card-header"><div class="d-flex justify-content-between">
                        <div class="p-1">REGISTRO DE DOCENTES</div>
                        <div>
                            <button
                                type="button"
                                class="btn-close btn-close-white"
                                aria-label="Close"
                                @click="cerrarFormularioDocente"
                            ></button>
                        </div>
                    </div></div>
                <div class="card-body">
                    <div class="row p-1"><div class="col-3">CODIGO:</div><div class="col-3"><input placeholder="codigo" required v-model="docente.codigo" type="text" class="form-control"></div></div>
                    <div class="row p-1"><div class="col-3">NOMBRE:</div><div class="col-6"><input placeholder="nombre" required v-model="docente.nombre" type="text" class="form-control"></div></div>
                    <div class="row p-1"><div class="col-3">DIRECCION:</div><div class="col-9"><input placeholder="direccion" required v-model="docente.direccion" type="text" class="form-control"></div></div>
                    <div class="row p-1"><div class="col-3">EMAIL:</div><div class="col-6"><input placeholder="email" required v-model="docente.email" type="text" class="form-control"></div></div>
                    <div class="row p-1"><div class="col-3">TELEFONO:</div><div class="col-4"><input placeholder="telefono" required v-model="docente.telefono" type="text" class="form-control"></div></div>
                    <div class="row p-1"><div class="col-3">ESCALAFON:</div><div class="col-4"><select required title="Seleccione un escalafon" v-model="docente.escalafon" class="form-select"><option value="tecnico">Tecnico</option><option value="profesor">Profesor</option><option value="ingeniero">Licenciado/Ingeniero</option><option value="maestria">Maestria</option><option value="doctor">Doctor</option></select></div></div>
                </div>
                <div class="card-footer"><div class="row"><div class="col text-center"><button type="submit" id="btnGuardarDocente" class="btn btn-primary">GUARDAR</button><button type="reset" id="btnCancelarDocente" class="btn btn-warning">NUEVO</button><button type="button" @click="buscarDocente" id="btnBuscarDocente" class="btn btn-success">BUSCAR</button></div></div></div>
            </div>
        </form>
    </div>
</template>
<script>
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import alertify from "alertifyjs";

export default{
    props: ["forms"],
    data(){
        return{
            accion:'nuevo',
            docente:{
                idDocente: uuidv4(),
                codigo: "",
                nombre: "",
                direccion: "",
                email: "",
                telefono: "",
                escalafon: "",
            }
        };
    },
    methods:{
        cerrarFormularioDocente(){
            this.forms.docentes.mostrar = false;
        },
        limpiarFormulario(){
            this.docente = {
                idDocente: uuidv4(),
                codigo: "",
                nombre: "",
                direccion: "",
                email: "",
                telefono: "",
                escalafon: "",
            };
            this.accion = 'nuevo';
        },
        buscarDocente() {
            this.forms.buscar_docentes.mostrar = !this.forms.buscar_docentes.mostrar;
            this.$emit("buscar");
        },
        async guardarDocente(){
            let docente = { ...this.docente },
                metodo = "POST";
            
            db.docentes.put(docente);
            if (this.accion == "modificar") {
                metodo = "PUT";
            }
            axios({
                method: metodo,
                url: 'docente',
                data: docente,
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
            })
                .then(async (response) => {
                    if (response.data.msg !== "ok") {
                        alertify.error(
                            `Error al sincronizar con el servidor: ${response.data}`,
                        );
                    } else {
                        alertify.success("Docente guardado correctamente");
                        this.limpiarFormulario();
                        this.$emit("buscar");
                    }
                })
                .catch((error) => {
                    alertify.error(`Error al guardar docente: ${error}`);
                    console.log(error);
                });
        },
    }
}
</script>