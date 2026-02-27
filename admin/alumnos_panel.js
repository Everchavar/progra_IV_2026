// =============================================
// ADMIN — Gestión de Alumnos
// =============================================

const alumnosAdmin = {
    data() {
        return {
            alumnos: [],
            carreras: [],
            filtro: '',
            cargando: false,
            editando: null,
            guardandoEdit: false,
            guardandoNuevo: false,
            nuevoAlumno: {
                nombre: '',
                email: '',
                username: '',
                fechaNacimiento: '',
                sexo: 'Masculino'
            },
            alumnoDetalle: null,
            histMatriculas: [],
            histInscripciones: []
        };
    },
    async mounted() { await this.cargar(); },
    computed: {
        alumnosFiltrados() {
            const f = this.filtro.toLowerCase().trim();
            if (!f) return this.alumnos;
            return this.alumnos.filter(a =>
                (a.nombre   || '').toLowerCase().includes(f) ||
                (a.carnet   || '').toLowerCase().includes(f) ||
                (a.carrera  || '').toLowerCase().includes(f)
            );
        }
    },
    methods: {
        async cargar() {
            this.cargando = true;
            try {
                const [alRaw, carrs] = await Promise.all([
                    db.alumnos.toArray(),
                    db.carreras.filter(c => (c.estado||'activa')==='activa').sortBy('nombre')
                ]);
                this.carreras = carrs;

                // Join con perfiles (v11+)
                const ids = alRaw.map(a => a.usuarioId).filter(id => id);
                const perfs = await db.perfiles.where('usuarioId').anyOf(ids).toArray();
                const perfsMap = perfs.reduce((acc, p) => { acc[p.usuarioId] = p; return acc; }, {});

                this.alumnos = alRaw.map(a => ({
                    ...a,
                    nombre: perfsMap[a.usuarioId]?.nombre || '— Sin nombre —',
                    sexo:   perfsMap[a.usuarioId]?.sexo   || 'Masculino',
                    foto:   perfsMap[a.usuarioId]?.foto   || '',
                    email:  perfsMap[a.usuarioId]?.email  || '',
                    telefono: perfsMap[a.usuarioId]?.telefono || ''
                })).sort((a,b) => a.nombre.localeCompare(b.nombre));

            } catch (e) {
                console.error('Error al cargar alumnos:', e);
                alertify.error('Error al cargar datos relacionales.');
            } finally {
                this.cargando = false;
            }
        },
        estado(a) { return a.estado || 'activo'; },
        async eliminar(alumno) {
            alertify.confirm(
                'Eliminar Alumno Definitivamente',
                `¿Estás seguro de ELIMINAR a <b>${alumno.nombre}</b>?<br>Se borrarán su usuario, matrícula, inscripciones y notas de forma permanente.`,
                async () => {
                    try {
                        // 1. Eliminar Matrícula
                        const matriculas = await db.matricula.where('alumnoId').equals(alumno.idAlumno).toArray();
                        const idsMatricula = matriculas.map(m => m.idMatricula);
                        await db.matricula.where('alumnoId').equals(alumno.idAlumno).delete();

                        // 2. Eliminar Inscripciones y Evaluaciones (Notas)
                        if (idsMatricula.length > 0) {
                            const inscripciones = await db.inscripciones.where('idMatricula').anyOf(idsMatricula).toArray();
                            const idsInscripciones = inscripciones.map(i => i.idInscripcion);
                            
                            await db.inscripciones.where('matriculaId').anyOf(idsMatricula).delete();
                            
                            if (idsInscripciones.length > 0) {
                                await db.evaluaciones.where('inscripcionId').anyOf(idsInscripciones).delete();
                            }
                        }

                        // 3. Eliminar usuario asociado (si existe)
                        if (alumno.usuarioId) {
                            await db.usuarios.delete(alumno.usuarioId);
                            // También eliminar el perfil
                            const p = await db.perfiles.where('usuarioId').equals(alumno.usuarioId).first();
                            if (p) await db.perfiles.delete(p.id);
                        }

                        // 4. Eliminar Alumno
                        await db.alumnos.delete(alumno.idAlumno);
                        
                        alertify.success('Alumno y todos sus registros eliminados.');
                        await this.cargar();
                    } catch(e) {
                        alertify.error('Error al eliminar: ' + e.message);
                    }
                },
                () => {}
            ).set('labels', { ok: 'Sí, ELIMINAR', cancel: 'Cancelar' });
        },
        async toggleEstado(alumno) {
            const nuevo = this.estado(alumno) === 'activo' ? 'inactivo' : 'activo';
            await db.alumnos.update(alumno.idAlumno, { estado: nuevo });
            alumno.estado = nuevo;
            alertify.success(`Alumno ${nuevo === 'activo' ? 'activado' : 'desactivado'}.`);
        },
        abrirEditar(alumno) {
            this.editando = { ...alumno, foto: alumno.foto || '' };
            this.abrirModal('modalEditarAlumno');
        },
        seleccionarFoto(event) {
            const file = event.target.files[0];
            if (!file) return;
            if (file.size > 500 * 1024) {
                alertify.error('La imagen es muy pesada (máx 500KB).');
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                this.editando.foto = e.target.result;
            };
            reader.readAsDataURL(file);
        },
        async guardarEdicion() {
            if (!this.editando.nombre) {
                alertify.error('El nombre es obligatorio.');
                return;
            }
            this.guardandoEdit = true;
            const car = this.carreras.find(c => c.nombre === (this.editando.carrera||''));
            await db.alumnos.update(this.editando.idAlumno, {
                nombre:    this.editando.nombre,
                carrera:   this.editando.carrera || '',
                carreraId: car ? String(car.idCarrera) : (this.editando.carreraId || ''),
                sexo:      this.editando.sexo || 'Masculino',
                direccion: this.editando.direccion || '',
                email:     this.editando.email || '',
                telefono:  this.editando.telefono || '',
                foto:      this.editando.foto
            });
            // Sincronizar nombre en usuario si existe
            if (this.editando.usuarioId) {
                await db.usuarios.update(this.editando.usuarioId, { username: this.editando.nombre });
            }
            await this.cargar();
            this.cerrarModal('modalEditarAlumno');
            this.guardandoEdit = false;
            alertify.success('Alumno actualizado.');
        },
        async verHistorial(alumno) {
            this.alumnoDetalle = alumno;
            this.histMatriculas = await db.matricula
                .where('alumnoId').equals(alumno.idAlumno)
                .toArray();
            const idMatriculas = this.histMatriculas.map(m => m.idMatricula);
            this.histInscripciones = idMatriculas.length
                ? await db.inscripciones.where('matriculaId').anyOf(idMatriculas).toArray()
                : [];
            this.abrirModal('modalHistorialAlumno');
        },
        // --- NUEVO REGISTRO ---
        abrirNuevo() {
            this.nuevoAlumno = { nombre:'', email:'', username:'', fechaNacimiento:'', sexo:'Masculino' };
            this.abrirModal('modalNuevoAlumno');
        },
        async hashPassword(pwd) {
            const data = new TextEncoder().encode(pwd);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            return Array.from(new Uint8Array(hashBuffer))
                .map(b => b.toString(16).padStart(2, '0')).join('');
        },
        async guardarNuevo() {
            const n = this.nuevoAlumno;
            if (!n.nombre || !n.email || !n.username || !n.fechaNacimiento) {
                alertify.error('Completa los campos obligatorios.');
                return;
            }
            this.guardandoNuevo = true;
            try {
                // 1. Generar Carnet
                const año = new Date().getFullYear();
                // Al eliminar carrera del form, usamos un prefijo genérico o buscamos la primera si existe
                const codCarrera = 'GEN'; 
                const prefijo = `${año}-${codCarrera}-`;
                
                const alumnosAño = await db.alumnos.filter(a => a.carnet && a.carnet.startsWith(prefijo)).toArray();
                let ultimoNum = 0;
                alumnosAño.forEach(a => {
                    const num = parseInt(a.carnet.split('-')[2]);
                    if (num > ultimoNum) ultimoNum = num;
                });
                const nuevoCarnet = `${prefijo}${(ultimoNum + 1).toString().padStart(5, '0')}`;

                // 2. Transacción (Corregido: array de tablas)
                const hashPwd = await this.hashPassword(n.fechaNacimiento);
                await db.transaction('rw', [db.usuarios, db.alumnos, db.perfiles], async () => {
                    const usuarioId = await db.usuarios.add({
                        username: n.username, email: n.email, hashPwd, rol: 'Alumno', carnet: nuevoCarnet, estado: 'pendiente_activacion'
                    });
                    await db.perfiles.add({
                        usuarioId, nombre: n.nombre, sexo: n.sexo, email: n.email, foto: '',
                        fechaNacimiento: n.fechaNacimiento
                    });
                    await db.alumnos.add({
                        carnet: nuevoCarnet, usuarioId, carreraId: '',
                        carrera: 'General', añoIngreso: año, estado: 'inactivo'
                    });
                });

                alertify.success(`Alumno pre-registrado. Carnet: ${nuevoCarnet}. En espera de activación.`);
                this.cerrarModal('modalNuevoAlumno');
                await this.cargar();
            } catch (e) { alertify.error('Error: ' + e.message); }
            finally { this.guardandoNuevo = false; }
        },
        abrirModal(id) { new bootstrap.Modal(document.getElementById(id)).show(); },
        cerrarModal(id) { bootstrap.Modal.getInstance(document.getElementById(id))?.hide(); }
    },
    template: `
        <div>
            <div class="d-flex align-items-center mb-3 border-bottom pb-2">
                <i class="bi bi-person-badge me-2 fs-5 text-secondary"></i>
                <h5 class="mb-0 fw-semibold">Gestión de Alumnos</h5>
                <button class="btn btn-sm btn-primary ms-3 shadow-sm" @click="abrirNuevo">
                    <i class="bi bi-person-plus-fill me-1"></i> Registrar Alumno
                </button>
                <button class="btn btn-sm btn-outline-secondary ms-auto" @click="cargar">
                    <i class="bi bi-arrow-clockwise"></i>
                </button>
            </div>

            <!-- Búsqueda -->
            <div class="mb-3" style="max-width:400px;">
                <div class="input-group shadow-sm">
                    <span class="input-group-text bg-body-secondary border-end-0"><i class="bi bi-search text-body-secondary"></i></span>
                    <input v-model="filtro" type="text" class="form-control border-start-0 bg-transparent"
                           placeholder="Buscar por nombre, carnet o carrera...">
                    <button v-if="filtro" class="btn btn-outline-secondary" @click="filtro=''">
                        <i class="bi bi-x"></i>
                    </button>
                </div>
            </div>

            <!-- Tabla -->
            <div v-if="cargando" class="text-center py-4"><div class="spinner-border text-secondary"></div></div>
            <div v-else-if="alumnos.length===0" class="text-center py-5 text-muted">
                <i class="bi bi-person-badge fs-1 opacity-25"></i>
                <p class="mt-2">No hay alumnos registrados.</p>
            </div>
            <div v-else class="card border-0 shadow-sm bg-body-tertiary">
                <div class="table-responsive">
                    <table class="table table-hover align-middle mb-0 small">
                        <thead class="bg-body-secondary">
                            <tr>
                                <th style="width:50px;" class="text-body-secondary">Foto</th>
                                <th class="text-body-secondary">Carnet</th>
                                <th class="text-body-secondary">Nombre</th>
                                <th class="text-body-secondary">Carrera</th>
                                <th class="text-body-secondary">Sexo</th>
                                <th class="text-body-secondary">Estado</th>
                                <th class="text-end text-body-secondary">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="a in alumnosFiltrados" :key="a.idAlumno"
                                :class="estado(a)==='inactivo' ? 'table-light text-muted' : ''">
                                <td>
                                    <img :src="a.foto || 'https://via.placeholder.com/40?text=S'"
                                         class="rounded-circle border"
                                         style="width:36px; height:36px; object-fit: cover;">
                                </td>
                                <td class="fw-semibold font-monospace small">{{ a.carnet }}</td>
                                <td>{{ a.nombre }}</td>
                                <td>{{ a.carrera || '—' }}</td>
                                <td>
                                    <small :class="a.sexo === 'Masculino' ? 'text-primary' : 'text-danger'">
                                        <i :class="a.sexo === 'Masculino' ? 'bi bi-gender-male' : 'bi bi-gender-female'"></i>
                                        {{ a.sexo }}
                                    </small>
                                </td>
                                <td>
                                    <span class="badge" :class="estado(a)==='activo' ? 'bg-success' : 'bg-secondary'">
                                        {{ estado(a) === 'activo' ? 'Activo' : 'Inactivo' }}
                                    </span>
                                </td>
                                <td class="text-end">
                                    <div class="d-flex gap-1 justify-content-end">
                                        <button class="btn btn-sm btn-outline-primary" @click="abrirEditar(a)" title="Editar">
                                            <i class="bi bi-pencil"></i>
                                        </button>
                                        <button class="btn btn-sm" @click="toggleEstado(a)" title="Cambiar estado"
                                                :class="estado(a)==='activo' ? 'btn-outline-warning' : 'btn-outline-success'">
                                            <i :class="estado(a)==='activo' ? 'bi bi-person-slash' : 'bi bi-person-check'"></i>
                                        </button>
                                        <button class="btn btn-sm btn-outline-danger" @click="eliminar(a)" title="Eliminar definitivamente">
                                            <i class="bi bi-trash"></i>
                                        </button>
                                        <button class="btn btn-sm btn-outline-info" @click="verHistorial(a)" title="Ver historial y expediente">
                                            <i class="bi bi-clock-history"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="card-footer bg-transparent border-top-0 text-body-secondary small">
                    {{ alumnosFiltrados.length }} de {{ alumnos.length }} alumnos
                </div>
            </div>

            <!-- Modal Editar -->
            <div class="modal fade" id="modalEditarAlumno" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content border-0 shadow bg-body-tertiary" v-if="editando">
                        <div class="modal-header bg-primary bg-opacity-75">
                            <h5 class="modal-title text-white"><i class="bi bi-pencil me-2"></i>Editar Alumno</h5>
                            <button class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row g-3">
                                <!-- Foto en Modal -->
                                <div class="col-12 text-center mb-2">
                                    <div class="position-relative d-inline-block">
                                        <img :src="editando.foto || 'https://via.placeholder.com/100?text=Foto'"
                                             class="rounded-circle border"
                                             style="width:100px; height:100px; object-fit: cover;">
                                        <label class="position-absolute bottom-0 end-0 bg-body border rounded-circle p-1 shadow-sm"
                                               style="cursor:pointer;" title="Cambiar foto">
                                            <i class="bi bi-camera-fill text-body small"></i>
                                            <input type="file" class="d-none" accept="image/*" @change="seleccionarFoto">
                                        </label>
                                    </div>
                                </div>

                                <div class="col-6">
                                    <label class="form-label small fw-semibold text-body-secondary text-uppercase">Carnet (Inmutable)</label>
                                    <input :value="editando.carnet" class="form-control form-control-sm bg-body-secondary" readonly>
                                </div>
                                <div class="col-6">
                                    <label class="form-label small fw-semibold text-body-secondary text-uppercase">Sexo</label>
                                    <select v-model="editando.sexo" class="form-select form-select-sm bg-transparent">
                                        <option value="Masculino">Masculino</option>
                                        <option value="Femenino">Femenino</option>
                                    </select>
                                </div>
                                <div class="col-12">
                                    <label class="form-label small fw-semibold text-body-secondary text-uppercase">Carrera</label>
                                    <select v-model="editando.carrera" class="form-select form-select-sm bg-transparent">
                                        <option value="">— Sin carrera asignada —</option>
                                        <option v-for="c in carreras" :key="c.idCarrera" :value="c.nombre">{{ c.nombre }}</option>
                                    </select>
                                </div>
                                <div class="col-12">
                                    <label class="form-label small fw-semibold text-body-secondary text-uppercase">Nombre completo *</label>
                                    <input v-model="editando.nombre" class="form-control form-control-sm bg-transparent" required>
                                </div>
                                <div class="col-12">
                                    <label class="form-label small fw-semibold text-body-secondary text-uppercase">Dirección</label>
                                    <input v-model="editando.direccion" class="form-control form-control-sm bg-transparent">
                                </div>
                                <div class="col-6">
                                    <label class="form-label small fw-semibold text-body-secondary text-uppercase">Email</label>
                                    <input v-model="editando.email" type="email" class="form-control form-control-sm bg-transparent">
                                </div>
                                <div class="col-6">
                                    <label class="form-label small fw-semibold text-body-secondary text-uppercase">Teléfono</label>
                                    <input v-model="editando.telefono" class="form-control form-control-sm bg-transparent">
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer border-top-0">
                            <button class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Cancelar</button>
                            <button class="btn btn-sm text-white fw-semibold" style="background-color:#1a3a5c;"
                                    @click="guardarEdicion" :disabled="guardandoEdit">
                                <span v-if="guardandoEdit" class="spinner-border spinner-border-sm me-1"></span>
                                <i v-else class="bi bi-save me-1"></i>Guardar cambios
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Modal Historial -->
            <div class="modal fade" id="modalHistorialAlumno" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content border-0 shadow bg-body-tertiary" v-if="alumnoDetalle">
                        <div class="modal-header bg-primary bg-opacity-75">
                            <h5 class="modal-title text-white">
                                <i class="bi bi-clock-history me-2"></i>Historial — {{ alumnoDetalle.nombre }}
                            </h5>
                            <button class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <h6 class="fw-semibold text-body-secondary text-uppercase small mb-2">Matrículas</h6>
                            <div v-if="histMatriculas.length===0" class="text-body-secondary small mb-3">Sin matrículas registradas.</div>
                            <table v-else class="table table-sm small mb-3">
                                <thead class="bg-body-secondary text-body-secondary"><tr><th>Código</th><th>Ciclo</th><th>Estado</th></tr></thead>
                                <tbody>
                                    <tr v-for="m in histMatriculas" :key="m.idMatricula">
                                        <td>{{ m.codigo }}</td>
                                        <td>{{ m.ciclo || m.año || '—' }}</td>
                                        <td>
                                            <span class="badge" :class="m.estado==='Activo'?'bg-success':'bg-secondary'">
                                                {{ m.estado || 'Activo' }}
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            <h6 class="fw-semibold text-body-secondary text-uppercase small mb-2">Materias inscritas</h6>
                            <div v-if="histInscripciones.length===0" class="text-body-secondary small">Sin inscripciones registradas.</div>
                            <div v-else class="d-flex flex-wrap gap-2">
                                <span v-for="i in histInscripciones" :key="i.idInscripcion"
                                      class="badge bg-primary fw-normal px-3 py-2 shadow-sm">
                                    <i class="bi bi-book me-1"></i>{{ i.materia }}
                                </span>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Cerrar</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Modal Nuevo Alumno -->
            <div class="modal fade" id="modalNuevoAlumno" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content border-0 shadow bg-body-tertiary">
                        <div class="modal-header bg-success bg-opacity-75">
                            <h5 class="modal-title text-white"><i class="bi bi-person-plus me-2"></i>Nuevo Registro Alumno</h5>
                            <button class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row g-3">
                                <div class="col-12 text-center py-2 px-3 mb-2 bg-info bg-opacity-10 border border-info rounded">
                                    <small class="text-info-emphasis"><i class="bi bi-info-circle me-1"></i>El carnet se generará automáticamente tras guardar.</small>
                                </div>
                                <div class="col-12">
                                    <label class="form-label small fw-bold text-uppercase text-body-secondary">Nombre Completo *</label>
                                    <input v-model="nuevoAlumno.nombre" class="form-control form-control-sm bg-transparent" placeholder="Juan Pérez" required>
                                </div>
                                <div class="col-6">
                                    <label class="form-label small fw-bold text-uppercase text-body-secondary">Usuario *</label>
                                    <input v-model="nuevoAlumno.username" class="form-control form-control-sm bg-transparent" placeholder="juan.perez" required>
                                </div>
                                <div class="col-6">
                                    <label class="form-label small fw-bold text-uppercase text-body-secondary">Fecha Nacimiento *</label>
                                    <input v-model="nuevoAlumno.fechaNacimiento" type="date" class="form-control form-control-sm bg-transparent" required>
                                </div>
                                <div class="col-12">
                                    <label class="form-label small fw-bold text-uppercase text-body-secondary">Email *</label>
                                    <input v-model="nuevoAlumno.email" type="email" class="form-control form-control-sm bg-transparent" placeholder="juan@uni.edu" required>
                                </div>
                                <div class="col-6">
                                    <label class="form-label small fw-bold text-uppercase text-body-secondary">Género</label>
                                    <select v-model="nuevoAlumno.sexo" class="form-select form-select-sm bg-transparent">
                                        <option value="Masculino">Masculino</option>
                                        <option value="Femenino">Femenino</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer border-top-0">
                            <button class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Cancelar</button>
                            <button class="btn btn-success btn-sm fw-bold px-3" @click="guardarNuevo" :disabled="guardandoNuevo">
                                <span v-if="guardandoNuevo" class="spinner-border spinner-border-sm me-1"></span>
                                <i v-else class="bi bi-check-lg me-1"></i>Registrar y Generar Carnet
                            </button>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    `
};