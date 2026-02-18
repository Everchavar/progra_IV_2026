const { createApp } = Vue,
    Dexie = window.Dexie,
    db = new Dexie("db_academica");

createApp({
    components:{
        alumnos, busqueda_alumnos,
        matricula, busqueda_matricula,
        inscripciones, busqueda_inscripciones,
        docentes, busqueda_docentes 
    },
    data(){
        return{
            forms:{
                alumnos:{mostrar:false},
                busqueda_alumnos:{mostrar:false},
                matricula:{mostrar:false},
                busqueda_matricula:{mostrar:false},
                inscripciones:{mostrar:false},
                busqueda_inscripciones:{mostrar:false},
                docentes:{mostrar:false}, // <-- 2. FALTABA ESTE ESTADO
                busqueda_docentes:{mostrar:false} // <-- 3. FALTABA ESTE TAMBIÉN
            }
        }
    },
    methods:{
        buscar(ventana, metodo){
            this.$refs[ventana][metodo]();
        },
        abrirVentana(ventana){
            // Verificamos que la ventana exista en forms para evitar errores en consola
            if(this.forms[ventana]){
                this.forms[ventana].mostrar = !this.forms[ventana].mostrar;
            } else {
                console.error(`La ventana "${ventana}" no está definida en data.forms`);
            }
        },
        modificar(ventana, metodo, data){
            this.forms[ventana].mostrar = true;
            this.$refs[ventana][metodo](data);
        }
    },
    mounted(){
        db.version(1).stores({
            alumnos: "idAlumno, codigo, nombre",
            matricula: "idMatricula, codigo, nombreAlumno, carrera, ciclo",
            inscripciones: "idInscripcion, idMatricula, alumno, materia, fecha",
            docentes: "idDocente, codigo, nombre, direccion, email, telefono, escalafon"
        });
    }
}).mount("#app");