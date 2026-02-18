const { createApp } = Vue,
    Dexie = window.Dexie,
    db = new Dexie("db_academica");


createApp({
    components:{
        alumnos,
        busqueda_alumnos,
        materias,
        busqueda_materias,
        docentes,
        busqueda_docentes
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
        buscar(ventana, metodo){
            this.$refs[ventana][metodo]();
        },
        abrirVentana(ventana){
            this.forms[ventana].mostrar = !this.forms[ventana].mostrar;
        },
        modificar(ventana, metodo, data){
            this.$refs[ventana][metodo](data);
        }
    },
    mounted(){
        db.version(1).stores({
            "alumnos": "idAlumno, codigo, nombre, direccion, email, telefono",
            "materias": "idMateria, codigo, nombre, uv",
            "docentes": "idDocente, codigo, nombre, direccion, email, telefono, escalafon"
        });
    }
}).mount("#app");