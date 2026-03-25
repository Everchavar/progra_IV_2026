const { createApp } = Vue,
    Dexie = window.Dexie,
    db = new Dexie("db_academica"),
    sha256 = CryptoJS.SHA256;

// Configurar la base de datos Dexie inmediatamente
db.version(3).stores({
    "alumnos": "idAlumno, codigo, nombre, direccion, email, telefono",
    "materias": "idMateria, codigo, nombre, uv",
    "docentes": "idDocente, codigo, nombre, direccion, email, telefono, escalafon",
    "inscripciones": "idInscripcion, codigo_alumno, materia, fecha_inscripcion, ciclo_periodo, observaciones",
    "matriculas": "idMatricula, codigo_alumno, fecha_matricula, pago, ciclo, comprobante"
});

const app = createApp({
    components:{
        alumnos,
        buscar_alumnos: busqueda_alumnos,
        materias,
        buscar_materias: busqueda_materias,
        docentes,
        buscar_docentes: busqueda_docentes,
        inscripciones,
        buscar_inscripciones: busqueda_inscripciones,
        matriculas,
        buscar_matriculas: busqueda_matriculas
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
                busqueda_matriculas:{mostrar:false},
                inscripciones:{mostrar:false},
                busqueda_inscripciones:{mostrar:false}
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
    }
});

// Registrar directiva
app.directive('draggable', vDraggable);

app.mount("#app");