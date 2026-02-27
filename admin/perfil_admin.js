// =============================================
// Mi Perfil — Panel Admin
// =============================================
const perfilAdmin = {
    data() {
        return {
            cargando: true,
            guardando: false,
            perfil: { username: '', email: '' },
            pwd: { actual: '', nueva: '', confirmar: '', mostrarActual: false, mostrarNueva: false },
            cambiandoPwd: false,
            _userId: null,
        };
    },
    async mounted() { await this.cargar(); },
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
                const username = s.username || '';
                const usuario = await db.usuarios.where('username').equals(username).first();
                if (usuario) {
                    this._userId = usuario.id;
                    this.perfil.username = usuario.username || '';
                    this.perfil.email    = usuario.email    || '';
                }
            } finally { this.cargando = false; }
        },
        async guardar() {
            if (!this.perfil.username.trim()) { alertify.error('El nombre de usuario es obligatorio.'); return; }
            this.guardando = true;
            try {
                // Verificar que el nuevo username no esté tomado por otro usuario
                if (this._userId) {
                    const s = JSON.parse(sessionStorage.getItem('sesionUniversidad') || '{}');
                    const existing = await db.usuarios.where('username').equals(this.perfil.username.trim()).first();
                    if (existing && existing.id !== this._userId) {
                        alertify.error('Ese nombre de usuario ya está en uso.'); return;
                    }
                    await db.usuarios.update(this._userId, {
                        username: this.perfil.username.trim(),
                        email:    this.perfil.email.trim(),
                    });
                    // Actualizar sesión
                    sessionStorage.setItem('sesionUniversidad', JSON.stringify({
                        ...s,
                        username: this.perfil.username.trim()
                    }));
                }
                alertify.success('✅ Cuenta actualizada. Si cambiaste el usuario, la próxima vez usa el nuevo nombre.');
            } catch(e) { alertify.error('Error: ' + e.message); }
            finally { this.guardando = false; }
        },
        async cambiarPassword() {
            if (!this.pwd.actual) { alertify.error('Ingresa tu contraseña actual.'); return; }
            if (this.pwd.nueva.length < 6) { alertify.error('La nueva contraseña debe tener al menos 6 caracteres.'); return; }
            if (this.pwd.nueva !== this.pwd.confirmar) { alertify.error('Las contraseñas no coinciden.'); return; }
            this.cambiandoPwd = true;
            try {
                const usuario = await db.usuarios.get(this._userId);
                const hashActual = await this.hashPassword(this.pwd.actual);
                if (!usuario || usuario.hashPwd !== hashActual) { alertify.error('Contraseña actual incorrecta.'); return; }
                const hashNueva = await this.hashPassword(this.pwd.nueva);
                await db.usuarios.update(this._userId, { hashPwd: hashNueva });
                this.pwd = { actual: '', nueva: '', confirmar: '', mostrarActual: false, mostrarNueva: false };
                alertify.success('🔑 Contraseña actualizada correctamente.');
            } catch(e) { alertify.error('Error: ' + e.message); }
            finally { this.cambiandoPwd = false; }
        }
    },
    template: `
    <div>
        <div class="d-flex align-items-center mb-3 border-bottom pb-2">
            <i class="bi bi-person-gear me-2 fs-5 text-secondary"></i>
            <h5 class="mb-0 fw-semibold">Mi Cuenta (Administrador)</h5>
        </div>
        <div v-if="cargando" class="text-center py-5"><div class="spinner-border text-secondary"></div></div>
        <div v-else class="row g-4">
            <div class="col-lg-6">
                <div class="card border-0 shadow-sm bg-body-tertiary">
                    <div class="card-header bg-transparent fw-bold border-bottom py-3">
                        <i class="bi bi-shield-lock me-2 text-primary"></i>Datos de la Cuenta
                    </div>
                    <div class="card-body">
                        <div class="row g-3">
                            <div class="col-12">
                                <label class="form-label small fw-semibold text-body-secondary text-uppercase">Rol</label>
                                <input value="Administrador" class="form-control form-control-sm bg-body-secondary border-secondary-subtle" readonly>
                            </div>
                            <div class="col-12">
                                <label class="form-label small fw-semibold text-body-secondary text-uppercase">Nombre de usuario *</label>
                                <input v-model="perfil.username" class="form-control form-control-sm bg-transparent" placeholder="admin">
                                <div class="form-text text-body-secondary">Este es el nombre con el que inicias sesión.</div>
                            </div>
                            <div class="col-12">
                                <label class="form-label small fw-semibold text-body-secondary text-uppercase">Correo electrónico</label>
                                <input v-model="perfil.email" type="email" class="form-control form-control-sm bg-transparent" placeholder="admin@universidad.edu">
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
            <div class="col-lg-6">
                <div class="card border-0 shadow-sm bg-body-tertiary">
                    <div class="card-header bg-transparent fw-bold border-bottom py-3">
                        <i class="bi bi-lock me-2 text-warning"></i>Cambiar Contraseña
                    </div>
                    <div class="card-body">
                        <div class="row g-3">
                            <div class="col-12">
                                <label class="form-label small fw-semibold text-body-secondary text-uppercase">Contraseña actual</label>
                                <div class="input-group input-group-sm">
                                    <input v-model="pwd.actual" :type="pwd.mostrarActual?'text':'password'" class="form-control bg-transparent" placeholder="••••••">
                                    <button class="btn btn-outline-secondary" @click="pwd.mostrarActual=!pwd.mostrarActual">
                                        <i :class="pwd.mostrarActual?'bi bi-eye-slash':'bi bi-eye'"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="col-12">
                                <label class="form-label small fw-semibold text-body-secondary text-uppercase">Nueva contraseña</label>
                                <div class="input-group input-group-sm">
                                    <input v-model="pwd.nueva" :type="pwd.mostrarNueva?'text':'password'" class="form-control bg-transparent" placeholder="Mín. 6 caracteres">
                                    <button class="btn btn-outline-secondary" @click="pwd.mostrarNueva=!pwd.mostrarNueva">
                                        <i :class="pwd.mostrarNueva?'bi bi-eye-slash':'bi bi-eye'"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="col-12">
                                <label class="form-label small fw-semibold text-body-secondary text-uppercase">Confirmar nueva</label>
                                <input v-model="pwd.confirmar" type="password" class="form-control form-control-sm bg-transparent" placeholder="Repite la nueva contraseña">
                                <div v-if="pwd.confirmar && pwd.nueva!==pwd.confirmar" class="form-text text-danger">No coinciden.</div>
                            </div>
                            <div class="col-12 text-end">
                                <button class="btn btn-sm btn-outline-warning fw-bold px-4"
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
    `
};