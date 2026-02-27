// =============================================
// ADMIN — Gestión de Solicitudes de Registro
// Procesa el pre-registro y genera carnet único
// =============================================

const solicitudesAdmin = {
    data() {
        return {
            solicitudes: [],
            carrerasMatch: {},
            cargando: false,
            procesando: null
        };
    },
    async mounted() {
        await this.cargar();
    },
    methods: {
        async cargar() {
            this.cargando = true;
            try {
                this.solicitudes = await db.solicitudes.where('estado').equals('pendiente').toArray();
                const carrs = await db.carreras.toArray();
                this.carrerasMatch = carrs.reduce((acc, c) => {
                    acc[c.idCarrera] = c;
                    return acc;
                }, {});
            } catch (e) {
                alertify.error('Error al cargar solicitudes: ' + e.message);
            } finally {
                this.cargando = false;
            }
        },

        async aprobar(sol) {
            alertify.confirm('Aprobar Registro', `¿Confirmar la aprobación de <b>${sol.username}</b> como ${sol.tipo}? Se generará su carnet oficial automáticamente.`,
            async () => {
                this.procesando = sol.id;
                try {
                    const año = new Date().getFullYear();
                    let nuevoCarnet = '';

                    if (sol.tipo === 'Alumno') {
                        const carrera = this.carrerasMatch[sol.carreraId];
                        const codCarrera = carrera ? carrera.codigo : 'XXX';
                        
                        // v12+: Algoritmo de carnet estudiantil: AÑO-CARRERA-CORRELATIVO(5)
                        const prefijo = `${año}-${codCarrera}-`;
                        const alumnosCod = await db.alumnos
                            .filter(a => a.carnet && a.carnet.startsWith(prefijo))
                            .toArray();
                        
                        let ultimoNum = 0;
                        alumnosCod.forEach(a => {
                            const partes = a.carnet.split('-');
                            const num = parseInt(partes[2]);
                            if (num > ultimoNum) ultimoNum = num;
                        });

                        const correlativo = (ultimoNum + 1).toString().padStart(5, '0');
                        nuevoCarnet = `${prefijo}${correlativo}`;

                    } else {
                        // v12+: Algoritmo docente: DOC-AÑO-CORRELATIVO(3)
                        const prefijo = `DOC-${año}-`;
                        const docentesAño = await db.docentes
                            .filter(d => d.carnet && d.carnet.startsWith(prefijo))
                            .toArray();

                        let ultimoNum = 0;
                        docentesAño.forEach(d => {
                            const partes = d.carnet.split('-');
                            const num = parseInt(partes[2]);
                            if (num > ultimoNum) ultimoNum = num;
                        });

                        const correlativo = (ultimoNum + 1).toString().padStart(3, '0');
                        nuevoCarnet = `${prefijo}${correlativo}`;
                    }

                    // 1. Validar duplicidad antes de proceder
                    const existeEmail = await db.usuarios.where('email').equalsIgnoreCase(sol.email).first();
                    if (existeEmail) {
                        alertify.error(`El correo ${sol.email} ya está registrado.`);
                        return;
                    }
                    const existeUser = await db.usuarios.where('username').equalsIgnoreCase(sol.username).first();
                    if (existeUser) {
                        alertify.error(`El usuario ${sol.username} ya está en uso.`);
                        return;
                    }

                    // 2. Ejecutar aprobación en transacción
                    await db.transaction('rw', [db.usuarios, db.perfiles, db.alumnos, db.docentes, db.solicitudes], async () => {
                        // A. Crear Usuario
                        const usuarioId = await db.usuarios.add({
                            username: sol.username,
                            email: sol.email,
                            hashPwd: sol.hashPwd,
                            rol: sol.tipo,
                            estado: 'activo'
                        });

                        // B. Vincular o Crear Perfil
                        if (sol.perfilId) {
                            await db.perfiles.update(sol.perfilId, { usuarioId });
                        } else {
                            await db.perfiles.add({
                                usuarioId,
                                nombre: sol.nombre || sol.username,
                                sexo: sol.sexo,
                                email: sol.email,
                                foto: '', telefono: '', direccion: '', 
                                fechaNacimiento: sol.fechaNacimiento || ''
                            });
                        }

                        // C. Vincular o Crear Registro Académico
                        if (sol.tipo === 'Alumno') {
                            if (sol.alumnoId) {
                                await db.alumnos.update(sol.alumnoId, { 
                                    usuarioId, 
                                    carnet: nuevoCarnet, 
                                    estado: 'activo' 
                                });
                            } else {
                                await db.alumnos.add({
                                    carnet: nuevoCarnet,
                                    usuarioId,
                                    carreraId: String(sol.carreraId || ''),
                                    carrera: this.carrerasMatch[sol.carreraId]?.nombre || '',
                                    añoIngreso: año,
                                    estado: 'activo'
                                });
                            }
                        } else {
                            if (sol.docenteId) {
                                await db.docentes.update(sol.docenteId, { 
                                    usuarioId, 
                                    carnet: nuevoCarnet, 
                                    estado: 'activo' 
                                });
                            } else {
                                await db.docentes.add({
                                    carnet: nuevoCarnet,
                                    usuarioId,
                                    especialidad: '',
                                    añoIngreso: año,
                                    estado: 'activo'
                                });
                            }
                        }

                        // D. Marcar solicitud como aprobada
                        await db.solicitudes.update(sol.id, { estado: 'aprobado' });
                    });

                    alertify.success(`Registro aprobado con éxito. Carnet: <b>${nuevoCarnet}</b>`);
                    await this.cargar();

                } catch (e) {
                    alertify.error('Error al procesar: ' + e.message);
                } finally {
                    this.procesando = null;
                }
            }, null);
        },

        async rechazar(sol) {
            alertify.confirm('Rechazar Solicitud', `¿Estás seguro de rechazar la solicitud de ${sol.username}?`,
            async () => {
                await db.solicitudes.update(sol.id, { estado: 'rechazado' });
                alertify.warning('Solicitud rechazada');
                await this.cargar();
            }, null);
        }
    },
    template: `
        <div class="card shadow-sm border-0">
            <div class="card-header bg-danger bg-opacity-10 py-3 d-flex justify-content-between align-items-center">
                <h5 class="mb-0 fw-bold text-danger"><i class="bi bi-person-plus-fill me-2"></i>Solicitudes de Registro Pendientes</h5>
                <button class="btn btn-sm btn-outline-danger" @click="cargar" :disabled="cargando">
                    <i class="bi bi-refresh me-1" :class="{'spinner-border spinner-border-sm': cargando}"></i> Actualizar
                </button>
            </div>
            <div class="card-body p-0">
                <div v-if="cargando && !solicitudes.length" class="p-5 text-center">
                    <div class="spinner-border text-danger" role="status"></div>
                </div>
                <div v-else-if="!solicitudes.length" class="p-5 text-center text-muted">
                    <i class="bi bi-inbox fs-1 d-block mb-3 opacity-25"></i>
                    No hay solicitudes pendientes en este momento.
                </div>
                <div v-else class="table-responsive">
                    <table class="table table-hover align-middle mb-0">
                        <thead class="bg-body-tertiary">
                            <tr>
                                <th class="ps-4">Usuario / Email</th>
                                <th>Tipo / Rol</th>
                                <th>Género</th>
                                <th>F. Nacimiento</th>
                                <th>Carrera (si aplica)</th>
                                <th>Fecha Solicitud</th>
                                <th class="text-end pe-4">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="sol in solicitudes" :key="sol.id">
                                <td class="ps-4">
                                    <div class="fw-bold">{{ sol.username }}</div>
                                    <div class="small text-muted">{{ sol.email }}</div>
                                </td>
                                <td>
                                    <span class="badge" :class="sol.tipo==='Alumno' ? 'bg-primary' : 'bg-success'">
                                        {{ sol.tipo }}
                                    </span>
                                </td>
                                <td>{{ sol.sexo }}</td>
                                <td class="small">{{ sol.fechaNacimiento }}</td>
                                <td>
                                    <span v-if="sol.tipo==='Alumno'" class="small">
                                        {{ carrerasMatch[sol.carreraId] ? carrerasMatch[sol.carreraId].nombre : 'No especificada' }}
                                    </span>
                                    <span v-else class="text-muted">—</span>
                                </td>
                                <td class="small">{{ sol.fecha }}</td>
                                <td class="text-end pe-4">
                                    <div class="btn-group shadow-sm">
                                        <button class="btn btn-sm btn-success" @click="aprobar(sol)" :disabled="procesando === sol.id">
                                            <i class="bi bi-check-circle me-1"></i> Aprobar
                                        </button>
                                        <button class="btn btn-sm btn-outline-danger" @click="rechazar(sol)" :disabled="procesando === sol.id">
                                            <i class="bi bi-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `
};