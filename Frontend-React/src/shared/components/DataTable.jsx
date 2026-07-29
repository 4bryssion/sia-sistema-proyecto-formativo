// Hooks y utilidades principales de TanStack Table
import {
  useReactTable,          // Hook que crea la instancia de la tabla
  getCoreRowModel,        // Modelo base de filas (sin filtros ni paginación)
  flexRender,             // Permite renderizar contenido dinámico de columnas
  getPaginationRowModel,  // Modelo de filas con paginación
  getFilteredRowModel     // Modelo de filas filtradas
} from "@tanstack/react-table"


// Hook de React para manejar estado
import { useState } from "react"

// Botón y buscador reutilizables del sistema de componentes
import { Button, SearchField } from "@/shared"

// Gradiente de la cabecera: el mismo del Navbar pero con el azul (cuaternario)
// predominando ~14% más (parada del color pasa de 49% a 63%).
// Se declara como constante para que Navbar y tabla no se desincronicen por accidente.
const HEADER_GRADIENT =
  "linear-gradient(to right, var(--color-cuaternario-950) 63%, var(--color-quintinary-600) 100%)"

// Componente reutilizable de tabla
// Recibe:
// - data: datos que se mostrarán
// - columns: configuración de columnas
// toolbarExtra: contenido opcional que se coloca a la DERECHA del buscador
// (filtros de la tabla). Es un slot y no una lista de filtros configurable
// porque cada módulo filtra por campos distintos; así DataTable no necesita
// saber nada del dominio.
export default function DataTable({ data, columns, className = "", toolbarExtra }) {

  // ================== ESTADO DE PAGINACIÓN 
  // pageIndex → página actual
  // pageSize → cantidad de filas por página
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 5
  })

  // ================== ESTADO DEL FILTRO GLOBAL 
  // Se usa para el buscador de la tabla
  const [globalFilter, setGlobalFilter] = useState("")

  // ================== CONFIGURACIÓN DE LA TABLA 
  const table = useReactTable({

    // Datos que se mostrarán
    data,

    // Definición de columnas
    columns,

    // Estado controlado de la tabla
    state: {
      globalFilter,
      pagination
    },

    // Función que se ejecuta cuando cambia la paginación
    onPaginationChange: setPagination,

    // Función que se ejecuta cuando cambia el filtro global
    onGlobalFilterChange: setGlobalFilter,

    // Modelo base de filas
    getCoreRowModel: getCoreRowModel(),

    // Modelo con filtrado aplicado
    getFilteredRowModel: getFilteredRowModel(),

    // Modelo con paginación aplicada
    getPaginationRowModel: getPaginationRowModel(),
  })


  return (
    <div className={`space-y-4 ${className}`}>

      {/* ================== TOOLBAR  */}
      {/* Barra superior con buscador y selector de filas */}

      {/* En pantallas pequeñas (360px) el buscador de 256px + el filtro + el
          selector de filas no caben en una línea y desbordaban la tarjeta.
          Se apilan hasta sm y solo desde ahí se reparten en una fila. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">

        {/* ================== BUSCADOR  */}
        {/* Filtra todas las columnas de la tabla.
            Se usa el componente SearchField del proyecto en vez de un <input> suelto.
            SearchField emite el valor directo (no el evento), por eso setGlobalFilter
            recibe `value` y no `e.target.value`: el filtro global de TanStack sigue
            funcionando igual, incluido el botón de limpiar (que emite ""). */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
          <SearchField
            value={globalFilter ?? ""}
            placeholder="Buscar..."
            onChange={(value) => setGlobalFilter(value)}
            onClear={() => setGlobalFilter("")}
            className="w-full sm:w-64 font-secondary"
          />

          {/* Filtros propios del módulo, a la derecha del buscador */}
          {toolbarExtra}
        </div>

        {/* =============== SELECTOR DE FILAS  */}
        {/* Permite cambiar cuántas filas se muestran por página */}
        <select
          value={table.getState().pagination.pageSize}
          onChange={(e) => table.setPageSize(Number(e.target.value))}
          className="w-full sm:w-auto shrink-0 border rounded px-2 py-2 font-secondary hover:bg-(--color-cuaternario-600) cursor-pointer"
        >
          {[5, 7, 10, 20, 50].map(size => (
            <option key={size} value={size}>
              {size} filas
            </option>
          ))}
        </select>

      </div>

      {/* ================== TABLA  */}
      <div className="overflow-x-auto border rounded">
        <table className="w-full">

          {/* ================== CABECERA  */}
          <thead className="font-main" style={{ background: HEADER_GRADIENT }}>

            {/* TanStack agrupa cabeceras automáticamente */}
            {table.getHeaderGroups().map(headerGroup => (

              <tr key={headerGroup.id}>

                {headerGroup.headers.map(header => (
                  //cambiamos como el instructor nos indico MF
                  <th
                    key={header.id}
                    className="p-3 py-2 text-left border-b"
                  >

                    {/* 
                      flexRender permite renderizar:
                      - texto
                      - JSX
                      - funciones
                      definidos en columnDef.header
                    */}
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}

                  </th>

                ))}

              </tr>

            ))}

          </thead>


          {/* ================== CUERPO DE LA TABLA ================== */}
          <tbody className="font-secondary bg-(--color-cuaternario-300)">


            {/* Filas generadas por TanStack */}
            {table.getRowModel().rows.map(row => (


              <tr key={row.id} className="hover:bg-(--color-cuaternario-600)">


                {/* Celdas visibles de cada fila */}
                {row.getVisibleCells().map(cell => (

                  //* Padding vertical reducido de p-3 a py-2 para que la altura de la fila
                  //no supere los 48px máximo, según observación del instructor MF
                  <td key={cell.id} className="px-3 py-2 border-b">


                    {/* Render dinámico del contenido de la celda */}
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}


                  </td>


                ))}


              </tr>


            ))}


          </tbody>


        </table>


      </div>


      {/* ================== FOOTER ================== */}
      <div className="grid sm:flex items-center justify-between space-y-2">


        {/* ================== INFORMACIÓN ================== */}
        {/* Cantidad de registros visibles */}
        <span className="text-sm text-gray-600">
          Mostrando {table.getRowModel().rows.length} de{" "}
          {table.getFilteredRowModel().rows.length} registros
        </span>


        {/* ================== CONTROLES DE PAGINACIÓN ================== */}
        <div className="flex items-center gap-4">


          <div
            className="
              grid space-y-2 sm:space-y-0 sm:flex sm:gap-2 items-center
            "
          >
            {/* Ir a la primera página */}
            <Button
              size="sm"
              variant="secondary"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              Inicio
            </Button>


            {/* Página anterior */}
            <Button
              size="sm"
              variant="secondary"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Anterior
            </Button>
          </div>


          {/* Información de página actual */}
          <span className="text-sm px-2">
            Página {table.getState().pagination.pageIndex + 1} de{" "}
            {table.getPageCount()}
          </span>


          <div
            className="
              grid space-y-2 sm:space-y-0 sm:flex sm:gap-2 items-center 
            "
          >
            {/* Página siguiente */}
            <Button
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Siguiente
            </Button>


            {/* Ir a la última página */}
            <Button
              size="sm"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              Final
            </Button>
          </div>


        </div>


      </div>


      {/* ================== IR A PÁGINA ================== */}
      {/* Permite navegar directamente a una página específica */}
      <div className="flex items-center gap-2 text-sm">


        <span>Ir a página:</span>


        <input
          type="number"


          // Página actual (se muestra +1 porque el índice empieza en 0)
          defaultValue={table.getState().pagination.pageIndex + 1}


          onChange={(e) => {


            // Convierte el número ingresado en índice de página
            const page = e.target.value ? Number(e.target.value) - 1 : 0


            // Cambia la página
            table.setPageIndex(page)
          }}


          className="border rounded px-2 py-1 w-16"
        />


      </div>


    </div>
  )
}
