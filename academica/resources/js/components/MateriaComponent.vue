<template>
    <div v-draggable>
        <form id="frmMaterias" @submit.prevent="guardarMateria" @reset.prevent="limpiarFormulario">
            <div class="card text-bg-dark">
                <div class="card-header"><div class="d-flex justify-content-between"><div class="p-1">REGISTRO DE MATERIAS</div><div><button type="button" class="btn-close btn-close-white" aria-label="Close" @click="cerrarFormularioMateria"></button></div></div></div>
                <div class="card-body">
                    <div class="row p-1"><div class="col-3">CODIGO:</div><div class="col-3"><input placeholder="codigo" required v-model="materia.codigo" type="text" class="form-control"></div></div>
                    <div class="row p-1"><div class="col-3">NOMBRE:</div><div class="col-6"><input placeholder="nombre" required v-model="materia.nombre" type="text" class="form-control"></div></div>
                    <div class="row p-1"><div class="col-3">UV:</div><div class="col-9"><input placeholder="uv" required v-model="materia.uv" type="text" class="form-control"></div></div>
                </div>
                <div class="card-footer"><div class="row"><div class="col text-center"><button type="submit" id="btnGuardarMateria" class="btn btn-primary">GUARDAR</button><button type="reset" id="btnCancelarMateria" class="btn btn-warning">NUEVO</button><button type="button" @click="buscarMateria" id="btnBuscarMateria" class="btn btn-success">BUSCAR</button></div></div></div>
            </div>
        </form>
    </div>
</template>
<script>
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import alertify from "alertifyjs";

export default {
    props: ["forms"],
    data() {
        return {
            materia: {
                idMateria: uuidv4(),
                codigo: "",
                nombre: "",
                uv: "",
            },
            accion: "nuevo",
        };
    },
    methods: {
        cerrarFormularioMateria() {
            this.forms.materias.mostrar = false;
        },
        buscarMateria() {
            this.forms.buscar_materias.mostrar =
                !this.forms.buscar_materias.mostrar;
            this.$emit("buscar");
        },
        modificarMateria(materia) {
            this.accion = "modificar";
            this.materia = { ...materia };
        },
        async guardarMateria() {
            let materia = { ...this.materia },
                metodo = "POST";
            db.materias.put(materia);
            if (this.accion == "modificar") {
                metodo = "PUT";
            }
            axios({
                method: metodo,
                url: "materia",
                data: materia,
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
                        alertify.success("Materia guardada correctamente");
                        this.limpiarFormulario();
                        this.$emit("buscar");
                    }
                })
                .catch((error) => {
                    alertify.error(`Error al guardar materia: ${error}`);
                    console.log(error);
                });
        },
        limpiarFormulario() {
            this.materia.idMateria = uuidv4();
            this.materia.codigo = "";
            this.materia.nombre = "";
            this.materia.uv = "";
            this.accion = "nuevo";
            document.getElementById("frmMaterias").reset();
        },
    },
};
</script>