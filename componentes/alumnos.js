const alumnos = {
    props:['forms'],
    data(){
        return{
            alumno:{
                idAlumno:0,
                codigo:"",
                nombre:"",
                direccion:"",
                email:"",
                telefono:""
            },
            accion:'nuevo',
            idAlumno:0,
            data_alumnos:[]
        }
    },
    methods:{
        buscarAlumno(){
            this.forms.busqueda_alumnos.mostrar = !this.forms.busqueda_alumnos.mostrar;
            this.$emit('buscar');
        },
        modificarAlumno(alumno){
            this.accion = 'modificar';
            this.idAlumno = alumno.idAlumno;
            this.alumno.codigo = alumno.codigo;
            this.alumno.nombre = alumno.nombre;
            this.alumno.direccion = alumno.direccion;
            this.alumno.email = alumno.email;
            this.alumno.telefono = alumno.telefono;
        },
        async guardarAlumno() {
            const sqlite = this.$root.sqlite;
            const db = this.$root.db;

            let datos = {
                idAlumno: this.accion == 'modificar' ? this.idAlumno : this.getId(),
                codigo: this.alumno.codigo,
                nombre: this.alumno.nombre,
                direccion: this.alumno.direccion,
                email: this.alumno.email,
                telefono: this.alumno.telefono
            };
            
            datos.hash = sha256(JSON.stringify(datos));

            // 1. Verificar si el código ya existe (Solo en nuevos registros)
            if(this.accion == 'nuevo') {
                const existe = [];
                await sqlite.exec(db, `SELECT nombre FROM alumnos WHERE codigo = '${datos.codigo}'`, (row) => {
                    existe.push(row[0]);
                });

                if(existe.length > 0) {
                    alertify.error(`El código ya existe, pertenece a: ${existe[0]}`);
                    return;
                }
            }

            // 2. Guardar en SQLite (Reemplaza a db.alumnos.put)
            try {
                if(this.accion == 'nuevo') {
                    await sqlite.exec(db, `
                        INSERT INTO alumnos (idAlumno, codigo, nombre, direccion, email, telefono) 
                        VALUES (${datos.idAlumno}, '${datos.codigo}', '${datos.nombre}', '${datos.direccion}', '${datos.email}', '${datos.telefono}')
                    `);
                } else {
                    await sqlite.exec(db, `
                        UPDATE alumnos SET 
                            codigo='${datos.codigo}', 
                            nombre='${datos.nombre}', 
                            direccion='${datos.direccion}', 
                            email='${datos.email}', 
                            telefono='${datos.telefono}' 
                        WHERE idAlumno=${datos.idAlumno}
                    `);
                }

                // 3. Sincronización con el servidor (PHP)
                fetch(`private/modulos/alumnos/alumno.php?accion=${this.accion}&alumnos=${JSON.stringify(datos)}`)
                    .then(response => response.json())
                    .then(data => {
                        if(data != true) alertify.error(`Error al sincronizar: ${data}`);
                    });

                this.limpiarFormulario();
                alertify.success(`${datos.nombre} guardado en SQLite correctamente`);
                
            } catch (err) {
                console.error(err);
                alertify.error("Error al escribir en la base de datos SQLite");
            }
        },
        getId(){
            return new Date().getTime();
        },
        limpiarFormulario(){
            this.accion = 'nuevo';
            this.idAlumno = 0;
            this.alumno.codigo = '';
            this.alumno.nombre = '';
            this.alumno.direccion = '';
            this.alumno.email = '';
            this.alumno.telefono = '';
        },
    },
    template: `
        <div class="row">
            <div class="col-6">
                <form id="frmAlumnos" @submit.prevent="guardarAlumno" @reset.prevent="limpiarFormulario">
                    <div class="card text-bg-dark mb-3" style="max-width: 36rem;">
                        <div class="card-header">REGISTRO DE ALUMNOS (SQLite WASM)</div>
                        <div class="card-body">
                            <div class="row p-1">
                                <div class="col-3">CODIGO:</div>
                                <div class="col-3">
                                    <input placeholder="codigo" required v-model="alumno.codigo" type="text" class="form-control">
                                </div>
                            </div>
                            <div class="row p-1">
                                <div class="col-3">NOMBRE:</div>
                                <div class="col-6">
                                    <input placeholder="nombre" required v-model="alumno.nombre" type="text" class="form-control">
                                </div>
                            </div>
                            <div class="row p-1">
                                <div class="col-3">DIRECCION:</div>
                                <div class="col-9">
                                    <input placeholder="direccion" required v-model="alumno.direccion" type="text" class="form-control">
                                </div>
                            </div>
                            <div class="row p-1">
                                <div class="col-3">EMAIL:</div>
                                <div class="col-6">
                                    <input placeholder="email" required v-model="alumno.email" type="text" class="form-control">
                                </div>
                            </div>
                            <div class="row p-1">
                                <div class="col-3">TELEFONO:</div>
                                <div class="col-4">
                                    <input placeholder="telefono" required v-model="alumno.telefono" type="text" class="form-control">
                                </div>
                            </div>
                        </div>
                        <div class="card-footer">
                            <div class="row">
                                <div class="col text-center">
                                    <button type="submit" id="btnGuardarAlumno" class="btn btn-primary">GUARDAR</button>
                                    <button type="reset" id="btnCancelarAlumno" class="btn btn-warning">NUEVO</button>
                                    <button type="button" @click="buscarAlumno" id="btnBuscarAlumno" class="btn btn-success">BUSCAR</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    `
};