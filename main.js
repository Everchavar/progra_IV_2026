var accion = 'nuevo',
    id = 0;

document.addEventListener("DOMContentLoaded", () => {
    txtBuscarAlumno.addEventListener("keyup", (e) => {
        mostrarAlumnos(e.target.value);
    });

    frmAlumnos.addEventListener("submit", (e) => {
        e.preventDefault();
        guardarAlumno();
    });
    frmAlumnos.addEventListener("reset", (e) => {
        limpiarFormulario();
    });
    mostrarAlumnos();
});
function mostrarAlumnos(buscar=''){
    let $tblAlumnos = document.querySelector("#tblAlumnos tbody"),
        n = localStorage.length,
        filas = "";
    $tblAlumnos.innerHTML = "";
    for(let i=0; i<n; i++){
   let key = localStorage.key(i);
        if( Number(key) ){
            let data = JSON.parse(localStorage.getItem(key));
            if( data.nombre.toUpperCase().includes(buscar.toUpperCase()) || 
                data.codigo.toUpperCase().includes(buscar.toUpperCase()) ){
                filas += `
                    <tr onclick='modificarAlumno(${JSON.stringify(data)})'>
                        <td>${data.codigo}</td>
                        <td>${data.nombre}</td>
                        <td>${data.direccion}</td>
                        <td>${data.email}</td>
                        <td>${data.telefono}</td>
                        <td>
                            <button class="btn btn-danger" onclick='eliminarAlumno(${data.id}, event)'>DEL</button>
                        </td>
                    </tr>
                `;
            }
        }
    }
        }
    $tblAlumnos.innerHTML = filas;
function eliminarAlumno(id, e){
    e.stopPropagation();
    if(confirm("¿Está seguro de eliminar el alumno?")){
        localStorage.removeItem(id);
        mostrarAlumnos();
    }
}

function modificarAlumno(alumno){
     accion = 'modificar';
    id = alumno.id;
    txtCodigoAlumno.value = alumno.codigo;
    txtnombreAlumno.value = alumno.nombre;
    txtDireccionAlumno.value = alumno.direccion;
    txtEmailAlumno.value = alumno.email;
    txtTelefonoAlumno.value = alumno.telefono;
}

function guardarAlumno() {
    console.log(accion);
    let datos = {
         id: accion=='modificar' ? id : getId(),
        codigo: txtCodigoAlumno.value,
        nombre: txtnombreAlumno.value,
        direccion: txtDireccionAlumno.value,
        email: txtEmailAlumno.value,
        telefono: txtTelefonoAlumno.value
    }, codigoDuplicado = buscarAlumno(datos.codigo);
    
   if(codigoDuplicado && accion=='nuevo'){
        alert("El codigo del alumno ya existe, "+ codigoDuplicado.nombre);
        return; //Termina la ejecucion de la funcion
    }
    
    localStorage.setItem( datos.id, JSON.stringify(datos));
    limpiarFormulario();
}

function getId(){
  return new Date().getTime();
}

function limpiarFormulario(){
    accion = 'nuevo';
    id = 0;
    txtCodigoAlumno.value = '';
    txtnombreAlumno.value = '';
    txtDireccionAlumno.value = '';
    txtEmailAlumno.value = '';
    txtTelefonoAlumno.value = '';
}

function buscarAlumno(codigo=''){
    let n = localStorage.length;
    for(let i = 0; i < n; i++){
        let key = localStorage.key(i);
        let datos = JSON.parse(localStorage.getItem(key));
        if(datos?.codigo && datos.codigo.trim().toUpperCase() == codigo.trim().toUpperCase()){
            return datos;
        }
    }
    
}

