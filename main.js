const { createApp } = Vue,
    Dexie = window.Dexie,
    db = new Dexie("db_academica");


createApp({
    components:{
        alumnos,
        busqueda_alumnos
    },
    data(){
        return{
            forms:{
                alumnos:{mostrar:false},
                busqueda_alumnos:{mostrar:false},
                materias:{mostrar:false},
                busqueda_materias:{mostrar:false},
                docentes:{mostrar:false},
                busqueda_docentes:{mostrar:false},
                matriculas:{mostrar:false},
                inscripciones:{mostrar:false}
            }
        }
    },
    methods:{
        abrirVentana(ventana){
            this.forms[ventana].mostrar = !this.forms[ventana].mostrar;
            console.log(this.forms[ventana].mostrar, ventana);
        }
    },
    mounted(){
        db.version(1).stores({
            "alumnos": "idAlumno, codigo, nombre, direccion, email, telefono"
        });
    }
}).mount("#app");