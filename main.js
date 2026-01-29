document.addEventListener("DOMContentLoaded", () => {
    frmAlumnos.addEventListener("submit", (e) => {
        e.preventDefault();
        guardarAlumno();
    });
    mostrarAlumnos();
});
function mostrarAlumnos(){
    let $tblAlumnos = document.querySelector("#tblAlumnos tbody"),
        n = localStorage.length,
        filas = "";
    $tblAlumnos.innerHTML = "";
    for(let i=0; i<n; i++){
        let key = localStorage.key(i),
            data = JSON.parse(localStorage.getItem(key));
        if(data != null) {
            filas += `
            <tr onclick='modificarAlumno(${JSON.stringify(data)})'>
                <td>${data.codigo}</td>
                <td>${data.nombre}</td>
                <td>${data.direccion}</td>
                <td>${data.email}</td>
                <td>${data.telefono}</td>
                <td>
                    <button class="btn btn-danger">Eliminar</button>
                </td>
            </tr>
            `;
        }
    }
    $tblAlumnos.innerHTML = filas;
}

function modificarAlumno(alumno){
    txtCodigoAlumno.value = alumno.codigo;
    txtnombreAlumno.value = alumno.nombre;
    txtDireccionAlumno.value = alumno.direccion;
    txtEmailAlumno.value = alumno.email;
    txtTelefonoAlumno.value = alumno.telefono;
}

function guardarAlumno() {
    let datos = {
        id: getId(),
        codigo: txtCodigoAlumno.value,
        nombre: txtnombreAlumno.value,
        direccion: txtDireccionAlumno.value,
        email: txtEmailAlumno.value,
        telefono: txtTelefonoAlumno.value
    }, codigoDuplicado = buscarAlumno(datos.codigo);
    
    if(codigoDuplicado){
        alert("El codigo del alumno ya existe, "+ codigoDuplicado.nombre);
        return; //Termina la ejecucion de la funcion
    }
    
    localStorage.setItem( datos.id, JSON.stringify(datos));
    limpiarFormulario();
}

function getId(){
    return localStorage.length + 1;
}

function limpiarFormulario(){
    frmAlumnos.reset();
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

