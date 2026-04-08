<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title>sistema academico</title>

        <!-- Fonts -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" />
    <link rel="stylesheet" href="//cdn.jsdelivr.net/npm/alertifyjs@1.14.0/build/css/alertify.min.css"/>
    <link rel="stylesheet" href="//cdn.jsdelivr.net/npm/alertifyjs@1.14.0/build/css/themes/default.min.css"/>
       
    </head>
    <body class="antialised">
  <div id="app">
        <nav class="navbar navbar-expand-lg bg-light shadow-sm">
            <div class="container-fluid">
                <a class="navbar-brand" href="#">::.. SISTEMA ACADEMICO ..::</a>
                <div class="collapse navbar-collapse">
                    <div class="navbar-nav">
                        <a class="nav-link" href="#" @click="abrirVentana('alumnos')">Alumnos</a>
                        <a class="nav-link" href="#" @click="abrirVentana('materias')">Materias</a>
                        <a class="nav-link" href="#" @click="abrirVentana('docentes')">Docentes</a>
                        <a class="nav-link" href="#" @click="abrirVentana('matricula')">Matricula</a>
                        <a class="nav-link" href="#" @click="abrirVentana('inscripciones')">Inscripciones</a>
                    </div>
                </div>
            </div>
        </nav>

        <div id="appSistema" class="container-fluid mt-3">
            <alumnos @buscar='buscar("busqueda_alumnos","obtenerAlumnos")' :forms="forms" ref="alumnos" v-show="forms.alumnos.mostrar"></alumnos>
            <busqueda_alumnos @modificar='modificar("alumnos","modificarAlumno", $event)' ref="busqueda_alumnos" v-show="forms.busqueda_alumnos.mostrar"></busqueda_alumnos>

            <materias @buscar='buscar("busqueda_materias","obtenerMaterias")' :forms="forms" ref="materias" v-show="forms.materias.mostrar"></materias>
            <busqueda_materias @modificar='modificar("materias","modificarMateria", $event)' ref="busqueda_materias" v-show="forms.busqueda_materias.mostrar"></busqueda_materias>
           
            <docentes @buscar='buscar("busqueda_docentes","obtenerDocentes")' :forms="forms" ref="docentes" v-show="forms.docentes.mostrar"></docentes>
            <busqueda_docentes @modificar='modificar("docentes","modificarDocente", $event)' ref="busqueda_docentes" v-show="forms.busqueda_docentes.mostrar"></busqueda_docentes>

            <matricula @buscar='buscar("busqueda_matricula","obtenerMatriculas")' :forms="forms" ref="matricula" v-show="forms.matricula.mostrar"></matricula>
            <busqueda_matricula @modificar='modificar("matricula","modificarMatricula", $event)' ref="busqueda_matricula" v-show="forms.busqueda_matricula.mostrar"></busqueda_matricula>

            <inscripciones @buscar='buscar("busqueda_inscripciones","obtenerInscripciones")' :forms="forms" ref="inscripciones" v-show="forms.inscripciones.mostrar"></inscripciones>
            <busqueda_inscripciones @modificar='modificar("inscripciones","modificarInscripcion", $event)' ref="busqueda_inscripciones" v-show="forms.busqueda_inscripciones.mostrar"></busqueda_inscripciones>
        </div>
    </div>

    <script src="//cdn.jsdelivr.net/npm/alertifyjs@1.14.0/build/alertify.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/dexie/4.2.0/dexie.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
        
    </body>
</html>
