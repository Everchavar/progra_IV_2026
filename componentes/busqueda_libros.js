const buscarlibro = {
    data() {
        return {
            buscar: '',
            buscarTipo: 'titulo',
            libros: [],
            autores:[]
        }
    },
    methods: {
        modificarLibro(libro){
            this.$emit('modificar', libro);
        },
        eliminarLibro(libro) {
            alertify.confirm('Eliminar Libro', `¿Esta seguro de eliminar el libro ${libro.nombre}?`, () => {
                db.libros.delete(libro.idLibro);
                this.listarLibros();
                alertify.success(`Libro ${libro.nombre} eliminado`);
            }, () => { });
        },
        async listarLibros() {
            this.libros = await db.libros.filter(libro => libro[this.buscarTipo].toLowerCase().includes(this.buscar.toLowerCase())).toArray();
        },
        async cargarAutores() {
                this.autores = await db.autores.toArray();
        },
        nuevoLibro() {
            this.accion = 'nuevo';
            this.idLibro = '';
            this.idAutor = '';
            this.isbn ='';
            this.titulo ='';
            this.editorial='';
            this.edicion='';
        }
    },
    created() {
        this.listarLibros();
        this.cargarAutores();
    },
    template: `
        <div class="row">
            <div class="col-6">
                <table class="table table-sm table-bordered table-hover">
                    <thead>
                        <tr>
                            <th>BUSCAR POR</th>
                            <th>
                                <select v-model="buscarTipo" class="form-control">
                                    <option value="isbn">ISBN</option> 
                                    <option value="titulo">TITULO</option>
                                    <option value="editorial">EDITORIAL</option>
                                    <option value="edicion">EDICION</option>
                                </select>
                            </th>
                            <th colspan="4">
                                <input type="text" @keyup="listarLibros()" v-model="buscar" class="form-control">
                            </th>
                        </tr>
                        <tr>
                            <th>ISBN</th>
                            <th>TITULO</th>
                            <th>AUTOR</th>
                            <th>EDITORIAL</th>
                            <th>EDICION</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="libro in libros" @click="modificarLibro(libro)" :key="libro.idLibro">
                            <td>{{ libro.isbn }}</td>
                            <td>{{ libro.titulo }}</td>
                            <td>{{ this.autores[libro.idAutor].nombre }}</td>
                            <td>{{ libro.editorial }}</td>
                            <td>{{ libro.edicion }}</td>
                            <td>
                                <button class="btn btn-danger btn-sm" 
                                    @click.stop="eliminarLibro(libro)">DEL</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `
};