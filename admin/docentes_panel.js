// =============================================
// ADMIN — Gestión de Docentes
// =============================================

const docentesAdmin = {
    data() {
        return {
            docentes: [],
            filtro: '',
            cargando: false,
            editando: null,
            guardandoEdit: false,
            guardandoNuevo: false,
            nuevoDocente: {
                nombre: '',
                email: '',
                username: '',
                fechaNacimiento: '',
                especialidad: '',
                escalafon: '',
                sexo: 'Masculino'
            },
            docenteDetalle: null,
            materiasDocente: []
        };
    },
    async mounted() { await this.cargar(); },
    computed: {
        docentesFiltrados() {
            const f = this.filtro.toLowerCase().trim();
            if (!f) return this.docentes;
            return this.docentes.filter(d =>
                (d.nombre      || '').toLowerCase().includes(f) ||
                (d.carnet      || '').toLowerCase().includes(f) ||
                (d.especialidad|| '').toLowerCase().includes(f)
            );
        }
    },
    methods: {
        async cargar() {
            this.cargando = true;
            try {
                const docRaw = await db.docentes.toArray();
                
                // Join con perfiles (v11+)
                const ids = docRaw.map(d => d.usuarioId).filter(id => id);
                const perfs = await db.perfiles.where('usuarioId').anyOf(ids).toArray();
                const perfsMap = perfs.reduce((acc, p) => { acc[p.usuarioId] = p; return acc; }, {});

                this.docentes = docRaw.map(d => ({
                    ...d,
                    nombre: perfsMap[d.usuarioId]?.nombre || '— Sin nombre —',
                    sexo:   perfsMap[d.usuarioId]?.sexo   || 'Masculino',
                    foto:   perfsMap[d.usuarioId]?.foto   || '',
                    email:  perfsMap[d.usuarioId]?.email  || '',
                    telefono: perfsMap[d.usuarioId]?.telefono || ''
                })).sort((a,b) => a.nombre.localeCompare(b.nombre));

            } catch (e) {
                console.error('Error al cargar docentes:', e);
                alertify.error('Error al cargar datos relacionales.');
            } finally {
                this.cargando = false;
            }
        },
        estado(d) { return d.estado || 'activo'; },
        async eliminar(docente) {
            alertify.confirm(
                'Eliminar Docente Definitivamente',
                `¿Estás seguro de ELIMINAR a <b>${docente.nombre}</b>?<br>Se borrarán su usuario y datos. Las materias asignadas quedarán sin docente.`,
                async () => {
                    try {
                        // 1. Desasignar materias
                        const materiasAsignadas = await db.materias.where('docenteId').equals(String(docente.idDocente)).toArray();
                        for (const m of materiasAsignadas) {
                            await db.materias.update(m.idMateria, { docenteId: '' });
                        }
                        
                        // 2. Eliminar usuario asociado (si existe)
                        if (docente.usuarioId) {
                            await db.usuarios.delete(docente.usuarioId);
                            // También eliminar el perfil
                            const p = await db.perfiles.where('usuarioId').equals(docente.usuarioId).first();
                            if (p) await db.perfiles.delete(p.id);
                        }

                        // 3. Eliminar docente
                        await db.docentes.delete(docente.idDocente);
                        
                        alertify.success('Docente eliminado y materias desasignadas.');
                        await this.cargar();
                    } catch(e) {
                        alertify.error('Error al eliminar: ' + e.message);
                    }
                },
                () => {}
            ).set('labels', { ok: 'Sí, ELIMINAR', cancel: 'Cancelar' });
        },
        async toggleEstado(docente) {
            const nuevo = this.estado(docente) === 'activo' ? 'inactivo' : 'activo';
            await db.docentes.update(docente.idDocente, { estado: nuevo });
            docente.estado = nuevo;
            alertify.success(`Docente ${nuevo === 'activo' ? 'activado' : 'desactivado'}.`);
        },
        abrirEditar(docente) {
            this.editando = { ...docente, foto: docente.foto || '' };
            this.abrirModal('modalEditarDocente');
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
            await db.docentes.update(this.editando.idDocente, {
                nombre: this.editando.nombre,
                especialidad: this.editando.especialidad || '',
                sexo: this.editando.sexo || 'Masculino',
                email: this.editando.email || '',
                telefono: this.editando.telefono || '',
                escalafon: this.editando.escalafon || '',
                foto: this.editando.foto
            });
            // Sincronizar nombre en usuario si existe
            if (this.editando.usuarioId) {
                await db.usuarios.update(this.editando.usuarioId, { username: this.editando.nombre });
            }
            await this.cargar();
            this.cerrarModal('modalEditarDocente');
            this.guardandoEdit = false;
            alertify.success('Docente actualizado.');
        },
        async verMaterias(docente) {
            this.docenteDetalle = docente;
            const todas = await db.materias.toArray();
            this.materiasDocente = todas.filter(m =>
                String(m.docenteId) === String(docente.idDocente) ||
                (m.docente || '').toLowerCase() === docente.nombre.toLowerCase()
            );
            this.abrirModal('modalMateriasDocente');
        },
        // --- NUEVO REGISTRO ---
        abrirNuevo() {
            this.nuevoDocente = { nombre:'', email:'', username:'', fechaNacimiento:'', especialidad:'', escalafon:'', sexo:'Masculino' };
            this.abrirModal('modalNuevoDocente');
        },
        async hashPassword(pwd) {
            const data = new TextEncoder().encode(pwd);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            return Array.from(new Uint8Array(hashBuffer))
                .map(b => b.toString(16).padStart(2, '0')).join('');
        },
        async guardarNuevo() {
            const n = this.nuevoDocente;
            if (!n.nombre || !n.email || !n.username || !n.fechaNacimiento) {
                alertify.error('Completa los campos obligatorios.');
                return;
            }
            this.guardandoNuevo = true;
            try {
                // 1. Generar Carnet DOC-AÑO-CORRELATIVO(3)
                const año = new Date().getFullYear();
                const prefijo = `DOC-${año}-`;
                const docentesAño = await db.docentes.filter(d => d.carnet && d.carnet.startsWith(prefijo)).toArray();
                let ultimoNum = 0;
                docentesAño.forEach(d => {
                    const num = parseInt(d.carnet.split('-')[2]);
                    if (num > ultimoNum) ultimoNum = num;
                });
                const nuevoCarnet = `${prefijo}${(ultimoNum + 1).toString().padStart(3, '0')}`;

                // 2. Transacción (Corregido: array de tablas)
                // La contraseña inicial es la fecha de nacimiento (YYYY-MM-DD)
                const hashPwd = await this.hashPassword(n.fechaNacimiento);
                await db.transaction('rw', [db.usuarios, db.docentes, db.perfiles], async () => {
                    const usuarioId = await db.usuarios.add({
                        username: n.username, email: n.email, hashPwd, rol: 'Docente', carnet: nuevoCarnet, estado: 'pendiente_activacion'
                    });
                    await db.perfiles.add({
                        usuarioId, nombre: n.nombre, sexo: n.sexo, email: n.email, foto: '',
                        fechaNacimiento: n.fechaNacimiento
                    });
                    await db.docentes.add({
                        carnet: nuevoCarnet, usuarioId, especialidad: n.especialidad, escalafon: n.escalafon,
                        añoIngreso: año, estado: 'inactivo'
                    });
                });

                alertify.success(`Docente pre-registrado. Carnet: ${nuevoCarnet}. En espera de activación.`);
                this.cerrarModal('modalNuevoDocente');
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
                <i class="bi bi-person-workspace me-2 fs-5 text-secondary"></i>
                <h5 class="mb-0 fw-semibold">Gestión de Docentes</h5>
                <button class="btn btn-sm btn-success ms-3 shadow-sm" @click="abrirNuevo">
                    <i class="bi bi-person-plus-fill me-1"></i> Registrar Docente
                </button>
                <button class="btn btn-sm btn-outline-secondary ms-auto" @click="cargar">
                    <i class="bi bi-arrow-clockwise"></i>
                </button>
            </div>

            <div class="mb-3" style="max-width:400px;">
                <div class="input-group shadow-sm">
                    <span class="input-group-text bg-body-secondary border-end-0"><i class="bi bi-search text-body-secondary"></i></span>
                    <input v-model="filtro" type="text" class="form-control border-start-0 bg-transparent"
                           placeholder="Buscar por nombre, código o especialidad...">
                    <button v-if="filtro" class="btn btn-outline-secondary" @click="filtro=''">
                        <i class="bi bi-x"></i>
                    </button>
                </div>
            </div>

            <div v-if="cargando" class="text-center py-4"><div class="spinner-border text-secondary"></div></div>
            <div v-else-if="docentes.length===0" class="text-center py-5 text-muted">
                <i class="bi bi-person-workspace fs-1 opacity-25"></i>
                <p class="mt-2">No hay docentes registrados.</p>
            </div>
            <div v-else class="card border-0 shadow-sm bg-body-tertiary">
                <div class="table-responsive">
                    <table class="table table-hover align-middle mb-0 small">
                        <thead class="bg-body-secondary">
                            <tr>
                                <th style="width:50px;" class="text-body-secondary">Foto</th>
                                <th class="text-body-secondary">Carnet</th>
                                <th class="text-body-secondary">Nombre</th>
                                <th class="text-body-secondary">Sexo</th>
                                <th class="text-body-secondary">Especialidad</th>
                                <th class="text-body-secondary">Escalafón</th>
                                <th class="text-body-secondary">Estado</th>
                                <th class="text-end text-body-secondary">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="d in docentesFiltrados" :key="d.idDocente"
                                :class="estado(d)==='inactivo' ? 'table-light text-muted' : ''">
                                <td>
                                    <img :src="d.foto || 'https://via.placeholder.com/40?text=D'"
                                         class="rounded-circle border"
                                         style="width:36px; height:36px; object-fit: cover;">
                                </td>
                                <td class="fw-semibold font-monospace small">{{ d.carnet }}</td>
                                <td>{{ d.nombre }}</td>
                                <td>
                                    <small :class="d.sexo === 'Masculino' ? 'text-primary' : 'text-danger'">
                                        <i :class="d.sexo === 'Masculino' ? 'bi bi-gender-male' : 'bi bi-gender-female'"></i>
                                        {{ d.sexo }}
                                    </small>
                                </td>
                                <td>{{ d.especialidad || '—' }}</td>
                                <td><span class="badge bg-body-secondary text-body-secondary border border-secondary-subtle">{{ d.escalafon || '—' }}</span></td>
                                <td>
                                    <span class="badge" :class="estado(d)==='activo' ? 'bg-success' : 'bg-secondary'">
                                        {{ estado(d)==='activo' ? 'Activo' : 'Inactivo' }}
                                    </span>
                                </td>
                                <td class="text-end">
                                    <div class="d-flex gap-1 justify-content-end">
                                        <button class="btn btn-sm btn-outline-primary" @click="abrirEditar(d)" title="Editar">
                                            <i class="bi bi-pencil"></i>
                                        </button>
                                        <button class="btn btn-sm" @click="toggleEstado(d)" title="Cambiar estado"
                                                :class="estado(d)==='activo' ? 'btn-outline-warning' : 'btn-outline-success'">
                                            <i :class="estado(d)==='activo' ? 'bi bi-person-slash' : 'bi bi-person-check'"></i>
                                        </button>
                                        <button class="btn btn-sm btn-outline-danger" @click="eliminar(d)" title="Eliminar definitivamente">
                                            <i class="bi bi-trash"></i>
                                        </button>
                                        <button class="btn btn-sm btn-outline-info" @click="verMaterias(d)" title="Ver materias">
                                            <i class="bi bi-book"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="card-footer bg-transparent border-top-0 text-body-secondary small">
                    {{ docentesFiltrados.length }} de {{ docentes.length }} docentes
                </div>
            </div>

            <!-- Modal Editar -->
            <div class="modal fade" id="modalEditarDocente" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content border-0 shadow bg-body-tertiary" v-if="editando">
                        <div class="modal-header bg-primary bg-opacity-75">
                            <h5 class="modal-title text-white"><i class="bi bi-pencil me-2"></i>Editar Docente</h5>
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
                                    <label class="form-label small fw-semibold text-body-secondary text-uppercase">Especialidad</label>
                                    <input v-model="editando.especialidad" class="form-control form-control-sm bg-transparent" placeholder="Ej. Matemáticas">
                                </div>
                                <div class="col-12">
                                    <label class="form-label small fw-semibold text-body-secondary text-uppercase">Nombre completo *</label>
                                    <input v-model="editando.nombre" class="form-control form-control-sm bg-transparent" required>
                                </div>
                                <div class="col-6">
                                    <label class="form-label small fw-semibold text-body-secondary text-uppercase">Email</label>
                                    <input v-model="editando.email" type="email" class="form-control form-control-sm bg-transparent">
                                </div>
                                <div class="col-6">
                                    <label class="form-label small fw-semibold text-body-secondary text-uppercase">Teléfono</label>
                                    <input v-model="editando.telefono" class="form-control form-control-sm bg-transparent">
                                </div>
                                <div class="col-6">
                                    <label class="form-label small fw-semibold text-body-secondary text-uppercase">Escalafón</label>
                                    <select v-model="editando.escalafon" class="form-select form-select-sm bg-transparent">
                                        <option value="">— Seleccionar —</option>
                                        <option value="tecnico">Técnico</option>
                                        <option value="profesor">Profesor</option>
                                        <option value="ingeniero">Licenciado / Ingeniero</option>
                                        <option value="maestria">Maestría</option>
                                        <option value="doctor">Doctor</option>
                                    </select>
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

            <!-- Modal Materias del Docente -->
            <div class="modal fade" id="modalMateriasDocente" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content border-0 shadow bg-body-tertiary" v-if="docenteDetalle">
                        <div class="modal-header bg-primary bg-opacity-75">
                            <h5 class="modal-title text-white">
                                <i class="bi bi-book me-2"></i>Materias — {{ docenteDetalle.nombre }}
                            </h5>
                            <button class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div v-if="materiasDocente.length===0" class="text-body-secondary text-center py-3">
                                <i class="bi bi-book fs-2 opacity-25"></i>
                                <p class="mt-2 small">Este docente no tiene materias asignadas.</p>
                            </div>
                            <ul v-else class="list-group list-group-flush">
                                <li v-for="m in materiasDocente" :key="m.idMateria"
                                    class="list-group-item d-flex justify-content-between align-items-center">
                                    <div>
                                        <div class="fw-semibold text-body">{{ m.nombre }}</div>
                                        <div class="text-body-secondary small">{{ m.codigo }}</div>
                                    </div>
                                    <span class="badge" :class="(m.estado||'habilitada')==='habilitada'?'bg-success':'bg-secondary'">
                                        {{ (m.estado||'habilitada')==='habilitada' ? 'Habilitada' : 'Deshabilitada' }}
                                    </span>
                                </li>
                            </ul>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Cerrar</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Modal Nuevo Docente -->
            <div class="modal fade" id="modalNuevoDocente" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content border-0 shadow bg-body-tertiary">
                        <div class="modal-header bg-success bg-opacity-75">
                            <h5 class="modal-title text-white"><i class="bi bi-person-plus me-2"></i>Nuevo Registro Docente</h5>
                            <button class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row g-3">
                                <div class="col-12 text-center py-2 px-3 mb-2 bg-info bg-opacity-10 border border-info rounded">
                                    <small class="text-info-emphasis"><i class="bi bi-info-circle me-1"></i>El carnet se generará automáticamente tras guardar.</small>
                                </div>
                                <div class="col-12">
                                    <label class="form-label small fw-bold text-uppercase text-body-secondary">Nombre Completo *</label>
                                    <input v-model="nuevoDocente.nombre" class="form-control form-control-sm bg-transparent" placeholder="Lic. María López" required>
                                </div>
                                <div class="col-6">
                                    <label class="form-label small fw-bold text-uppercase text-body-secondary">Usuario *</label>
                                    <input v-model="nuevoDocente.username" class="form-control form-control-sm bg-transparent" placeholder="maria.lopez" required>
                                </div>
                                <div class="col-6">
                                    <label class="form-label small fw-bold text-uppercase text-body-secondary">Fecha Nacimiento *</label>
                                    <input v-model="nuevoDocente.fechaNacimiento" type="date" class="form-control form-control-sm bg-transparent" required>
                                </div>
                                <div class="col-12">
                                    <label class="form-label small fw-bold text-uppercase text-body-secondary">Email *</label>
                                    <input v-model="nuevoDocente.email" type="email" class="form-control form-control-sm bg-transparent" placeholder="maria@uni.edu" required>
                                </div>
                                <div class="col-6">
                                    <label class="form-label small fw-bold text-uppercase text-body-secondary">Género</label>
                                    <select v-model="nuevoDocente.sexo" class="form-select form-select-sm bg-transparent">
                                        <option value="Masculino">Masculino</option>
                                        <option value="Femenino">Femenino</option>
                                    </select>
                                </div>
                                <div class="col-6">
                                    <label class="form-label small fw-bold text-uppercase text-body-secondary">Escalafón</label>
                                    <select v-model="nuevoDocente.escalafon" class="form-select form-select-sm bg-transparent">
                                        <option value="">— Seleccionar —</option>
                                        <option value="tecnico">Técnico</option>
                                        <option value="profesor">Profesor</option>
                                        <option value="ingeniero">Licenciado / Ingeniero</option>
                                        <option value="maestria">Maestría</option>
                                        <option value="doctor">Doctor</option>
                                    </select>
                                </div>
                                <div class="col-12">
                                    <label class="form-label small fw-bold text-uppercase text-body-secondary">Especialidad</label>
                                    <input v-model="nuevoDocente.especialidad" class="form-control form-control-sm bg-transparent" placeholder="Ej. Inteligencia Artificial">
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer border-top-0">
                            <button class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Cancelar</button>
                            <button class="btn btn-success btn-sm fw-bold px-3" @click="guardarNuevo" :disabled="guardandoNuevo">
                                <span v-if="guardandoNuevo" class="spinner-border spinner-border-sm me-1"></span>
                                <i v-else class="bi bi-check-lg me-1"></i>Registrar Docente
                            </button>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    `
};