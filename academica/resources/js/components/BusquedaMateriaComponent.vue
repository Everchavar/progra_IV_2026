<template>
    <div v-draggable>
            <div class="card text-bg-dark">
                <div class="card-header"><div class="d-flex justify-content-between"><div class="p-1">BUSQUEDA DE MATERIAS</div><div><button type="button" class="btn-close btn-close-white" aria-label="Close" @click="cerrarFormularioBusquedaMateria"></button></div></div></div>
                <div class="card-body">
                    <table class="table table-striped table-hover" id="tblMaterias">
                        <thead>
                            <tr><th colspan="6"><input autocomplete="off" type="search" @keyup="obtenerMaterias()" v-model="buscar" placeholder="Buscar materia" class="form-control"></th></tr>
                            <tr><th>CODIGO</th><th>NOMBRE</th><th>UV</th><th></th></tr>
                        </thead>
                        <tbody>
                            <tr v-for="materia in materias" :key="materia.idMateria" @click="modificarMateria(materia)">
                                <td>{{ materia.codigo }}</td><td>{{ materia.nombre }}</td><td>{{ materia.uv }}</td>
                                <td><button class="btn btn-danger" @click="eliminarMateria(materia, $event)">DEL</button></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </template>
    <script>
        import axios from 'axios';
        import alertify from 'alertifyjs';

        export default {
            props: ['forms'],
            data() {
                return {
                    materias: [],
                    buscar: '',
                };
            },
            methods: {
                modificarMateria(materia) {
                    this.$emit('modificar', materia);
                },
                eliminarMateria(materia, event) {
                    event.stopPropagation();
                    alertify.confirm('¿Está seguro de eliminar la materia?', async () => {
                        axios({
                            method: 'DELETE',
                            url: 'materia',
                            data: materia,
                            headers: {
                                'Content-Type': 'application/json',
                                Accept: 'application/json',
                            },
                        })
                            .then(response => {
                                if (response.data.msg !== 'ok') {
                                    alertify.error(`Error al sincronizar con el servidor: ${response.data.msg}`);
                                } else {
                                    db.materias.delete(materia.idMateria);
                                    this.obtenerMaterias();
                                }
                            })
                            .catch(error => {
                                alertify.error(`Error al sincronizar con el servidor: ${error}`);
                            });
                    });
                },
                async obtenerMaterias() {
                    this.materias = await db.materias
                        .filter(materia => {
                            return (
                                materia.codigo.toLowerCase().includes(this.buscar.toLowerCase()) ||
                                materia.nombre.toLowerCase().includes(this.buscar.toLowerCase())
                            );
                        })
                        .toArray();
                    if (this.materias.length < 1 && this.buscar.length <= 0) {
                        axios({
                            method: 'GET',
                            url: 'materia',
                            headers: {
                                'Content-Type': 'application/json',
                                Accept: 'application/json',
                            },
                        })
                            .then(response => {
                                console.log(response.data);
                                this.materias = response.data;
                                db.materias.bulkAdd(response.data);
                            })
                            .catch(error => {
                                alertify.error(`Error al sincronizar con el servidor: ${error}`);
                            });
                    }
                },
                cerrarFormularioBusquedaMateria() {
                    this.forms.buscar_materias.mostrar = false;
                },
            },
            created() {
                this.obtenerMaterias();
            },
        };
    </script>
    