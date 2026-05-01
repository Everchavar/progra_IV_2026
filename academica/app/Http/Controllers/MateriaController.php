<?php

namespace App\Http\Controllers;

use App\Models\Materia;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class MateriaController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return materia::get();
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
        Materia::create($request->all());
        return response()->json(['msg'=>'ok'], 200);
    }

    /**
     * Display the specified resource.
     */
    public function show(Materia $materia)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Materia $materia)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Materia $materia)
    {
        $materia::where('idMateria', $request->idMateria)->update([
            'codigo' => $request->codigo,
            'nombre' => $request->nombre,
            'uv' => $request->uv,
        ]);
        return response()->json(['msg'=>'ok', 'idMateria'=>$request->idMateria], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, Materia $materia)
    {
        $materia::where('idMateria', $request['idMateria'])->delete();
        return response()->json(['msg'=> 'ok', 'idMateria'=>$request['idMateria']], 200);
    }
}