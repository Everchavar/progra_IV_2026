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
        matricula,
        busqueda_matricula,
        inscripciones,          // <-- Faltaba registrar este
        busqueda_inscripciones  // <-- Faltaba registrar este
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
                matricula:{mostrar:false},
                busqueda_matricula:{mostrar:false},
                inscripciones:{mostrar:false},
                busqueda_inscripciones:{mostrar:false} // <-- Faltaba este estado
            }
        }
    },
    methods:{
        buscar(ventana, metodo){
            this.$refs[ventana][metodo]();
        },
        abrirVentana(ventana){
            // Verificación de seguridad para evitar errores si la ventana no existe
            if(this.forms[ventana]){
                this.forms[ventana].mostrar = !this.forms[ventana].mostrar;
            }
        },
        modificar(ventana, metodo, data){
            this.forms[ventana].mostrar = true; 
            this.$refs[ventana][metodo](data);
        }
    },
    mounted(){
        db.version(1).stores({
            alumnos: "idAlumno, codigo, nombre, direccion, email, telefono",
            materias: "idMateria, codigo, nombre, uv",
            docentes: "idDocente, codigo, nombre, direccion, email, telefono, escalafon",
            matricula: "idMatricula, codigo, nombreAlumno, carrera, ciclo, fecha, estado",
            inscripciones: "idInscripcion, idMatricula, alumno, materia, fecha, ciclo" // <-- Faltaba la tabla en DB
        });
    }
}).mount("#app");