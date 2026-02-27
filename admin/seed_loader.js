// seed_loader.js — Cargador del Plan de Estudios Universitario
// Llama a seedUniversidadData() desde el panel de Carreras para poblar la BD
async function seedUniversidadData(onProgress) {
    const partes = [window.SEED_A, window.SEED_B, window.SEED_C, window.SEED_D].filter(Boolean);
    if (!partes.length) throw new Error('No se encontraron archivos de datos (SEED_A..D).');

    let totalCarreras = 0, totalMaterias = 0;

    for (const parte of partes) {
        // Insertar Carreras
        for (const [codigo, nombre, facultad] of (parte.carreras || [])) {
            const existe = await db.carreras.where('codigo').equals(codigo).count();
            if (!existe) {
                await db.carreras.add({ codigo, nombre, facultad: facultad||'', estado: 'activa' });
                totalCarreras++;
            }
        }
        // Insertar Materias vinculadas a carrera
        for (const [carreraCodigo, codigo, nombre] of (parte.materias || [])) {
            const existe = await db.materias.where('codigo').equals(codigo).count();
            if (!existe) {
                const car = await db.carreras.where('codigo').equals(carreraCodigo).first();
                await db.materias.add({
                    idMateria: 'M-' + codigo + '-' + Date.now(),
                    codigo, nombre,
                    carreraId: car ? String(car.idCarrera) : '',
                    carrera:   car ? car.nombre : '',
                    cupo: 30, estado: 'habilitada',
                    docenteId: ''
                });
                totalMaterias++;
            }
        }
        // Insertar Materias comunes/transversales (sin carrera)
        for (const [codigo, nombre] of (parte.comunales || [])) {
            const existe = await db.materias.where('codigo').equals(codigo).count();
            if (!existe) {
                await db.materias.add({
                    idMateria: 'M-' + codigo + '-' + Date.now(),
                    codigo, nombre,
                    carreraId: '', carrera: '',
                    cupo: 50, estado: 'habilitada',
                    docenteId: ''
                });
                totalMaterias++;
            }
        }
        onProgress && onProgress(totalCarreras, totalMaterias);
    }
    return { totalCarreras, totalMaterias };
}