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
        busqueda_docentes,
        matricula, // Componente de formulario
        busqueda_matricula // Componente de tabla
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
                matricula:{mostrar:false}, // Cambiado de 'matriculas' a 'matricula' para coincidir con ref
                busqueda_matricula:{mostrar:false},
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
            this.forms[ventana].mostrar = true; // Asegura que el formulario se vea al editar
            this.$refs[ventana][metodo](data);
        }
    },
    mounted(){
        // Actualizamos la estructura de la tabla matricula con los nuevos campos
        db.version(1).stores({
            alumnos: "idAlumno, codigo, nombre, direccion, email, telefono",
            materias: "idMateria, codigo, nombre, uv",
            docentes: "idDocente, codigo, nombre, direccion, email, telefono, escalafon",
            matricula: "idMatricula, codigo, nombreAlumno, carrera, ciclo, fecha, estado" 
        });
    }
}).mount("#app");