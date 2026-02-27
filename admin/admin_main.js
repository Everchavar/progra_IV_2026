// =============================================
// ADMIN — Vue App Principal
// Verificación de sesión + DB compartida
// =============================================

const db = new Dexie('universidad');
// Mantiene versiones para compatibilidad
db.version(1).stores({ alumnos:'idAlumno,codigo,nombre', materias:'idMateria,codigo,nombre', docentes:'idDocente,codigo,nombre', matricula:'idMatricula,codigo,nombreAlumno', inscripciones:'idInscripcion,idMatricula,idMateria' });
db.version(2).stores({ alumnos:'idAlumno,codigo,nombre', materias:'idMateria,codigo,nombre', docentes:'idDocente,codigo,nombre', matricula:'idMatricula,codigo,nombreAlumno', inscripciones:'idInscripcion,idMatricula,idMateria', usuarios:'++id,username,rol' });
db.version(3).stores({ alumnos:'idAlumno,codigo,nombre', materias:'idMateria,codigo,nombre', docentes:'idDocente,codigo,nombre', matricula:'idMatricula,codigo,nombreAlumno', inscripciones:'idInscripcion,idMatricula,idMateria', usuarios:'++id,username,codigo,email,rol' });
db.version(4).stores({ alumnos:'idAlumno,codigo,nombre,carrera,estado', materias:'idMateria,codigo,nombre,docenteId,estado', docentes:'idDocente,codigo,nombre,especialidad,estado', matricula:'idMatricula,codigo,nombreAlumno,idAlumno,periodoId,estado', inscripciones:'idInscripcion,idMatricula,idMateria,idAlumno', periodos:'++idPeriodo,año,ciclo,estado', usuarios:'++id,username,codigo,email,rol,estado' });
db.version(5).stores({ alumnos:'idAlumno,codigo,nombre,carrera,carreraId,estado', materias:'idMateria,codigo,nombre,docenteId,carreraId,carrera,estado', docentes:'idDocente,codigo,nombre,especialidad,estado', matricula:'idMatricula,codigo,nombreAlumno,idAlumno,periodoId,estado', inscripciones:'idInscripcion,idMatricula,idMateria,idAlumno', periodos:'++idPeriodo,año,ciclo,estado', carreras:'++idCarrera,codigo,nombre,estado', evaluaciones:'++id,idInscripcion,idMateria,computo,estado', usuarios:'++id,username,codigo,email,rol,estado' });
db.version(6).stores({ alumnos:'idAlumno,codigo,nombre,carrera,carreraId,foto,estado', materias:'idMateria,codigo,nombre,docenteId,carreraId,carrera,estado', docentes:'idDocente,codigo,nombre,especialidad,foto,estado', matricula:'idMatricula,codigo,nombreAlumno,idAlumno,periodoId,estado', inscripciones:'idInscripcion,idMatricula,idMateria,idAlumno', periodos:'++idPeriodo,año,ciclo,estado', carreras:'++idCarrera,codigo,nombre,estado', evaluaciones:'++id,idInscripcion,idMateria,computo,estado', usuarios:'++id,username,codigo,email,rol,estado' });
db.version(7).stores({
    alumnos: '++idAlumno, codigo, nombre, carrera, carreraId, foto, estado, tokenAcceso',
    materias: '++idMateria, codigo, nombre, docenteId, carreraId, carrera, estado',
    docentes: '++idDocente, codigo, nombre, especialidad, foto, estado, tokenAcceso',
    matricula: '++idMatricula, codigo, nombreAlumno, idAlumno, periodoId, estado',
    inscripciones: '++idInscripcion, idMatricula, idMateria, idAlumno',
    periodos: '++idPeriodo, año, ciclo, estado',
    carreras: '++idCarrera, codigo, nombre, estado',
    evaluaciones: '++id, idInscripcion, idMateria, computo, estado',
    usuarios: '++id, username, codigo, email, rol, estado',
    solicitudes: '++id, tipo, nombre, codigo, fecha, estado'
});
// v8: Versión definitiva — garantiza ++ auto-increment en todos los archivos del proyecto
db.version(8).stores({
    alumnos: '++idAlumno, codigo, nombre, carrera, carreraId, foto, estado, tokenAcceso',
    materias: '++idMateria, codigo, nombre, docenteId, carreraId, carrera, estado',
    docentes: '++idDocente, codigo, nombre, especialidad, foto, estado, tokenAcceso',
    matricula: '++idMatricula, codigo, nombreAlumno, idAlumno, periodoId, estado',
    inscripciones: '++idInscripcion, idMatricula, idMateria, idAlumno',
    periodos: '++idPeriodo, año, ciclo, estado',
    carreras: '++idCarrera, codigo, nombre, estado',
    evaluaciones: '++id, idInscripcion, idMateria, computo, estado',
    usuarios: '++id, username, codigo, email, rol, estado',
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
});

// Auto-recovery: si la BD no puede migrar (cambio de PK), borrar y recargar
db.open().catch(err => {
    if ((err.message || '').includes('primary key') || err.name === 'VersionError') {
        if (confirm('⚠️ La base de datos necesita actualizarse.\n¿Borrar datos antiguos y continuar?')) {
            indexedDB.deleteDatabase('universidad');
            location.reload();
        }
    } else { console.error('[DB Admin] Error:', err); }
});

const adminApp = Vue.createApp({
    data() {
        return {
            modulo: 'dashboard',
            adminSesion: { username: '', rol: '' },
            sidebarVisible: true,
            darkMode: false,
            windowWidth: window.innerWidth,
            menuItems: [
                { id: 'dashboard',      label: 'Dashboard',      icon: 'bi bi-speedometer2' },
                { id: 'solicitudes',    label: 'Solicitudes',    icon: 'bi bi-person-plus-fill' },
                { id: 'alumnos',        label: 'Alumnos',        icon: 'bi bi-person-badge' },
                { id: 'docentes',       label: 'Docentes',       icon: 'bi bi-person-workspace' },
                { id: 'carreras',       label: 'Carreras',       icon: 'bi bi-building' },
                { id: 'materias',       label: 'Materias',       icon: 'bi bi-book' },
                { id: 'periodos',       label: 'Períodos',      icon: 'bi bi-calendar-check' },
                { id: 'inscripciones',  label: 'Inscripciones',  icon: 'bi bi-pencil-square' },
                { id: 'estadisticas',   label: 'Estadísticas',   icon: 'bi bi-bar-chart-line' },
                { id: 'perfil',         label: 'Mi Cuenta',      icon: 'bi bi-person-gear' },
            ]
        };
    },
    created() {
        // Verificar sesión Admin
        try {
            const stored = sessionStorage.getItem('sesionUniversidad');
            if (!stored) { window.location.href = '../index.html'; return; }
            const s = JSON.parse(stored);
            if (!s || s.rol !== 'Admin') { window.location.href = '../index.html'; return; }
            this.adminSesion.username = s.username;
            this.adminSesion.rol = s.rol;
        } catch(e) {
            window.location.href = '../index.html';
        }
        window.addEventListener('resize', () => { this.windowWidth = window.innerWidth; });
        
        // Cargar preferencia de Dark Mode
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            this.darkMode = true;
            document.documentElement.setAttribute('data-bs-theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-bs-theme', 'light');
        }

        // Sincronizar cuentas de usuarios con sus perfiles (alumno/docente)
        this.$nextTick(() => this.sincronizarPerfiles());
    },
    methods: {
        toggleDarkMode() {
            this.darkMode = !this.darkMode;
            const theme = this.darkMode ? 'dark' : 'light';
            document.documentElement.setAttribute('data-bs-theme', theme);
            localStorage.setItem('theme', theme);
        },
        cerrarSesion() {
            sessionStorage.removeItem('sesionUniversidad');
            window.location.href = '../index.html';
        },
        async sincronizarPerfiles() {
            // En v11, la sincronización se maneja de forma centralizada o al crear usuarios.
            // Para evitar errores de inconsistencia, solo nos aseguramos de que existan los registros base.
            try {
                const usuarios = await db.usuarios.toArray();
                for (const u of usuarios) {
                    if (u.rol === 'Admin') continue;
                    
                    // 1. Asegurar Perfil
                    const perfil = await db.perfiles.where('usuarioId').equals(u.id).first();
                    if (!perfil) {
                        await db.perfiles.add({
                            usuarioId: u.id, nombre: u.username, email: u.email || '',
                            sexo: 'Masculino', foto: '', telefono: '', direccion: '', fechaNacimiento: ''
                        });
                    }

                    // 2. Asegurar Registro Académico
                    if (u.rol === 'Alumno') {
                        const al = await db.alumnos.where('usuarioId').equals(u.id).first();
                        if (!al) {
                            await db.alumnos.add({
                                carnet: 'SIN-CARNET', usuarioId: u.id, carreraId: '',
                                añoIngreso: new Date().getFullYear(), estado: 'activo'
                            });
                        }
                    } else if (u.rol === 'Docente') {
                        const doc = await db.docentes.where('usuarioId').equals(u.id).first();
                        if (!doc) {
                            await db.docentes.add({
                                carnet: 'SIN-CARNET', usuarioId: u.id, especialidad: '',
                                añoIngreso: new Date().getFullYear(), estado: 'activo'
                            });
                        }
                    }
                }
            } catch(e) { console.warn('sincronizarPerfiles:', e); }
        }
    }
});

adminApp.component('admin-dashboard',    adminDashboard);
adminApp.component('solicitudes-admin',  solicitudesAdmin);
adminApp.component('alumnos-admin',      alumnosAdmin);
adminApp.component('docentes-admin',     docentesAdmin);
adminApp.component('carreras-admin',     carrerasAdmin);
adminApp.component('materias-admin',     materiasAdmin);
adminApp.component('periodos-admin',     periodosAdmin);
adminApp.component('inscripciones-admin',inscripcionesAdmin);
adminApp.component('estadisticas-admin', estadisticasAdmin);
adminApp.component('perfil-admin',       perfilAdmin);

adminApp.mount('#adminApp');