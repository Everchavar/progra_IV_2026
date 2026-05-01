<template>
    <!-- Aumentamos el ancho con un estilo en línea o una clase personalizada -->
    <div v-draggable style="max-width: 800px; margin: 0 auto;">
        <form
            id="frmAlumnos"
            @submit.prevent="guardarAlumno"
            @reset.prevent="limpiarFormulario"
        >
            <!-- Añadimos 'fs-5' para aumentar un poco el tamaño de letra general -->
            <div class="card text-bg-dark fs-5 shadow-lg">
                <div class="card-header py-3"> <!-- Más relleno (padding) vertical -->
                    <div class="d-flex justify-content-between align-items-center">
                        <div class="p-1 fw-bold">REGISTRO DE ALUMNOS</div>
                        <div>
                            <button
                                type="button"
                                class="btn-close btn-close-white"
                                style="width: 2em; height: 2em;" 
                                aria-label="Close"
                                @click="cerrarFormularioAlumno"
                            ></button>
                        </div>
                    </div>
                </div>
                
                <div class="card-body p-4"> <!-- Más espacio interno -->
                    
                    <!-- Fila 1: Código -->
                    <div class="row mb-3">
                        <label class="col-sm-3 col-form-label">CÓDIGO:</label>
                        <div class="col-sm-9">
                            <input
                                placeholder="Ingrese el código"
                                required
                                v-model="alumno.codigo"
                                type="text"
                                class="form-control form-control-lg" 
                            />
                        </div>
                    </div>

                    <!-- Fila 2: Nombre -->
                    <div class="row mb-3">
                        <label class="col-sm-3 col-form-label">NOMBRE:</label>
                        <div class="col-sm-9">
                            <input
                                placeholder="Ingrese nombre completo"
                                required
                                v-model="alumno.nombre"
                                type="text"
                                class="form-control form-control-lg"
                            />
                        </div>
                    </div>

                    <!-- Fila 3: Dirección -->
                    <div class="row mb-3">
                        <label class="col-sm-3 col-form-label">DIRECCIÓN:</label>
                        <div class="col-sm-9">
                            <input
                                placeholder="Ingrese dirección de residencia"
                                required
                                v-model="alumno.direccion"
                                type="text"
                                class="form-control form-control-lg"
                            />
                        </div>
                    </div>

                    <!-- Fila 4: Email -->
                    <div class="row mb-3">
                        <label class="col-sm-3 col-form-label">EMAIL:</label>
                        <div class="col-sm-9">
                            <input
                                placeholder="ejemplo@correo.com"
                                required
                                v-model="alumno.email"
                                type="email"
                                class="form-control form-control-lg"
                            />
                        </div>
                    </div>

                    <!-- Fila 5: Teléfono -->
                    <div class="row mb-3">
                        <label class="col-sm-3 col-form-label">TELÉFONO:</label>
                        <div class="col-sm-9">
                            <input
                                placeholder="0000-0000"
                                required
                                v-model="alumno.telefono"
                                type="text"
                                class="form-control form-control-lg"
                            />
                        </div>
                    </div>
                </div>

                <div class="card-footer py-4">
                    <div class="d-flex justify-content-center gap-3"> <!-- Gap crea espacio entre botones -->
                        <button
                            type="submit"
                            id="btnGuardarAlumno"
                            class="btn btn-primary btn-lg px-5"
                        >
                            GUARDAR
                        </button>
                        <button
                            type="reset"
                            id="btnCancelarAlumno"
                            class="btn btn-warning btn-lg px-5"
                        >
                            NUEVO
                        </button>
                        <button
                            type="button"
                            @click="buscarAlumno"
                            id="btnBuscarAlumno"
                            class="btn btn-success btn-lg px-5"
                        >
                            BUSCAR
                        </button>
                    </div>
                </div>
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
            alumno: {
                idAlumno: uuidv4(),
                codigo: "",
                nombre: "",
                direccion: "",
                email: "",
                telefono: "",
            },
            accion: "nuevo",
        };
    },
    methods: {
        cerrarFormularioAlumno() {
            this.forms.alumnos.mostrar = false;
        },
        buscarAlumno() {
            this.forms.buscar_alumnos.mostrar =
                !this.forms.buscar_alumnos.mostrar;
            this.$emit("buscar");
        },
        modificarAlumno(alumno) {
            this.accion = "modificar";
            this.alumno = { ...alumno };
        },
        async guardarAlumno() {
            let alumno = { ...this.alumno },
                metodo = "POST";
            db.alumnos.put(alumno);
            if (this.accion == "modificar") {
                metodo = "PUT";
            }
            axios({
                method: metodo,
                url: "alumno",
                data: alumno,
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
            })
                .then((response) => {
                    if (response.data.msg !== "ok") {
                        alertify.error(
                            `Error al sincronizar con el servidor: ${response.data}`,
                        );
                    } else {
                        this.limpiarFormulario();
                        this.$emit("buscar");
                    }
                })
                .catch((error) => {
                    alertify.error(
                        `Error al sincronizar con el servidor: ${error}`,
                    );
                });
        },
        limpiarFormulario() {
            this.alumno = {
                idAlumno: uuidv4(),
                codigo: "",
                nombre: "",
                direccion: "",
                email: "",
                telefono: "",
            };
            this.accion = "nuevo";
        },
    },
};
</script>