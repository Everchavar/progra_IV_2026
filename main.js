const { createApp } = Vue,
    sha256 = CryptoJS.SHA256;

createApp({
    components: {
        alumnos,
        busqueda_alumnos,
        materias,
        busqueda_materias,
        docentes,
        busqueda_docentes
    },
    data() {
        return {
            sqlite: null,
            db: null,
            forms: {
                alumnos: { mostrar: false },
                busqueda_alumnos: { mostrar: false },
                materias: { mostrar: false },
                busqueda_materias: { mostrar: false },
                docentes: { mostrar: false },
                busqueda_docentes: { mostrar: false },
                matriculas: { mostrar: false },
                inscripciones: { mostrar: false }
            }
        }
    },
    methods: {
        buscar(ventana, metodo) {
            this.$refs[ventana][metodo]();
        },
        abrirVentana(ventana) {
            this.forms[ventana].mostrar = !this.forms[ventana].mostrar;
        },
        modificar(ventana, metodo, data) {
            this.$refs[ventana][metodo](data);
        },
        async inicializarTablas() {
            // SQL para crear tus tablas (equivalente a lo que tenías en Dexie)
            const sql = `
                CREATE TABLE IF NOT EXISTS alumnos (
                    idAlumno INTEGER PRIMARY KEY AUTOINCREMENT,
                    codigo TEXT,
                    nombre TEXT,
                    direccion TEXT,
                    email TEXT,
                    telefono TEXT
                );
                CREATE TABLE IF NOT EXISTS materias (
                    idMateria INTEGER PRIMARY KEY AUTOINCREMENT,
                    codigo TEXT,
                    nombre TEXT,
                    uv INTEGER
                );
                CREATE TABLE IF NOT EXISTS docentes (
                    idDocente INTEGER PRIMARY KEY AUTOINCREMENT,
                    codigo TEXT,
                    nombre TEXT,
                    direccion TEXT,
                    email TEXT,
                    telefono TEXT,
                    escalafon TEXT
                );
            `;
            await this.sqlite.exec(this.db, sql);
            console.log("Tablas de SQLite creadas correctamente.");
        }
    },
    async mounted() {
        try {
            // 1. Inicializar el motor SQLite que definimos en el index.html
            const conexion = await window.initSQLite();
            
            // 2. Guardar la conexión en la instancia de Vue para que los componentes la usen
            this.sqlite = conexion.sqlite;
            this.db = conexion.db;
            
            // 3. Crear las tablas
            await this.inicializarTablas();

            // Opcional: Hacer la base de datos global para debug en consola
            window.db_academica = { sqlite: this.sqlite, db: this.db };
            
        } catch (error) {
            console.error("Error al cargar SQLite:", error);
            alertify.error("No se pudo inicializar la base de datos SQLite.");
        }
    }
}).mount("#app");