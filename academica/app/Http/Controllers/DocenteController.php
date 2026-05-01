<?php

namespace App\Http\Controllers;

use App\Models\Docente;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class DocenteController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return docente::get();//mostrar todos los datos de docentes
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        Docente::create($request->all());
        return response()->json(['msg'=>'ok'], 200);
    }

    /**
     * Display the specified resource.
     */
    public function show(Docente $docente)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Docente $docente)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Docente $docente)
    {
        $docente::where('idDocente', $request->idDocente)->update([
            'codigo' => $request->codigo,
            'nombre' => $request->nombre,
            'direccion' => $request->direccion,
            'email' => $request->email,
            'telefono' => $request->telefono,
            'escalafon' => $request->escalafon
        ]);
        return response()->json(['msg'=>'ok', 'idDocente'=>$request->idDocente], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, Docente $docente)
    {
        $docente::where('idDocente', $request['idDocente'])->delete();
        return response()->json(['msg'=> 'ok', 'idDocente'=>$request['idDocente']], 200);
    }
}
