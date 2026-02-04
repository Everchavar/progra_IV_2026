createApp({
    data(){
        return{
            alumno:{
                codigo:"",
                nombre:"",
                direccion:"",
                email:"",
                telefono:""
            },
            accion:'nuevo',
            id:0,
            buscar:'',
            alumnos:[]
        }
    },
    methods:{
        obtenerAlumnos(){
            let n = localStorage.length;
            this.alumnos = [];
            for(let i=0; i<n; i++){
                let key = localStorage.key(i);
                if( Number(key) ){
                    let data = JSON.parse(localStorage.getItem(key));
                    if( data.nombre.toUpperCase().includes(this.buscar.toUpperCase()) || 
                        data.codigo.toUpperCase().includes(this.buscar.toUpperCase()) ){
                        this.alumnos.push(data);
                    }
                }
            }
        },
        eliminarAlumno(id, e){
            e.stopPropagation();
            if(confirm("¿Está seguro de eliminar el alumno?")){
                localStorage.removeItem(id);
                this.obtenerAlumnos();
            }
        },
        modificarAlumno(alumno){
            this.accion = 'modificar';
            this.id = alumno.id;
            this.alumno.codigo = alumno.codigo;
            this.alumno.nombre = alumno.nombre;
            this.alumno.direccion = alumno.direccion;
            this.alumno.email = alumno.email;
            this.alumno.telefono = alumno.telefono;
        },
        guardarAlumno() {
            let datos = {
                id: this.accion=='modificar' ? this.id : this.getId(),
                codigo: this.alumno.codigo,
                nombre: this.alumno.nombre,
                direccion: this.alumno.direccion,
                email: this.alumno.email,
                telefono: this.alumno.telefono
            }, codigoDuplicado = this.buscarAlumno(datos.codigo);
            if(codigoDuplicado && this.accion=='nuevo'){
                alert("El codigo del alumno ya existe, "+ codigoDuplicado.nombre);
                return; //Termina la ejecucion de la funcion
            }
            localStorage.setItem( datos.id, JSON.stringify(datos));
            this.limpiarFormulario();
            this.obtenerAlumnos();
        },
        getId(){
            return new Date().getTime();
        },
        limpiarFormulario(){
            this.accion = 'nuevo';
            this.id = 0;
            this.alumno.codigo = '';
            this.alumno.nombre = '';
            this.alumno.direccion = '';
            this.alumno.email = '';
            this.alumno.telefono = '';
        },
        buscarAlumno(codigo=''){
            let n = localStorage.length;
            for(let i = 0; i < n; i++){
                let key = localStorage.key(i);
                let datos = JSON.parse(localStorage.getItem(key));
                if(datos?.codigo && datos.codigo.trim().toUpperCase() == codigo.trim().toUpperCase()){
                    return datos;
                }
            }
            return null;
        }
    },
    mounted(){
        this.obtenerAlumnos();
    }
}).mount("#app");