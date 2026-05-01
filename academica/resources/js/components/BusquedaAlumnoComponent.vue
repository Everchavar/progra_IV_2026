<template>
    <div v-draggable>
         <div class="card text-bg-dark mb-3">
             <div class="card-header"><div class="d-flex justify-content-between"><div class="p-1">BUSQUEDA DE ALUMNOS</div><div><button type="button" class="btn-close btn-close-white" aria-label="Close" @click="cerrarFormularioBusquedaAlumnos"></button></div></div></div>
             <div class="card-body">
                 <table class="table table-striped table-hover" id="tblAlumnos">
                     <thead>
                         <tr><th colspan="6"><input autocomplete="off" type="search" @keyup="obtenerAlumnos()" v-model="buscar" placeholder="Buscar alumno" class="form-control"></th></tr>
                         <tr><th>CODIGO</th><th>NOMBRE</th><th>DIRECCION</th><th>EMAIL</th><th>TELEFONO</th><th>HASH</th><th></th></tr>
                     </thead>
                     <tbody>
                         <tr v-for="alumno in alumnos" :key="alumno.idAlumno" @click="modificarAlumno(alumno)">
                             <td>{{ alumno.codigo }}</td><td>{{ alumno.nombre }}</td><td>{{ alumno.direccion }}</td><td>{{ alumno.email }}</td><td>{{ alumno.telefono }}</td><td>{{ alumno.hash }}</td>
                             <td><button class="btn btn-danger" @click="eliminarAlumno(alumno, $event)">DEL</button></td>
                         </tr>
                     </tbody>
                 </table>
             </div>
         </div>
    </div>
</template>
<script>
    import axios from 'axios';
    import alertify from 'alertifyjs';

    export default{
        props:['forms'],
        data(){
            return{
                alumnos:[],
                buscar:''
            }
        },
        methods:{
            cerrarFormularioBusquedaAlumnos(){
                this.forms.buscar_alumnos.mostrar = false;
            },
            modificarAlumno(alumno){
                this.$emit('modificar', alumno);
            },
            eliminarAlumno(alumno, event){
                event.stopPropagation();
                
                alertify.confirm('¿Está seguro de eliminar el alumno?', async ()=>{ 
                    axios({
                        method:'DELETE',
                        url:'alumno',
                        data:alumno,
                        headers:{
                            'Content-Type':'application/json',
                            'Accept':'application/json'
                        }
                    }).then(response=>{
                        if(response.data.msg !== 'ok'){
                            alertify.error(`Error al sincronizar con el servidor: ${response.data.msg}`);
                        }else{
                            db.alumnos.delete(alumno.idAlumno);
                            this.obtenerAlumnos();
                        }
                    }).catch(error=>{
                        alertify.error(`Error al sincronizar con el servidor: ${error}`);
                    });
                });
            },
            async obtenerAlumnos(){
                this.alumnos = await db.alumnos.filter(alumno=>{
                    return alumno.codigo.toLowerCase().includes(this.buscar.toLowerCase()) || 
                        alumno.nombre.toLowerCase().includes(this.buscar.toLowerCase());
                }).toArray();
                if( this.alumnos.length<1 && this.buscar.length<=0 ){
                    axios({
                        method:'GET',
                        url:'alumno',
                        headers:{
                            'Content-Type':'application/json',
                            'Accept':'application/json'
                        }
                    }).then(response=>{
                        console.log(response.data);
                        this.alumnos = response.data;
                        db.alumnos.bulkAdd(response.data);
                    }).catch(error=>{
                        alertify.error(`Error al sincronizar con el servidor: ${error}`);
                    });
                }
            }
        },
        created(){
            this.obtenerAlumnos();
        }
    }
</script>