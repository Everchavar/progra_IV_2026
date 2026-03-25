<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});
 Route::get('/saludo', function () {
    return 'Bienvenidos a mi pagina, hola';
});