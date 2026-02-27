// =============================================
// Mi Perfil — Portal Alumno
// =============================================
const miPerfil = {
    data() {
        return {
            cargando: true,
            guardando: false,
            // Datos del perfil
            perfil: { nombre: '', email: '', telefono: '', direccion: '', carnet: '', carrera: '', sexo: 'Masculino', foto: '' },
            imagenRecortar: '',
            cropper: null,
            // Cambio de contraseña
            pwd: { actual: '', nueva: '', confirmar: '', mostrarActual: false, mostrarNueva: false },
            cambiandoPwd: false,
            // Usuarios record id
            _userId: null,
            _alumnoId: null,
        };
    },
    async mounted() {
        await this.cargar();
    },
    methods: {
        async hashPassword(pwd) {
            const data = new TextEncoder().encode(pwd);
            const buf  = await crypto.subtle.digest('SHA-256', data);
            return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
        },
        async cargar() {
            this.cargando = true;
            try {
                const s = JSON.parse(sessionStorage.getItem('sesionUniversidad') || '{}');
                const userId = s.id;
                const rol = s.rol;

                if (!userId) {
                    alertify.error('Sesión no válida.');
                    return;
                }

                // 1. Cargar datos básicos de cuenta
                const usuario = await db.usuarios.get(userId);
                if (usuario) {
                    this._userId = usuario.id;
                    this.perfil.email = usuario.email || '';
                }

                // 2. Cargar perfil personal (Relación 1:1 con usuario)
                const perfil = await db.perfiles.where('usuarioId').equals(userId).first();
                if (perfil) {
                    this.perfil.nombre = perfil.nombre || '';
                    this.perfil.sexo = perfil.sexo || 'Masculino';
                    this.perfil.foto = perfil.foto || '';
                    this.perfil.telefono = perfil.telefono || '';
                    this.perfil.direccion = perfil.direccion || '';
                }

                // 3. Cargar expediente académico según rol
                let expediente = null;
                if (rol === 'Alumno') {
                    expediente = await db.alumnos.where('usuarioId').equals(userId).first();
                    if (expediente) {
                        this._expedienteId = expediente.idAlumno;
                        this.perfil.carnet = expediente.carnet || '';
                        // Cargar carrera si existe
                        const carrera = await db.carreras.get(expediente.carreraId);
                        this.perfil.carrera = carrera ? carrera.nombre : 'Sin carrera';
                    }
                } else if (rol === 'Docente') {
                    expediente = await db.docentes.where('usuarioId').equals(userId).first();
                    if (expediente) {
                        this._expedienteId = expediente.idDocente;
                        this.perfil.carnet = expediente.carnet || '';
                        this.perfil.carrera = 'Personal Docente';
                    }
                }
            } catch (e) {
                console.error(e);
                alertify.error('Error al cargar perfil.');
            } finally {
                this.cargando = false;
            }
        },
        seleccionarFoto(event) {
            const file = event.target.files[0];
            if (!file) return;
            if (file.size > 2 * 1024 * 1024) { // 2MB limit for upload (before crop)
                alertify.error('La imagen es muy pesada (máx 2MB).');
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                this.imagenRecortar = e.target.result;
                this.abrirModalRecorte();
            };
            reader.readAsDataURL(file);
            event.target.value = ''; // Reset input
        },
        abrirModalRecorte() {
            const modalEl = document.getElementById('modalRecorteFoto');
            const modal = new bootstrap.Modal(modalEl);
            modal.show();
            
            // Init Cropper
            const image = document.getElementById('img-recortar');
            if (this.cropper) { this.cropper.destroy(); }
            
            modalEl.addEventListener('shown.bs.modal', () => {
                this.cropper = new Cropper(image, {
                    aspectRatio: 1,
                    viewMode: 1,
                    autoCropArea: 1,
                });
            }, { once: true });
        },
        async guardarFotoRecortada() {
            if (!this.cropper) return;
            
            const canvas = this.cropper.getCroppedCanvas({ width: 300, height: 300, fillColor: '#fff' });
            const fotoBase64 = canvas.toDataURL('image/jpeg', 0.85);
            this.perfil.foto = fotoBase64;
            
            try {
                const p = await db.perfiles.where('usuarioId').equals(this._userId).first();
                if (p) {
                    await db.perfiles.update(p.id, { foto: fotoBase64 });
                    this.$emit('foto-cambiada', fotoBase64);
                    alertify.success('Foto de perfil actualizada.');
                    bootstrap.Modal.getInstance(document.getElementById('modalRecorteFoto')).hide();
                } else {
                    alertify.error('No se encontró el perfil para guardar la foto.');
                }
            } catch (e) {
                alertify.error('Error al guardar foto: ' + e.message);
            }
        },
        async guardar() {
            if (!this.perfil.nombre.trim()) { alertify.error('El nombre es obligatorio.'); return; }
            this.guardando = true;
            try {
                await db.transaction('rw', [db.usuarios, db.perfiles], async () => {
                    // 1. Actualizar Usuario (Email)
                    await db.usuarios.update(this._userId, { email: this.perfil.email.trim() });

                    // 2. Actualizar Perfil Personal
                    let p = await db.perfiles.where('usuarioId').equals(this._userId).first();
                    const datosPerfil = {
                        usuarioId: this._userId, // Asegurar vínculo
                        nombre: this.perfil.nombre.trim(),
                        telefono: this.perfil.telefono.trim(),
                        direccion: this.perfil.direccion.trim(),
                        sexo: this.perfil.sexo,
                        foto: this.perfil.foto
                    };
                    if (p) await db.perfiles.update(p.id, datosPerfil);
                    else await db.perfiles.add(datosPerfil);
                });

                // Actualizar UI del Navbar (Nombre si cambió)
                const s = JSON.parse(sessionStorage.getItem('sesionUniversidad') || '{}');
                s.nombre = this.perfil.nombre.trim();
                sessionStorage.setItem('sesionUniversidad', JSON.stringify(s));
                this.$emit('perfil-actualizado', s.nombre);

                alertify.success('✅ Perfil actualizado correctamente.');
            } catch(e) {
                alertify.error('Error al guardar: ' + e.message);
            } finally {
                this.guardando = false;
            }
        },
        async cambiarPassword() {
            if (!this.pwd.actual) { alertify.error('Ingresa tu contraseña actual.'); return; }
            if (this.pwd.nueva.length < 6) { alertify.error('La nueva contraseña debe tener al menos 6 caracteres.'); return; }
            if (this.pwd.nueva !== this.pwd.confirmar) { alertify.error('Las contraseñas no coinciden.'); return; }
            this.cambiandoPwd = true;
            try {
                const usuario = await db.usuarios.get(this._userId);
                const hashActual = await this.hashPassword(this.pwd.actual);
                if (!usuario || usuario.hashPwd !== hashActual) {
                    alertify.error('La contraseña actual es incorrecta.'); return;
                }
                const hashNueva = await this.hashPassword(this.pwd.nueva);
                await db.usuarios.update(this._userId, { hashPwd: hashNueva });
                this.pwd = { actual: '', nueva: '', confirmar: '', mostrarActual: false, mostrarNueva: false };
                alertify.success('🔑 Contraseña actualizada correctamente.');
            } catch(e) {
                alertify.error('Error: ' + e.message);
            } finally {
                this.cambiandoPwd = false;
            }
        }
    },
    template: `
    <div>
        <div class="d-flex align-items-center mb-3 border-bottom pb-2">
            <i class="bi bi-person-circle me-2 fs-5 text-body-secondary"></i>
            <h5 class="mb-0 fw-semibold text-body">Mi Perfil</h5>
        </div>

        <div v-if="cargando" class="text-center py-5"><div class="spinner-border text-secondary"></div></div>
        <div v-else class="row g-4">

            <!-- Datos personales -->
            <div class="col-lg-7">
                <div class="card border-0 shadow-sm bg-body-tertiary">
                    <div class="card-header bg-transparent fw-bold border-bottom py-3">
                        <i class="bi bi-person me-2 text-primary"></i>Datos Personales
                    </div>
                    <div class="card-body">
                        <div class="row g-3">
                            <!-- FOTO DE PERFIL -->
                            <div class="col-12 text-center mb-3">
                                <div class="position-relative d-inline-block">
                                    <img :src="perfil.foto || 'https://via.placeholder.com/150?text=Foto'"
                                         class="rounded-circle border border-2 border-primary-subtle"
                                         style="width:120px; height:120px; object-fit: cover;">
                                    <label class="position-absolute bottom-0 end-0 bg-body shadow-sm border rounded-circle p-2"
                                           style="cursor:pointer; width:38px; height:38px; display:flex; align-items:center; justify-content:center;" title="Cambiar foto">
                                        <i class="bi bi-camera-fill text-primary"></i>
                                        <input type="file" class="d-none" accept="image/*" @change="seleccionarFoto">
                                    </label>
                                </div>
                            </div>

                            <div class="col-sm-6">
                                <label class="form-label small fw-bold text-body-secondary text-uppercase">Carnet Institucional</label>
                                <div class="form-control form-control-sm bg-body-secondary border-secondary-subtle font-monospace text-primary fw-bold">
                                    {{ perfil.carnet }}
                                </div>
                                <div class="form-text text-body-secondary">Identificador único inmutable.</div>
                            </div>
                            <div class="col-sm-6">
                                <label class="form-label small fw-bold text-body-secondary text-uppercase">Carrera</label>
                                <input :value="perfil.carrera || '—'" class="form-control form-control-sm bg-body-secondary border-secondary-subtle" readonly>
                                <div class="form-text text-body-secondary">Asignada por el administrador.</div>
                            </div>
                            <div class="col-sm-6">
                                <label class="form-label small fw-bold text-body-secondary text-uppercase">Sexo</label>
                                <select v-model="perfil.sexo" class="form-select form-select-sm bg-transparent">
                                    <option value="Masculino">Masculino</option>
                                    <option value="Femenino">Femenino</option>
                                </select>
                            </div>
                            <div class="col-sm-6">
                                <!-- Espaciador o campo adicional futuro -->
                            </div>
                            <div class="col-12">
                                <label class="form-label small fw-bold text-body-secondary text-uppercase">Nombre completo *</label>
                                <input v-model="perfil.nombre" class="form-control form-control-sm bg-transparent" placeholder="Tu nombre completo">
                            </div>
                            <div class="col-sm-6">
                                <label class="form-label small fw-bold text-body-secondary text-uppercase">Correo electrónico</label>
                                <input v-model="perfil.email" type="email" class="form-control form-control-sm bg-transparent" placeholder="correo@ejemplo.com">
                            </div>
                            <div class="col-sm-6">
                                <label class="form-label small fw-bold text-body-secondary text-uppercase">Teléfono</label>
                                <input v-model="perfil.telefono" class="form-control form-control-sm bg-transparent" placeholder="7777-1234">
                            </div>
                            <div class="col-12">
                                <label class="form-label small fw-bold text-body-secondary text-uppercase">Dirección</label>
                                <input v-model="perfil.direccion" class="form-control form-control-sm bg-transparent" placeholder="Calle, ciudad, departamento">
                            </div>
                            <div class="col-12 text-end">
                                <button class="btn btn-sm text-white fw-semibold px-4" style="background-color:#1a3a5c;"
                                        @click="guardar" :disabled="guardando">
                                    <span v-if="guardando" class="spinner-border spinner-border-sm me-1"></span>
                                    <i v-else class="bi bi-save me-1"></i>Guardar cambios
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Cambiar contraseña -->
            <div class="col-lg-5">
                <div class="card border-0 shadow-sm bg-body-tertiary">
                    <div class="card-header bg-transparent fw-bold border-bottom py-3">
                        <i class="bi bi-lock me-2 text-warning"></i>Cambiar Contraseña
                    </div>
                    <div class="card-body">
                        <div class="row g-3">
                            <div class="col-12">
                                <label class="form-label small fw-bold text-body-secondary text-uppercase">Contraseña actual</label>
                                <div class="input-group input-group-sm">
                                    <input v-model="pwd.actual" :type="pwd.mostrarActual?'text':'password'" class="form-control bg-transparent" placeholder="••••••">
                                    <button class="btn btn-outline-secondary" @click="pwd.mostrarActual=!pwd.mostrarActual">
                                        <i :class="pwd.mostrarActual?'bi bi-eye-slash':'bi bi-eye'"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="col-12">
                                <label class="form-label small fw-bold text-body-secondary text-uppercase">Nueva contraseña</label>
                                <div class="input-group input-group-sm">
                                    <input v-model="pwd.nueva" :type="pwd.mostrarNueva?'text':'password'" class="form-control bg-transparent" placeholder="Mín. 6 caracteres">
                                    <button class="btn btn-outline-secondary" @click="pwd.mostrarNueva=!pwd.mostrarNueva">
                                        <i :class="pwd.mostrarNueva?'bi bi-eye-slash':'bi bi-eye'"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="col-12">
                                <label class="form-label small fw-bold text-body-secondary text-uppercase">Confirmar nueva contraseña</label>
                                <input v-model="pwd.confirmar" type="password" class="form-control form-control-sm bg-transparent" placeholder="Repite la nueva contraseña">
                                <div v-if="pwd.confirmar && pwd.nueva !== pwd.confirmar" class="form-text text-danger">
                                    Las contraseñas no coinciden.
                                </div>
                            </div>
                            <div class="col-12 text-end">
                                <button class="btn btn-sm btn-outline-warning fw-semibold px-4"
                                        @click="cambiarPassword" :disabled="cambiandoPwd">
                                    <span v-if="cambiandoPwd" class="spinner-border spinner-border-sm me-1"></span>
                                    <i v-else class="bi bi-key me-1"></i>Cambiar contraseña
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
        </div>
            
            <!-- Modal Recorte -->
            <div class="modal fade" id="modalRecorteFoto" tabindex="-1" data-bs-backdrop="static">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content bg-body-tertiary border-0 shadow-lg">
                        <div class="modal-header border-bottom py-3">
                            <h5 class="modal-title fw-bold text-primary"><i class="bi bi-crop me-2"></i>Ajustar Foto</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body p-0 bg-dark text-center" style="max-height:500px; overflow:hidden;">
                            <img id="img-recortar" :src="imagenRecortar" style="max-width:100%; max-height: 500px; display:block;">
                        </div>
                        <div class="modal-footer border-top-0">
                            <button type="button" class="btn btn-sm btn-outline-secondary px-4" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-sm btn-primary px-4 fw-bold" @click="guardarFotoRecortada">Aplicar y Guardar</button>
                        </div>
                    </div>
                </div>
            </div>
    </div>
    `
};