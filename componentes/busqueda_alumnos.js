const busqueda_alumnos = {
    data() {
        return {
            buscar: '',
            alumnos: []
        }
    },
    methods: {
        modificarAlumno(alumno) {
            this.$emit('modificar', alumno);
        },
        async obtenerAlumnos() {
            const sqlite = this.$root.sqlite;
            const db = this.$root.db;
            const lista = [];

            // 1. Consulta con SQL real usando LIKE para buscar en código o nombre
            // Esto es extremadamente rápido incluso con millones de registros
            const sql = `
                SELECT * FROM alumnos 
                WHERE codigo LIKE '%${this.buscar}%' 
                OR nombre LIKE '%${this.buscar}%'
                LIMIT 50; 
            `;

            try {
                await sqlite.exec(db, sql, (row, columns) => {
                    const obj = {};
                    columns.forEach((col, i) => obj[col] = row[i]);
                    lista.push(obj);
                });

                this.alumnos = lista;

                // 2. Si la base está vacía localmente, traer del servidor (Sincronización inicial)
                if (this.alumnos.length < 1 && this.buscar.length <= 0) {
                    fetch(`private/modulos/alumnos/alumno.php?accion=consultar`)
                        .then(response => response.json())
                        .then(async data => {
                            this.alumnos = data;
                            
                            // Insertar masivamente en SQLite si el servidor tiene datos
                            for (let registro of data) {
                                await sqlite.exec(db, `
                                    INSERT OR IGNORE INTO alumnos (idAlumno, codigo, nombre, direccion, email, telefono)
                                    VALUES (${registro.idAlumno}, '${registro.codigo}', '${registro.nombre}', '${registro.direccion}', '${registro.email}', '${registro.telefono}')
                                `);
                            }
                        });
                }
            } catch (err) {
                console.error("Error al consultar SQLite:", err);
            }
        },
        async eliminarAlumno(alumno, e) {
            e.stopPropagation();
            const sqlite = this.$root.sqlite;
            const db = this.$root.db;

            alertify.confirm('Eliminar alumno', `¿Está seguro de eliminar a ${alumno.nombre}?`, async () => {
                try {
                    // Eliminar de SQLite
                    await sqlite.exec(db, `DELETE FROM alumnos WHERE idAlumno = ${alumno.idAlumno}`);

                    // Sincronizar con servidor
                    fetch(`private/modulos/alumnos/alumno.php?accion=eliminar&alumnos=${JSON.stringify(alumno)}`)
                        .then(response => response.json())
                        .then(data => {
                            if (data != true) alertify.error(`Error en servidor: ${data}`);
                        });

                    this.obtenerAlumnos(); // Refrescar tabla
                    alertify.success(`Alumno eliminado de SQLite`);
                } catch (err) {
                    alertify.error("No se pudo eliminar el registro");
                }
            }, () => {});
        },
    },
    mounted() {
        // Cargar datos al iniciar el componente
        // Usamos un pequeño delay para asegurar que SQLite esté listo en el root
        setTimeout(() => {
            this.obtenerAlumnos();
        }, 500);
    },
    template: `
        <div class="row">
            <div class="col-12">
                <table class="table table-striped table-hover" id="tblAlumnos">
                    <thead>
                        <tr>
                            <th colspan="7">
                                <input autocomplete="off" type="search" @keyup="obtenerAlumnos" v-model="buscar" placeholder="Buscar por nombre o código (SQLite Engine)..." class="form-control">
                            </th>
                        </tr>
                        <tr>
                            <th>CODIGO</th>
                            <th>NOMBRE</th>
                            <th>DIRECCION</th>
                            <th>EMAIL</th>
                            <th>TELEFONO</th>
                            <th>ACCION</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="alumno in alumnos" :key="alumno.idAlumno" @click="modificarAlumno(alumno)" style="cursor:pointer">
                            <td>{{ alumno.codigo }}</td>
                            <td>{{ alumno.nombre }}</td>
                            <td>{{ alumno.direccion }}</td>
                            <td>{{ alumno.email }}</td>
                            <td>{{ alumno.telefono }}</td>
                            <td>
                                <button class="btn btn-danger btn-sm" @click="eliminarAlumno(alumno, $event)">ELIMINAR</button>
                            </td>
                        </tr>
                        <tr v-if="alumnos.length == 0">
                            <td colspan="7" class="text-center">No se encontraron registros</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `
};