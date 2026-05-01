<template>
    <div v-draggable>
        <div v-draggable>
            <div class="card text-bg-dark mb-3">
                <div class="card-header"><div class="d-flex justify-content-between"><div class="p-1">BUSQUEDA DE DOCENTES</div><div><button type="button" class="btn-close btn-close-white" aria-label="Close" @click="cerrarFormularioBusquedaDocentes"></button></div></div></div>
                <div class="card-body">
                    <table class="table table-striped table-hover" id="tblDocentes">
                        <thead>
                            <tr><th colspan="6"><input autocomplete="off" type="search" @keyup="obtenerDocentes()" v-model="buscar" placeholder="Buscar docente" class="form-control"></th></tr>
                            <tr><th>CODIGO</th><th>NOMBRE</th><th>DIRECCION</th><th>EMAIL</th><th>TELEFONO</th><th>ESCALAFON</th><th></th></tr>
                        </thead>
                        <tbody>
                            <tr v-for="docente in docentes" :key="docente.idDocente" @click="modificarDocente(docente)">
                                <td>{{ docente.codigo }}</td><td>{{ docente.nombre }}</td><td>{{ docente.direccion }}</td><td>{{ docente.email }}</td><td>{{ docente.telefono }}</td><td>{{ docente.escalafon }}</td>
                                <td><button class="btn btn-danger" @click="eliminarDocente(docente, $event)">DEL</button></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
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
                docentes:[],
                buscar:''
            }
        },
        methods:{
            cerrarFormularioBusquedaDocentes(){
                this.forms.buscar_docentes.mostrar = false;
            },
            modificarDocente(docente){
                this.$emit('modificar', docente);
            },
            eliminarDocente(docente, event){
                event.stopPropagation();
                
                alertify.confirm('¿Está seguro de eliminar el docente?', async ()=>{
                    axios({
                        method:'DELETE',
                        url:'docente',
                        data:docente,
                        headers:{
                            'Content-Type':'application/json',
                            'Accept':'application/json'
                        }
                    }).then(response=>{
                        if(response.data.msg !== 'ok'){
                            alertify.error(`Error al sincronizar con el servidor: ${response.data.msg}`);
                        }else{
                            db.docentes.delete(docente.idDocente);
                            this.obtenerDocentes();
                        }
                    }).catch(error=>{
                        alertify.error(`Error al sincronizar con el servidor: ${error}`);
                    });
                });
            },
            async obtenerDocentes(){
                this.docentes = await db.docentes.filter(docente=>{
                    return docente.codigo.toLowerCase().includes(this.buscar.toLowerCase()) || 
                        docente.nombre.toLowerCase().includes(this.buscar.toLowerCase());
                }).toArray();
                if( this.docentes.length<1 && this.buscar.length<=0 ){
                    axios({
                        method:'GET',
                        url:'docente',
                        headers:{
                            'Content-Type':'application/json',
                            'Accept':'application/json'
                        }
                    }).then(response=>{
                        console.log(response.data);
                        this.docentes = response.data;
                        db.docentes.bulkAdd(response.data);
                    }).catch(error=>{
                        alertify.error(`Error al sincronizar con el servidor: ${error}`);
                    });
                }
            }
        },
        created(){
            this.obtenerDocentes();
        }
    }
</script>
    