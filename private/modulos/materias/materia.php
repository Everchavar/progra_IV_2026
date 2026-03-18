<?php
include('../../Config/Config.php');
extract($_REQUEST);

$materias = $materias ?? '[]';
$accion = $accion ?? '';

$class_materias = new materias($conexion);
echo json_encode($class_materias->recibir_datos($materias));

class materias{
    private $datos = [], $db, $respuesta=['msg'=>'ok'];

    public function __construct($conexion){
        $this->db = $conexion;
    }
    public function recibir_datos($materias){
        global $accion;
        if($accion==='consultar'){
            return $this->administrar_materias();
        }else{
            $this->datos = json_decode($materias, true);
            return $this->validar_datos();
        }
    }
    private function validar_datos(){
        if(empty($this->datos['codigo'])){
            $this->respuesta['msg'] = 'El codigo es requerido';
        }
        if(empty($this->datos['nombre'])){
            $this->respuesta['msg'] = 'El nombre es requerido';
        }
        if(empty($this->datos['uv'])){
            $this->respuesta['msg'] = 'Las Unidades Valorativas (UV) son requeridas';
        }
        return $this->administrar_materias();
    }
    private function administrar_materias(){
        global $accion;
        if($this->respuesta['msg']!=='ok'){
           return $this->respuesta;
        }
        if($accion==='nuevo'){
            return $this->db->consultaSQL('INSERT INTO materias (idMateria, codigo, nombre, uv) VALUES (?, ?, ?, ?)',
            $this->datos['idMateria'], $this->datos['codigo'], $this->datos['nombre'], $this->datos['uv']);
        }else if($accion==='modificar'){
            return $this->db->consultaSQL('UPDATE materias SET codigo = ?, nombre = ?, uv = ? WHERE idMateria = ?',
            $this->datos['codigo'], $this->datos['nombre'], $this->datos['uv'], $this->datos['idMateria']);
        }else if($accion==='eliminar'){
            return $this->db->consultaSQL('
                DELETE FROM materias 
                WHERE idMateria = ?
            ',$this->datos['idMateria']);
        }else if($accion==='consultar'){
            $this->db->consultaSQL('
                SELECT idMateria, codigo, nombre, uv 
                FROM materias
            ');
            return $this->db->obtener_datos();
        }
    }
}

?>
