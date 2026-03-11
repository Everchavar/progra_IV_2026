<?php
class DB{
    private $conexion, $consulta, $resultado;

    public function __construct($server, $user, $pass, $base){
        $this->conexion = new PDO("mysql:host=$server;dbname=$base", $user, $pass,
        array(PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION)) or die('Error al conectar a la base de datos');
    }
    public function consultaSQL($sql){
        try{
            $parametros = func_get_args(); //obtener todos los parametros que pasamos a la funcion
            array_shift($parametros); //eliminar el primer parametro que es el sql
            $this->consulta = $this->conexion->prepare($sql);
            $this->resultado = $this->consulta->execute($parametros);
            return $this->resultado;
        }catch(Exception $e){
            return  $e->getMessage();
        }
    }
    public function obtener_datos(){
        return $this->consulta->fetchAll(PDO::FETCH_ASSOC);
    }
}