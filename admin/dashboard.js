// =============================================
// ADMIN — Dashboard
// =============================================

const adminDashboard = {
    data() {
        return {
            stats: {
                alumnosActivos: 0, alumnosTotal: 0,
                docentesActivos: 0,
                materiasHabilitadas: 0, materiasTotal: 0,
                inscripcionesTotal: 0
            },
            cargando: true,
            solicitudesPendientes: [],
        };
    },
    async mounted() { await this.cargar(); },
    methods: {
        async cargar() {
            this.cargando = true;
            try {
                const [alumnos, docentes, materias, inscripciones, periodos, solicitudes] = await Promise.all([
                    db.alumnos.toArray(),
                    db.docentes.toArray(),
                    db.materias.toArray(),
                    db.inscripciones.toArray(),
                    db.periodos.toArray(),
                    db.solicitudes.where('estado').equals('pendiente').toArray()
                ]);

                this.stats.alumnosTotal     = alumnos.length;
                this.stats.alumnosActivos   = alumnos.filter(a => (a.estado || 'activo') === 'activo').length;
                this.stats.docentesActivos  = docentes.filter(d => (d.estado || 'activo') === 'activo').length;
                this.stats.materiasTotal    = materias.length;
                this.stats.materiasHabilitadas = materias.filter(m => (m.estado || 'habilitada') === 'habilitada').length;
                this.stats.inscripcionesTotal  = inscripciones.length;
                this.periodoActual = periodos.find(p => p.estado === 'abierto') || null;
                
                this.solicitudesPendientes = solicitudes;
            } finally {
                this.cargando = false;
            }
        },
        async depurarUsuarios() {
            alertify.confirm('Depurar Usuarios Fantasmas', 'Esta acción buscará y eliminará usuarios que quedaron huérfanos (sin perfil de Alumno o Docente asociado). ¿Deseas continuar?', async () => {
                let eliminados = 0;
                const usuarios = await db.usuarios.toArray();
                
                for (const u of usuarios) {
                    if (u.rol === 'Admin') continue;

                    let existe = false;
                    if (u.rol === 'Alumno') {
                        existe = await db.alumnos.where('usuarioId').equals(u.id).count() > 0;
                    } else if (u.rol === 'Docente') {
                        existe = await db.docentes.where('usuarioId').equals(u.id).count() > 0;
                    }

                    if (!existe) {
                        await db.usuarios.delete(u.id);
                        eliminados++;
                    }
                }
                
                if (eliminados > 0) {
                    alertify.success(`Se eliminaron ${eliminados} usuarios fantasmas.`);
                    await this.cargar();
                } else {
                    alertify.message('No se encontraron usuarios fantasmas.');
                }
            }, () => {}).set('labels', {ok:'Sí, Depurar', cancel:'Cancelar'});
        },

        // ── RESTAURAR DATOS ESENCIALES (v10) ─────────
        async restaurarDatosEsenciales() {
            alertify.confirm(
                '🔄 Restaurar Datos Esenciales',
                `Esto creará (sin duplicar si ya existe):<br>
                <ul class="text-start mt-2 mb-0 small">
                    <li><b>Cuenta Admin</b> (usuario: <code>Admin</code>)</li>
                    <li>Carrera <b>Ing. en Sistemas</b></li>
                    <li>Pîríodo activo <b>01-2026</b></li>
                    <li>Docente <b>Ejemplo</b> + carnet oficial</li>
                    <li>Alumno <b>Ejemplo</b> + carnet oficial</li>
                    <li>Materia <b>MAT-120</b> asignada</li>
                    <li>Mátricúla de ejemplo vinculada</li>
                </ul><br>
                Los carnets existentes <b>no se duplican</b>. ¿Continuar?`,
                async () => {
                    try {
                        const log = [];
                        const hash = async pwd => {
                            const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pwd));
                            return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
                        };

                        // 1. Cuenta Admin
                        let adminUser = await db.usuarios.where('username').equalsIgnoreCase('Admin').first();
                        if (!adminUser) {
                            const id = await db.usuarios.add({ username:'Admin', email:'admin@universidad.edu', hashPwd: await hash('Admin2026!'), rol:'Admin', carnet: 'ADMIN-001', estado:'activo' });
                            adminUser = await db.usuarios.get(id);
                            log.push('✅ Cuenta Admin creada');
                        } else { log.push('⏭ Cuenta Admin ya existe'); }

                        // 2. Carrera (FK base para alumnos y materias)
                        let carrera = await db.carreras.where('codigo').equalsIgnoreCase('ISI').first();
                        if (!carrera) {
                            const id = await db.carreras.add({ codigo:'ISI', nombre:'Ingeniería en Sistemas Informáticos', facultad:'Ing. y Arquitectura', estado:'activo' });
                            carrera = await db.carreras.get(id);
                            log.push('✅ Carrera ISI creada');
                        } else { log.push('⏭ Carrera ISI ya existe'); }

                        // 3. Período activo (FK para matrículas)
                        let periodo = await db.periodos.filter(p => p.ciclo === '01' && String(p.año) === '2026').first();
                        if (!periodo) {
                            const id = await db.periodos.add({ año:'2026', ciclo:'01', estado:'abierto' });
                            periodo = await db.periodos.get(id);
                            log.push('✅ Período 01-2026 creado');
                        } else { log.push('⏭ Período ya existe'); }

                        // 4. Docente Ej-001 + cuenta (usuarioId FK)
                        const carnetDoc = 'DOC-2026-001';
                        let docente = await db.docentes.where('carnet').equalsIgnoreCase(carnetDoc).first();
                        if (!docente) {
                            let userDoc = await db.usuarios.where('username').equals('docente.ejemplo').first();
                            if (!userDoc) {
                                const uid = await db.usuarios.add({ username: 'docente.ejemplo', email:'docente@universidad.edu', hashPwd: await hash('Docente2026!'), rol:'Docente', estado:'activo' });
                                userDoc = await db.usuarios.get(uid);
                            }
                            await db.perfiles.add({
                                usuarioId: userDoc.id, nombre: 'Docente Ejemplo', email: 'docente@universidad.edu',
                                sexo: 'Masculino', foto: '', fechaNacimiento: '1985-05-15'
                            });
                            const did = await db.docentes.add({ carnet: carnetDoc, especialidad:'Sistemas Informáticos', añoIngreso: 2026, usuarioId: userDoc.id, estado:'activo' });
                            docente = await db.docentes.get(did);
                            log.push('✅ Docente Ejemplo + perfil creados');
                        } else { log.push('⏭ Docente Ejemplo ya existe'); }

                        // 5. Alumno Ej-001 + cuenta (usuarioId FK + carreraId FK)
                        const carnetAlu = '2026-ISI-00001';
                        let alumno = await db.alumnos.where('carnet').equalsIgnoreCase(carnetAlu).first();
                        if (!alumno) {
                            let userAlum = await db.usuarios.where('username').equals('alumno.ejemplo').first();
                            if (!userAlum) {
                                const uid = await db.usuarios.add({ username: 'alumno.ejemplo', email:'alumno@universidad.edu', hashPwd: await hash('Alumno2026!'), rol:'Alumno', estado:'activo' });
                                userAlum = await db.usuarios.get(uid);
                            }
                            await db.perfiles.add({
                                usuarioId: userAlum.id, nombre: 'Alumno Ejemplo', email: 'alumno@universidad.edu',
                                sexo: 'Masculino', foto: '', fechaNacimiento: '2005-10-20'
                            });
                            const aid = await db.alumnos.add({ carnet: carnetAlu, carreraId: carrera.idCarrera, añoIngreso: 2026, usuarioId: userAlum.id, estado:'activo' });
                            alumno = await db.alumnos.get(aid);
                            log.push('✅ Alumno Ejemplo + perfil creados');
                        } else { log.push('⏭ Alumno Ejemplo ya existe'); }

                        // 6. Materia (docenteId + carreraId FKs)
                        let materia = await db.materias.where('codigo').equalsIgnoreCase('MAT-120').first();
                        if (!materia) {
                            await db.materias.add({ codigo:'MAT-120', nombre:'Matemática I', docenteId: docente.idDocente, carreraId: carrera.idCarrera, estado:'activo' });
                            log.push('✅ Materia MAT-120 creada');
                        } else { log.push('⏭ Materia MAT-120 ya existe'); }

                        // 7. Matrícula (alumnoId + periodoId + carreraId FKs)
                        const existeMatricula = await db.matricula.where('alumnoId').equals(alumno.idAlumno).filter(m => m.periodoId === periodo.idPeriodo).first();
                        if (!existeMatricula) {
                            await db.matricula.add({
                                codigo: 'MAT-2026-ISI-00001',
                                alumnoId:       alumno.idAlumno,
                                carreraId:      carrera.idCarrera,
                                periodoId:      periodo.idPeriodo,
                                estado: 'Activo',
                                fechaCreacion: new Date().toISOString()
                            });
                            log.push('✅ Matrícula de Ejemplo creada');
                        } else { log.push('⏭ Matrícula ya existe'); }

                        await this.cargar();
                        alertify.alert('✅ Restauración Completada',
                            '<ul class="text-start small">' + log.map(i => `<li>${i}</li>`).join('') + '</ul>' +
                            '<hr class="my-2"><small class="text-muted">Credenciales v10:<br>Admin: <code>Admin / Admin2026!</code><br>Docente: <code>docente.ejemplo / Docente2026!</code><br>Alumno: <code>alumno.ejemplo / Alumno2026!</code></small>'
                        );
                    } catch(e) {
                        alertify.error('Error al restaurar: ' + e.message);
                        console.error(e);
                    }
                },
                () => {}
            ).set('labels', { ok:'Sí, Restaurar', cancel:'Cancelar' });
        }
    },
    template: `
        <div>
            <div class="d-flex align-items-center mb-4 border-bottom pb-2">
                <i class="bi bi-speedometer2 me-2 fs-5 text-secondary"></i>
                <h5 class="mb-0 fw-semibold">Dashboard</h5>
                <button class="btn btn-sm btn-outline-secondary ms-auto" @click="cargar">
                    <i class="bi bi-arrow-clockwise"></i>
                </button>
            </div>

            <div v-if="cargando" class="text-center py-5">
                <div class="spinner-border text-secondary"></div>
            </div>

            <div v-else>
                <!-- Período activo -->
                <div class="alert d-flex align-items-center gap-3 mb-4"
                     :class="periodoActual ? 'alert-success' : 'alert-warning'">
                    <i :class="periodoActual ? 'bi bi-calendar-check-fill' : 'bi bi-calendar-x-fill'" class="fs-4"></i>
                    <div>
                        <div class="fw-semibold">
                            {{ periodoActual ? 'Período de matrícula ABIERTO' : 'Sin período de matrícula activo' }}
                        </div>
                        <small v-if="periodoActual">
                            Ciclo {{ periodoActual.ciclo }} — {{ periodoActual.año }}
                        </small>
                        <small v-else>Ve a <strong>Períodos</strong> para abrir uno.</small>
                    </div>
                </div>

                <!-- Cards de estadísticas -->
                <div class="row g-3 mb-4">
                    <div class="col-sm-6 col-xl-3">
                        <div class="card border-0 shadow-sm h-100 bg-body-tertiary">
                            <div class="card-body">
                                <div class="d-flex align-items-center gap-3">
                                    <div class="rounded-circle d-flex align-items-center justify-content-center bg-primary bg-opacity-10"
                                         style="width:48px;height:48px;">
                                        <i class="bi bi-person-badge text-primary fs-5"></i>
                                    </div>
                                    <div>
                                        <div class="fw-bold fs-4 lh-1 text-body">{{ stats.alumnosActivos }}</div>
                                        <div class="text-body-secondary small">Alumnos activos</div>
                                    </div>
                                </div>
                                <div class="mt-2 text-body-secondary" style="font-size:.75rem;">
                                    {{ stats.alumnosTotal - stats.alumnosActivos }} inactivos · {{ stats.alumnosTotal }} total
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-sm-6 col-xl-3">
                        <div class="card border-0 shadow-sm h-100 bg-body-tertiary">
                            <div class="card-body">
                                <div class="d-flex align-items-center gap-3">
                                    <div class="rounded-circle d-flex align-items-center justify-content-center bg-success bg-opacity-10"
                                         style="width:48px;height:48px;">
                                        <i class="bi bi-person-workspace text-success fs-5"></i>
                                    </div>
                                    <div>
                                        <div class="fw-bold fs-4 lh-1 text-body">{{ stats.docentesActivos }}</div>
                                        <div class="text-body-secondary small">Docentes activos</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-sm-6 col-xl-3">
                        <div class="card border-0 shadow-sm h-100 bg-body-tertiary">
                            <div class="card-body">
                                <div class="d-flex align-items-center gap-3">
                                    <div class="rounded-circle d-flex align-items-center justify-content-center bg-warning bg-opacity-10"
                                         style="width:48px;height:48px;">
                                        <i class="bi bi-book text-warning fs-5"></i>
                                    </div>
                                    <div>
                                        <div class="fw-bold fs-4 lh-1 text-body">{{ stats.materiasHabilitadas }}</div>
                                        <div class="text-body-secondary small">Materias habilitadas</div>
                                    </div>
                                </div>
                                <div class="mt-2 text-body-secondary" style="font-size:.75rem;">
                                    {{ stats.materiasTotal }} registradas en total
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-sm-6 col-xl-3">
                        <div class="card border-0 shadow-sm h-100">
                            <div class="card-body">
                                <div class="d-flex align-items-center gap-3">
                                    <div class="rounded-circle d-flex align-items-center justify-content-center"
                                         style="width:48px;height:48px;background:#fce8f3;">
                                        <i class="bi bi-pencil-square text-danger fs-5"></i>
                                    </div>
                                    <div>
                                        <div class="fw-bold fs-4 lh-1">{{ stats.inscripcionesTotal }}</div>
                                        <div class="text-muted small">Inscripciones totales</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Accesos Rápidos y Mantenimiento -->
                <div class="row mb-4">
                    <div class="col-md-12">
                        <div class="card border-0 shadow-sm">
                            <div class="card-body p-4 d-flex align-items-center justify-content-between">
                                <div>
                                    <h5 class="card-title fw-bold text-secondary mb-1">Mantenimiento Global</h5>
                                    <p class="text-muted small mb-0">Herramientas & Solicitudes pendientes.</p>
                                </div>
                                <div class="d-flex gap-2 flex-wrap">
                                    <button class="btn btn-success" @click="restaurarDatosEsenciales">
                                        <i class="bi bi-arrow-counterclockwise me-2"></i>Restaurar Datos
                                    </button>
                                    <button class="btn btn-outline-danger" @click="depurarUsuarios">
                                        <i class="bi bi-tools me-2"></i>Depurar Usuarios
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ============================= -->

                <!-- Jerarquía institucional -->
                <div class="card border-0 shadow-sm bg-body-tertiary">
                    <div class="card-header bg-transparent border-bottom fw-semibold small text-uppercase text-body-secondary">
                        <i class="bi bi-diagram-3 me-1"></i>Flujo institucional
                    </div>
                    <div class="card-body">
                        <div class="d-flex flex-wrap align-items-center gap-2 justify-content-center">
                            <span class="badge bg-danger fs-6 px-3 py-2 shadow-sm">Admin</span>
                            <i class="bi bi-arrow-right text-body-secondary"></i>
                            <span class="badge bg-success px-3 py-2 shadow-sm">Gestiona Docentes</span>
                            <i class="bi bi-arrow-right text-body-secondary"></i>
                            <span class="badge bg-warning text-dark px-3 py-2 shadow-sm">Crea Materias</span>
                            <i class="bi bi-arrow-right text-body-secondary"></i>
                            <span class="badge bg-info text-dark px-3 py-2 shadow-sm">Abre Período</span>
                            <i class="bi bi-arrow-right text-body-secondary"></i>
                            <span class="badge bg-primary px-3 py-2 shadow-sm">Alumno se matricula</span>
                            <i class="bi bi-arrow-right text-body-secondary"></i>
                            <span class="badge bg-secondary px-3 py-2 shadow-sm">Se inscribe en materias</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
};