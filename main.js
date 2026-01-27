document.addEventListener("DOMContentLoaded", () => {
    frmAlumnos.addEventListener("submit", (e) => {
        e.preventDefault();

        let datos = {
            codigo: txtCodigoAlumno.value,
            nombre: txtnombreAlumno.value,
            direccion: txtDireccionAlumno.value,
            email: txtEmailAlumno.value,
            telefono: txtTelefonoAlumno.value
        };
        console.log(datos);
    });
});