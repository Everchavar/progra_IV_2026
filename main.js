const { createApp } = Vue;

createApp({
    data() {
        return {
            // Estado de UI
            accion: 'nuevo',
            busqueda: '',
            mesFiltro: "",
            
            // Datos del Formulario
            id: null, // Usaremos un ID interno para persistencia confiable
            codigo: '', 
            nombre: '', 
            direccion: '', 
            departamento: '', 
            municipio: '', 
            distrito: '',
            telefono: '', 
            sexo: '', 
            fechaNacimiento: '', 
            email: '', 
            
            // Listas y Constantes
            alumnos: [],
            municipios: [], 
            distritos: [],
            sexos: ["Masculino", "Femenino"],
            datosUbicacion: {
                "San Salvador": {
                    "San Salvador Norte": ["Centro Histórico", "Colonia Escalón", "Ciudad Merliot"],
                    "San Salvador Centro": ["Unicentro", "Las Margaritas", "Bosques del Río"],
                    "San Salvador Oeste": ["Zacamil", "Centro", "San Roque"]
                },
                "La Libertad": {
                    "Libertad Norte": ["Centro", "La Sultana", "Merliot"],
                    "Libertad Sur": ["Zona Industrial", "Universitaria", "Santa Elena"],
                    "Libertad Centro": ["El Carmen", "San Sebastián", "Centro"]
                },
                "Santa Ana": {
                    "Santa Ana Norte": ["Distrito de Masahuat", "Distrito de Metapán", "Distrito de Texistepeque"],
                    "Santa Ana Sur": ["San Pedro", "San Juan", "La Palma"],
                    "Santa Ana Este": ["Las Flores", "Centro", "Candelaria"]
                },
                "Sonsonate": {
                    "Sonsonate Norte": ["Nahuizalco", "Juayúa", "Salcoatitán"],
                    "Sonsonate Sur": ["Acajutla", "San Julián", "Metalío"],
                    "Sonsonate Centro": ["Sonsonate", "Armenia", "Izalco"]
                },
                "Ahuachapán": {
                    "Ahuachapán Norte": ["Tacuba", "Concepción de Ataco", "Apaneca"],
                    "Ahuachapán Sur": ["Guaymango", "San Francisco Menéndez", "Jujutla"],
                    "Ahuachapán Centro": ["Ahuachapán", "San Lorenzo", "Turín"]
                },
                "Cuscatlán": {
                    "Cuscatlán Norte": ["Suchitoto", "San José Guayabal", "Oratorio de Concepción"],
                    "Cuscatlán Sur": ["Cojutepeque", "San Bartolomé Perulapía", "San Rafael Cedros"],
                    "Cuscatlán Centro": ["Monte San Juan", "Santa Cruz Michapa", "El Carmen"]
                },
                "Chalatenango": {
                    "Chalatenango Norte": ["Nueva Concepción", "La Palma", "San Ignacio"],
                    "Chalatenango Sur": ["Tejutla", "San Rafael", "Dulce Nombre de María"],
                    "Chalatenango Centro": ["Chalatenango", "El Paraíso", "Concepción Quezaltepeque"]
                },
                "Cabañas": {
                    "Cabañas Norte": ["Victoria", "Dolores", "Sensuntepeque"],
                    "Cabañas Sur": ["Guacotecti", "San Isidro", "Jutiapa"],
                    "Cabañas Centro": ["Ilobasco", "Cinquera", "Tejutepeque"]
                },
                "San Vicente": {
                    "San Vicente Norte": ["Apastepeque", "San Esteban Catarina", "San Ildefonso"],
                    "San Vicente Sur": ["Santa Clara", "Santo Domingo", "Tecoluca"],
                    "San Vicente Centro": ["San Vicente", "Verapaz", "San Cayetano Istepeque"]
                },
                "Usulután": {
                    "Usulután Norte": ["Santiago de María", "Alegría", "Jucuapa"],
                    "Usulután Sur": ["Puerto El Triunfo", "Jiquilisco", "San Dionisio"],
                    "Usulután Centro": ["Usulután", "Santa Elena", "Mercedes Umaña"]
                },
                "San Miguel": {
                    "San Miguel Norte": ["Chinameca", "San Jorge", "Nueva Guadalupe"],
                    "San Miguel Sur": ["El Tránsito", "San Rafael Oriente", "Moncagua"],
                    "San Miguel Centro": ["San Miguel", "Uluazapa", "Quelepa"]
                },
                "Morazán": {
                    "Morazán Norte": ["Perquín", "Arambala", "Torola"],
                    "Morazán Sur": ["San Carlos", "Sensembra", "Gualococti"],
                    "Morazán Centro": ["San Francisco Gotera", "Osicala", "Corinto"]
                },
                "La Unión": {
                    "La Unión Norte": ["Lislique", "Concepción de Oriente", "Polorós"],
                    "La Unión Sur": ["Meanguera del Golfo", "Intipucá", "Conchagua"],
                    "La Unión Centro": ["La Unión", "Santa Rosa de Lima", "Anamorós"]
                }
            }
        };
    },
    computed: {
        alumnosFiltrados() {
            let filtro = this.busqueda.toLowerCase();
            return this.alumnos.filter(alumno => {
                const coincideBusqueda = 
                    alumno.codigo.toLowerCase().includes(filtro) ||
                    alumno.nombre.toLowerCase().includes(filtro) ||
                    alumno.departamento.toLowerCase().includes(filtro) ||
                    alumno.telefono.includes(filtro) ||
                    alumno.email.toLowerCase().includes(filtro);

                const coincideMes = this.mesFiltro === "" || 
                    (alumno.fechaNacimiento && alumno.fechaNacimiento.split("-")[1] === this.mesFiltro);

                return coincideBusqueda && coincideMes;
            });
        }
    },
    methods: {
        cargarMunicipios() {
            this.municipios = Object.keys(this.datosUbicacion[this.departamento] || {});
            this.municipio = "";
            this.distritos = [];
            this.distrito = "";
        },
        cargarDistritos() {
            this.distritos = this.datosUbicacion[this.departamento]?.[this.municipio] || [];
            this.distrito = "";
        },
        formatearTelefono() {
            let val = this.telefono.replace(/\D/g, '').slice(0, 8);
            if (val.length > 4) val = val.slice(0, 4) + '-' + val.slice(4);
            this.telefono = val;
        },
        validarDatos() {
            if (!this.codigo.trim()) { alertify.error("❌ Ingrese código."); return false; }
            if (!this.nombre.trim()) { alertify.error("❌ Ingrese nombre."); return false; }
            
            // Validar Duplicados de Código (Solo si es nuevo o si se cambió el código en edición)
            const existe = this.alumnos.find(a => 
                a.codigo.toLowerCase() === this.codigo.trim().toLowerCase() && a.id !== this.id
            );
            if (existe) {
                alertify.error(`❌ El código ya pertenece a: ${existe.nombre}`);
                return false;
            }

            if (!this.sexo) { alertify.error("❌ Seleccione sexo."); return false; }
            if (!/^\d{4}-\d{4}$/.test(this.telefono)) { alertify.error("❌ Formato teléfono: 0000-0000."); return false; }
            if (!this.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) { alertify.error("❌ Email inválido."); return false; }
            return true;
        },
        guardarAlumno() {
            if (!this.validarDatos()) return;

            // Si es nuevo, generamos un ID basado en tiempo, si no, conservamos el actual
            const nuevoId = this.accion === 'nuevo' ? new Date().getTime() : this.id;

            let alumno = {
                id: nuevoId,
                codigo: this.codigo.trim(), 
                nombre: this.nombre.trim(), 
                direccion: this.direccion,
                departamento: this.departamento, 
                municipio: this.municipio, 
                distrito: this.distrito,
                telefono: this.telefono, 
                sexo: this.sexo, 
                fechaNacimiento: this.fechaNacimiento, 
                email: this.email
            };

            // Usamos el ID como llave única en LocalStorage para evitar conflictos con códigos manuales
            localStorage.setItem(nuevoId, JSON.stringify(alumno));
            
            this.listarAlumnos();
            this.limpiarFormulario();
            alertify.success(this.accion === 'nuevo' ? "Alumno registrado" : "Alumno actualizado");
        },
        listarAlumnos() {
            this.alumnos = [];
            for (let i = 0; i < localStorage.length; i++) {
                let key = localStorage.key(i);
                // Solo procesamos llaves que sean IDs numéricos de nuestros alumnos
                if (!isNaN(key)) {
                    try {
                        let alumno = JSON.parse(localStorage.getItem(key));
                        if (alumno && alumno.id) this.alumnos.push(alumno);
                    } catch(e) { console.error("Error al leer localstorage", e); }
                }
            }
        },
        verAlumno(alumno) {
            this.accion = 'modificar';
            // Cargamos todos los campos
            this.id = alumno.id;
            this.codigo = alumno.codigo;
            this.nombre = alumno.nombre;
            this.direccion = alumno.direccion;
            this.departamento = alumno.departamento;
            
            // Forzar carga de selects dependientes antes de asignar valores
            this.municipios = Object.keys(this.datosUbicacion[this.departamento] || {});
            this.municipio = alumno.municipio;
            
            this.distritos = this.datosUbicacion[this.departamento]?.[this.municipio] || [];
            this.distrito = alumno.distrito;
            
            this.telefono = alumno.telefono;
            this.sexo = alumno.sexo;
            this.fechaNacimiento = alumno.fechaNacimiento;
            this.email = alumno.email;
        },
        eliminarAlumno(alumno) {
            alertify.confirm("Eliminar Alumno", `¿Está seguro de eliminar a <b>${alumno.nombre}</b>?`, 
                () => {
                    // Eliminamos por la llave correcta (ID)
                    localStorage.removeItem(alumno.id);
                    this.listarAlumnos();
                    this.limpiarFormulario();
                    alertify.success("Registro eliminado correctamente");
                }, 
                () => { /* cancelar */ }
            ).set({labels:{ok:'Sí, eliminar', cancel:'Cancelar'}, closable: false});
        },
        limpiarFormulario() {
            this.accion = 'nuevo';
            this.id = null;
            this.codigo = ''; this.nombre = ''; this.direccion = ''; this.departamento = '';
            this.municipio = ''; this.distrito = ''; this.telefono = ''; this.sexo = '';
            this.fechaNacimiento = ''; this.email = ''; 
            this.municipios = []; this.distritos = [];
        }
    },
    mounted() {
        this.listarAlumnos();
    }
}).mount("#app");