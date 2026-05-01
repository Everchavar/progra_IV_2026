
/**
 * First we will load all of this project's JavaScript dependencies which
 * includes Vue and other libraries. It is a great starting point when
 * building robust, powerful web applications using Vue and Laravel.
 */

import './bootstrap';
import { createApp } from 'vue';
import Dexie from 'dexie';
import alumnos from './components/AlumnoComponent.vue';
import buscar_alumnos from './components/BusquedaAlumnoComponent.vue';
import materias from './components/MateriaComponent.vue';
import buscar_materias from './components/BusquedaMateriaComponent.vue';
import docentes from './components/DocenteComponent.vue';
import buscar_docentes from './components/BusquedaDocenteComponent.vue';
import { vDraggable } from './draggable';

window.db = new Dexie('db_academica');

createApp({
    components: {
        alumnos,
        buscar_alumnos,
        materias,
        buscar_materias,
        docentes,
        buscar_docentes
    },
    data(){
        return{
            forms:{
                alumnos:{mostrar:false},
                buscar_alumnos:{mostrar:false},

                materias:{mostrar:false},
                buscar_materias:{mostrar:false},

                docentes:{mostrar:false},
                buscar_docentes:{mostrar:false},

                matriculas:{mostrar:false},
                inscripciones:{mostrar:false}
            }
        };
    },
    methods:{
        buscar(ventana, metodo){
            this.$refs[ventana][metodo]();
        },
        abrirVentana(ventana){
            console.log(ventana);
            this.forms[ventana].mostrar = !this.forms[ventana].mostrar;
        },
        modificar(ventana, metodo, data){
            this.$refs[ventana][metodo](data);
        }
    },
    created(){
        db.version(1).stores({
            alumnos:'idAlumno, codigo, nombre, direccion, email, telefono',
            materias:'idMateria, codigo, nombre, uv',
            docentes:'idDocente, codigo, nombre, direccion, email, telefono, escalafon',
        });
    }
}).directive('draggable', vDraggable).mount('#appSistema');
