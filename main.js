// =============================================
// BASE DE DATOS (Dexie / IndexedDB)
// =============================================
const db = new Dexie('universidad');
db.version(1).stores({
    alumnos:      'idAlumno, codigo, nombre',
    materias:     'idMateria, codigo, nombre',
    docentes:     'idDocente, codigo, nombre',
    matricula:    'idMatricula, codigo, nombreAlumno',
    inscripciones:'idInscripcion, idMatricula, idMateria'
});
db.version(2).stores({
    alumnos:      'idAlumno, codigo, nombre',
    materias:     'idMateria, codigo, nombre',
    docentes:     'idDocente, codigo, nombre',
    matricula:    'idMatricula, codigo, nombreAlumno',
    inscripciones:'idInscripcion, idMatricula, idMateria',
    usuarios:     '++id, username, rol'
});
db.version(3).stores({
    alumnos:      'idAlumno, codigo, nombre',
    materias:     'idMateria, codigo, nombre',
    docentes:     'idDocente, codigo, nombre',
    matricula:    'idMatricula, codigo, nombreAlumno',
    inscripciones:'idInscripcion, idMatricula, idMateria',
    usuarios:     '++id, username, codigo, email, rol'
});
db.version(4).stores({
    alumnos:      'idAlumno, codigo, nombre, carrera, estado',
    materias:     'idMateria, codigo, nombre, docenteId, estado',
    docentes:     'idDocente, codigo, nombre, especialidad, estado',
    matricula:    'idMatricula, codigo, nombreAlumno, idAlumno, periodoId, estado',
    inscripciones:'idInscripcion, idMatricula, idMateria, idAlumno',
    periodos:     '++idPeriodo, año, ciclo, estado',
    usuarios:     '++id, username, codigo, email, rol, estado'
});
db.version(5).stores({
    alumnos:      'idAlumno, codigo, nombre, carrera, carreraId, estado',
    materias:     'idMateria, codigo, nombre, docenteId, carreraId, carrera, estado',
    docentes:     'idDocente, codigo, nombre, especialidad, estado',
    matricula:    'idMatricula, codigo, nombreAlumno, idAlumno, periodoId, estado',
    inscripciones:'idInscripcion, idMatricula, idMateria, idAlumno',
    periodos:     '++idPeriodo, año, ciclo, estado',
    carreras:     '++idCarrera, codigo, nombre, estado',
    evaluaciones: '++id, idInscripcion, idMateria, computo, estado',
    usuarios:     '++id, username, codigo, email, rol, estado'
});
db.version(6).stores({
    alumnos:      'idAlumno, codigo, nombre, carrera, carreraId, foto, estado',
    materias:     'idMateria, codigo, nombre, docenteId, carreraId, carrera, estado',
    docentes:     'idDocente, codigo, nombre, especialidad, foto, estado',
    matricula:    'idMatricula, codigo, nombreAlumno, idAlumno, periodoId, estado',
    inscripciones:'idInscripcion, idMatricula, idMateria, idAlumno',
    periodos:     '++idPeriodo, año, ciclo, estado',
    carreras:     '++idCarrera, codigo, nombre, estado',
    evaluaciones: '++id, idInscripcion, idMateria, computo, estado',
    usuarios:     '++id, username, codigo, email, rol, estado'
});
db.version(7).stores({
    alumnos:      'idAlumno, codigo, nombre, carrera, carreraId, foto, estado',
    materias:     'idMateria, codigo, nombre, docenteId, carreraId, carrera, estado',
    docentes:     'idDocente, codigo, nombre, especialidad, foto, estado',
    matricula:    'idMatricula, codigo, nombreAlumno, idAlumno, periodoId, estado',
    inscripciones:'idInscripcion, idMatricula, idMateria, idAlumno',
    periodos:     '++idPeriodo, año, ciclo, estado',
    carreras:     '++idCarrera, codigo, nombre, estado',
    evaluaciones: '++id, idInscripcion, idMateria, computo, estado',
    usuarios:     '++id, username, codigo, email, rol, estado',
    solicitudes:  '++id, tipo, nombre, codigo, fecha, estado' 
});
// v8: Corrige idAlumno/idDocente/etc. a auto-increment (++), necesario para add() sin clave manual
db.version(8).stores({
    alumnos:      '++idAlumno, codigo, nombre, carrera, carreraId, foto, estado, tokenAcceso',
    materias:     '++idMateria, codigo, nombre, docenteId, carreraId, carrera, estado',
    docentes:     '++idDocente, codigo, nombre, especialidad, foto, estado, tokenAcceso',
    matricula:    '++idMatricula, codigo, nombreAlumno, idAlumno, periodoId, estado',
    inscripciones:'++idInscripcion, idMatricula, idMateria, idAlumno',
    periodos:     '++idPeriodo, año, ciclo, estado',
    carreras:     '++idCarrera, codigo, nombre, estado',
    evaluaciones: '++id, idInscripcion, idMateria, computo, estado',
    usuarios:     '++id, username, codigo, email, rol, estado',
    solicitudes:  '++id, tipo, nombre, codigo, fecha, estado'
});
// v9: Schema relacional — todos los registros vinculados por FK numérico
db.version(9).stores({
    usuarios:     '++id, username, codigo, email, rol, estado',
    alumnos:      '++idAlumno, codigo, nombre, usuarioId, carreraId, foto, estado, tokenAcceso',
    docentes:     '++idDocente, codigo, nombre, usuarioId, especialidad, foto, estado, tokenAcceso',
    carreras:     '++idCarrera, codigo, nombre, facultad, estado',
    materias:     '++idMateria, codigo, nombre, docenteId, carreraId, estado',
    periodos:     '++idPeriodo, año, ciclo, estado',
    matricula:    '++idMatricula, codigo, alumnoId, periodoId, carreraId, estado',
    inscripciones:'++idInscripcion, matriculaId, materiaId, estado',
    evaluaciones: '++id, inscripcionId, estado',
    solicitudes:  '++id, tipo, nombre, codigo, fecha, estado'
});

// v10: Arquitectura de Carnetización Automática e Inmutable
db.version(10).stores({
    usuarios:     '++id, &username, &email, rol, &carnet, estado',
    alumnos:      '++idAlumno, &carnet, nombre, usuarioId, carreraId, sexo, añoIngreso, estado',
    docentes:     '++idDocente, &carnet, nombre, usuarioId, especialidad, sexo, añoIngreso, estado',
    carreras:     '++idCarrera, &codigo, nombre, facultad, estado',
    materias:     '++idMateria, &codigo, nombre, docenteId, carreraId, estado',
    periodos:     '++idPeriodo, año, ciclo, estado',
    matricula:    '++idMatricula, &codigo, alumnoId, periodoId, carreraId, estado',
    inscripciones:'++idInscripcion, matriculaId, materiaId, estado',
    evaluaciones: '++id, inscripcionId, estado',
    solicitudes:  '++id, tipo, username, &email, sexo, carreraId, fecha, estado'
});

// v11: Arquitectura Totalmente Relacional
db.version(11).stores({
    usuarios:     '++id, &username, &email, rol, estado',
    perfiles:     '++id, &usuarioId, nombre, sexo, foto, telefono, direccion, fechaNacimiento',
    alumnos:      '++idAlumno, &usuarioId, &carnet, carreraId, añoIngreso, estado',
    docentes:     '++idDocente, &usuarioId, &carnet, especialidad, añoIngreso, estado',
    carreras:     '++idCarrera, &codigo, nombre, facultad, estado',
    materias:     '++idMateria, &codigo, nombre, docenteId, carreraId, estado',
    periodos:     '++idPeriodo, año, ciclo, estado',
    matricula:    '++idMatricula, &codigo, alumnoId, periodoId, carreraId, estado',
    inscripciones:'++idInscripcion, matriculaId, materiaId, estado',
    evaluaciones: '++id, inscripcionId, estado',
    solicitudes:  '++id, tipo, username, &email, sexo, carreraId, fecha, estado'
}).upgrade(async tx => {
    // MIGRACIÓN LÓGICA DE DATOS EXISTENTES
    console.log('[Migration] Iniciando migración a arquitectura relacional v11...');
    
    const alumnos = await tx.table('alumnos').toArray();
    const docentes = await tx.table('docentes').toArray();
    
    for (const a of alumnos) {
        if (a.usuarioId) {
            await tx.table('perfiles').put({
                usuarioId: a.usuarioId, nombre: a.nombre || '', sexo: a.sexo || '',
                foto: a.foto || '', telefono: a.telefono || '', direccion: a.direccion || '',
                fechaNacimiento: a.fechaNacimiento || ''
            });
            delete a.nombre; delete a.sexo; delete a.foto; delete a.telefono; delete a.direccion; delete a.fechaNacimiento;
            await tx.table('alumnos').put(a);
        }
    }
    for (const d of docentes) {
        if (d.usuarioId) {
            await tx.table('perfiles').put({
                usuarioId: d.usuarioId, nombre: d.nombre || '', sexo: d.sexo || '',
                foto: d.foto || '', telefono: d.telefono || '', direccion: d.direccion || '',
                fechaNacimiento: d.fechaNacimiento || ''
            });
            delete d.nombre; delete d.sexo; delete d.foto; delete d.telefono; delete d.direccion; delete d.fechaNacimiento;
            await tx.table('docentes').put(d);
        }
    }
});

// v12: Estandarización de IDs y Relaciones Académicas
db.version(12).stores({
    usuarios:     '++id, &username, &email, rol, estado',
    perfiles:     '++id, &usuarioId, nombre, sexo, foto, telefono, direccion, fechaNacimiento',
    alumnos:      '++idAlumno, &usuarioId, &carnet, carreraId, añoIngreso, estado',
    docentes:     '++idDocente, &usuarioId, &carnet, especialidad, añoIngreso, estado',
    carreras:     '++idCarrera, &codigo, nombre, facultad, estado',
    materias:     '++idMateria, &codigo, nombre, docenteId, carreraId, estado',
    periodos:     '++idPeriodo, año, ciclo, estado',
    matricula:    '++idMatricula, &codigo, idAlumno, periodoId, carreraId, estado',
    inscripciones:'++idInscripcion, idAlumno, idMateria, periodoId, notaFinal',
    evaluaciones: '++id, idInscripcion, idMateria, computo, lab1, lab2, examen, notaComputo, estado',
    solicitudes:  '++id, tipo, username, &email, sexo, carreraId, fecha, estado'
}).upgrade(async tx => {
    console.log('[Migration] Ajustando relaciones académicas a IDs numéricos (v12)...');
});

// =============================================
// APERTURA SEGURA DE BD (auto-recover on schema error)
// =============================================
db.open().catch(err => {
    const msg = err.message || '';
    if (
        msg.includes('primary key') ||
        msg.includes('VersionError') ||
        msg.includes('upgrade') ||
        err.name === 'VersionError'
    ) {
        console.warn('[DB] Error de migración — borrando BD antigua y recargando...', err);
        // Notificar al usuario antes de borrar
        if (confirm(
            '⚠️ La base de datos del sistema necesita actualizarse a una nueva versión.\n\n' +
            'Los datos existentes no pueden migrarse automáticamente.\n' +
            '¿Deseas limpiar la base de datos y continuar?\n\n' +
            '(Después podrás restaurar datos de prueba desde el panel Admin)'
        )) {
            indexedDB.deleteDatabase('universidad');
            location.reload();
        }
    } else {
        console.error('[DB] Error inesperado al abrir la BD:', err);
    }
});

// =============================================
// APP VUE
// =============================================
const app = Vue.createApp({
    data(){
        return {
            darkMode: false,
            sesion: {
                autenticado: false,
                username: '',
                rol: '',
                id: null,
                carnet: '',
                foto: ''
            },
            forms:{
                alumnos:               { mostrar: false },
                busqueda_alumnos:      { mostrar: false },
                materias:              { mostrar: false },
                busqueda_materias:     { mostrar: false },
                matricula:             { mostrar: false },
                busqueda_matricula:    { mostrar: false },
                inscripciones:         { mostrar: false },
                busqueda_inscripciones:{ mostrar: false },
                mis_notas:             { mostrar: false },
                mi_perfil:             { mostrar: false },
            }
        };
    },
    async created(){
        // Cargar preferencia de Dark Mode
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            this.darkMode = true;
            document.documentElement.setAttribute('data-bs-theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-bs-theme', 'light');
        }

        // Restaurar sesión desde sessionStorage al recargar la página
        try {
            const stored = sessionStorage.getItem('sesionUniversidad');
            if (stored) {
                const s = JSON.parse(stored);
                if (s && s.autenticado && s.rol !== 'Admin') {
                    this.sesion.autenticado = true;
                    this.sesion.username    = s.username;
                    this.sesion.rol         = s.rol;
                    this.sesion.id          = s.id;
                    this.sesion.carnet      = s.carnet || '';
                    
                    // SIEMPRE cargar la foto desde la BD
                    if(this.sesion.rol === 'Alumno' && this.sesion.carnet){
                         const alumno = await db.alumnos.where('carnet').equals(this.sesion.carnet).first();
                         if (alumno) {
                             if (alumno.estado === 'inactivo') {
                                 console.warn('Sesión cerrada: Alumno inactivo.');
                                 this.cerrarSesion();
                                 return;
                             }
                             if (alumno.foto) this.sesion.foto = alumno.foto;
                         }
                    }
                }
            }
        } catch(e) { /* sesión corrupta, ignorar */ }
    },
    methods:{
        abrirVentana(nombre){
            // Cierra todos los paneles
            Object.keys(this.forms).forEach(key => {
                this.forms[key].mostrar = false;
            });
            // Abre solo el seleccionado
            if(this.forms[nombre]) {
                this.forms[nombre].mostrar = true;
            }
        },
        buscar(refBusqueda, metodo){
            this.$refs[refBusqueda][metodo]();
        },
        modificar(refForm, metodo, datos){
            this.forms[refForm].mostrar  = true;
            // Oculta el panel de búsqueda correspondiente
            const busquedaKey = 'busqueda_' + refForm;
            if(this.forms[busquedaKey]) this.forms[busquedaKey].mostrar = false;
            
            // Asegurar que mi_perfil está cerrado si abrimos otro form (aunque el loop arriba ya lo hace, es bueno asegurar)
            this.forms.mi_perfil.mostrar = false; 

            this.$refs[refForm][metodo](datos);
        },
        async loginExitoso(datos) {
            this.sesion.autenticado = true;
            this.sesion.username    = datos.username;
            this.sesion.rol         = datos.rol;
            this.sesion.id          = datos.id;
            this.sesion.carnet      = datos.carnet || '';
            this.sesion.foto        = '';

            if(datos.rol === 'Alumno' && datos.carnet){
                const alumno = await db.alumnos.where('carnet').equals(datos.carnet).first();
                if(alumno && alumno.foto) this.sesion.foto = alumno.foto;
            }

            // Guardar sesión COMPLETA en sessionStorage
            sessionStorage.setItem('sesionUniversidad', JSON.stringify(datos));
        },
        cerrarSesion() {
            sessionStorage.removeItem('sesionUniversidad');
            this.sesion.autenticado = false;
            this.sesion.username    = '';
            this.sesion.rol         = '';
            this.sesion.foto        = '';
            // Cierra todos los paneles abiertos
            for (const key in this.forms) {
                this.forms[key].mostrar = false;
            }
        },
        actualizarFotoSesion(foto) {
            this.sesion.foto = foto;
        },
        toggleDarkMode() {
            this.darkMode = !this.darkMode;
            const theme = this.darkMode ? 'dark' : 'light';
            document.documentElement.setAttribute('data-bs-theme', theme);
            localStorage.setItem('theme', theme);
        }
    }
});

// Registro de componentes
app.component('login', login);
app.component('alumnos',                alumnos);
app.component('busqueda_alumnos',       busqueda_alumnos);
app.component('materias',               materias);
app.component('busqueda_materias',      busqueda_materias);
app.component('matricula',              matricula);
app.component('busqueda_matricula',     busqueda_matricula);
app.component('inscripciones',          inscripciones);
app.component('busqueda_inscripciones', busqueda_inscripciones);
app.component('mis_notas',              misNotas);
app.component('mi_perfil',              miPerfil);

app.mount('#app');