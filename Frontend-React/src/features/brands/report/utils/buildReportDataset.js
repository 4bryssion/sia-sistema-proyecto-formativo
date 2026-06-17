//Funcion utilitario para construir el dataset de un reporte (tabla)
//Patrón: transformacion de datos (input -> output listo para exportar)

export function buildReportDataset({
    brands,  //Array de ususario origen
    selectedFields, //Campos seleccionados para el reporte
    scope, // Alcance del reporte: "all" | "document"
    documentNumber // Numero de documento para filtrar (si aplica)
}) {
  
    let filteredBrands = [...brands]

    //FIltro por alcance: si es por documento, se aplica filtro especifico
    if (scope === "document" && documentNumber) {
        filteredBrands = filteredBrands.filter(
            (brand) => brand.document_number === documentNumber
        );
    }

    //Contruccion de encabezados del reporte
    //Se toma el label de cada campo selleccionado

    const headers = selectedFields.map((field) => field.label);

    const rows = filteredBrands.map((brand) => 
    selectedFields.map((field) => {
        const value = brand[field.key]; // Acceso dinamico a la propiedad

        return value ?? "";
    })
);


//Estructura final desacoplad de la UI
//Listas para exportar Excel, PDF o renderizar en tabla
return {
    headers, // Array de strings (columnas)
    rows //Array de arrays (filas)
};
}