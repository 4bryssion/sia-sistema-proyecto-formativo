import { Switch, Alert } from "@/shared";
import LoanRowActions from "../components/LoanRowActions";
import loanService from "@/shared/services/loanService";
import { getLoanStatusLabel } from "../utils/loanStatusLabel";
import devolutionService from "@/shared/services/devolutionService";
import { getDevolutionStatusLabel } from "@/shared/utils/devolutionLabels";
import { getStatusLabel } from "@/shared/utils/materialStatusLabel";
import { partyLabel } from "@/shared/utils/loanParties";
import { getLoanTypeLabel } from "../utils/loanStatusLabel";


// La tabla muestra dos cosas: préstamos y solicitudes de devolución en espera.
// Una fila de devolución trae los datos de su préstamo (para que las columnas de
// usuario, grupo y fecha funcionen igual) más `__devolution` con la solicitud.
// El marcador se lee aquí y no se reparte por el archivo para que quede claro
// cuál es la única diferencia entre ambas filas.
const devolucionDe = (row) => row.__devolution ?? null;

const materialsLabel = (row) => {
  const devolucion = devolucionDe(row);
  // En una devolución interesan los materiales que se están devolviendo, no
  // todos los del préstamo
  if (devolucion) {
    // Con la devolución ya autorizada se añade el estado que eligió el
    // autorizador. Para un material POR CANTIDAD este es el único sitio donde
    // se puede consultar: no se escribe sobre el material porque su fila
    // representa el lote entero, no la unidad devuelta.
    return devolucion.items
      .map((i) => {
        const nombre = i.consumableMaterial?.materialName ?? "?";
        const estado = i.materialStatus ? ` — ${getStatusLabel(i.materialStatus)}` : "";
        return `${nombre} (${i.returnedQuantity})${estado}`;
      })
      .join(", ") || "—";
  }
  const mats = row.materials ?? [];
  if (!mats.length) return "—";
  return mats
    .map((m) => `${m.consumableMaterial?.materialName ?? "?"} (${m.borrowedQuantity})`)
    .join(", ");
};

export const loanColumns = (refetch, can = () => true, acciones = {}) => [
  // (p48) Este listado es el ÚNICO del proyecto con columna de ID, a petición
  // expresa: aquí conviven dos clases de fila —préstamos y solicitudes de
  // devolución en espera— y el mismo préstamo puede aparecer dos veces, así que
  // el solicitante y la fecha no bastan para distinguirlas. El id que se muestra
  // es el del registro que la fila representa, y las devoluciones llevan el
  // prefijo "Dev." para que no se confundan con un número de préstamo.
  {
    id: "identificador",
    header: "ID",
    accessorFn: (row) => {
      const devolucion = row.__devolution;
      return devolucion ? `Dev. ${devolucion.id}` : String(row.id);
    },
  },
  {
    id: "receiver",
    header: "Usuario solicitante",
    // accessorFn junto al cell: sin él TanStack excluye la columna del buscador
    // global (getCanGlobalFilter exige accessorFn) y no se podría buscar por
    // receptor, que es justo el dato principal de la fila
    accessorFn: (row) => partyLabel(row, "Receptor"),
    cell: ({ row }) => {
      // Cambio: doble clic en el id navega a visualizar el préstamo
      // según observación del instructor, para evitar redirecciones accidentales
      

      const loan = row.original;

      // Doble clic abre el modal de consulta. Antes navegaba con window.location
      // a una ruta que ya no existe.
      //
      // OJO con el id: ListLoanPage le pone a las filas de devolución un id
      // sintético ("devolucion-3") para que no choque con el de su préstamo. Si
      // se le pasa ese texto al modal, el backend hace Number(...) → NaN y
      // responde con un error de Prisma en crudo. El préstamo real está dentro
      // de __devolution.
      const dev = devolucionDe(loan);
      const idPrestamo = dev ? (dev.loanId ?? dev.loan?.id) : loan.id;
      const handleDoubleClick = () => idPrestamo != null && acciones.onView?.(idPrestamo);

      return (
          <span
              onDoubleClick={handleDoubleClick}
              className="cursor-pointer hover:underline"
          >
              {/* (p48) Con un receptor externo no hay nombre: se muestra su
                  correo, que es lo único que lo identifica */}
              {partyLabel(loan, "Receptor")}
          </span>
      );
    },
  },
  {
    id: "lender",
    header: "Aprobado por",
    accessorFn: (row) => partyLabel(row, "Prestador"),
  },
  {
    id: "loanType",
    header: "Tipo",
    // (p48) Interno o Externo. Es independiente de si el receptor está
    // registrado: un usuario del sistema puede llevarse material afuera.
    accessorFn: (row) => getLoanTypeLabel(row.loanType),
  },
  {
    id: "materials",
    header: "Materiales",
    // accessorFn además del cell: sin él la columna queda fuera del buscador
    // global y no se podía buscar un préstamo por el material que lleva
    accessorFn: (row) => materialsLabel(row),
    cell: ({ row }) => materialsLabel(row.original),
  },
  {
    id: "apprenticeGroup",
    header: "Grupo",
    // (p48) El grupo pasó a opcional. El accessorFn devuelve "" y NO null a
    // propósito: TanStack decide si una columna entra en el buscador global
    // mirando solo el valor de la PRIMERA fila, así que con un null ahí la
    // columna entera dejaba de ser buscable —de forma intermitente, según qué
    // préstamo quedara primero—.
    accessorFn: (row) => (row.apprenticeGroup != null ? String(row.apprenticeGroup) : ""),
    cell: ({ row }) =>
      row.original.apprenticeGroup != null ? String(row.original.apprenticeGroup) : "—",
  },
  {
    id: "returnDate",
    header: "Fecha devolución",
    // accessorFn además del cell, por el mismo motivo que en materiales
    accessorFn: (row) => (row.returnDate ? String(row.returnDate).slice(0, 10) : ""),
    cell: ({ row }) => (row.original.returnDate ? String(row.original.returnDate).slice(0, 10) : "—"),
  },
  {
    id: "status",
    header: "Estado",
    // El filtro por estado se movió a la barra de la tabla (FilterMenu): allí
    // recorta el array ANTES de entregarlo a DataTable, así el buscador, la
    // paginación, el contador y el reporte trabajan sobre lo ya filtrado.
    // El accessorFn devuelve la ETIQUETA, no la clave del enum: el buscador
    // global busca sobre este valor, y con `Pendiente_confirmacion` guardado
    // ahí, escribir "pendiente de confirmación" —lo que se lee en pantalla— no
    // encontraba nada. El FilterMenu de la barra no se ve afectado: compara
    // `statusKey` fuera de la tabla, antes de entregarle los datos.
    accessorFn: (row) =>
      row.__devolution
        ? getDevolutionStatusLabel(row.__devolution)
        : getLoanStatusLabel(row.status),
    cell: ({ row }) => {
      const devolucion = devolucionDe(row.original);
      return devolucion
        ? getDevolutionStatusLabel(devolucion)
        : getLoanStatusLabel(row.original.status);
    },
  },
  {
    accessorKey: "isActive",
    header: "Activo",
    cell: ({ row }) => {
      const loan = row.original;
      const devolucion = devolucionDe(loan);

      // En una fila de devolución el interruptor descarta la SOLICITUD, no el
      // préstamo: desactivar el préstamo desde aquí restauraría stock que la
      // devolución todavía no ha movido
      const handleToggle = async () => {
        if (devolucion) {
          const result = await Alert.warning(
            "¿Descartar la devolución?",
            "La solicitud dejará de estar en espera. El préstamo no se modifica.",
          );
          if (!result.isConfirmed) return;
          try {
            await devolutionService.toggle(devolucion.id);
            Alert.success("Devolución descartada");
            refetch();
          } catch (err) {
            Alert.error("Error al descartar la devolución", err.response?.data?.error ?? "");
          }
          return;
        }

        // Confirmación obligatoria antes de activar/desactivar (restaura/descuenta stock)
        const result = await Alert.warning(
          `¿${loan.isActive ? "Desactivar" : "Activar"} préstamo?`,
          loan.isActive
            ? "Se restaurará el stock de los materiales prestados."
            : "Se descontará de nuevo el stock de los materiales."
        );
        if (!result.isConfirmed) return;
        try {
          await loanService.toggle(loan.id);
          Alert.success(`Préstamo ${loan.isActive ? "desactivado" : "activado"}`);
          refetch();
        } catch (err) {
          Alert.error("Error al cambiar estado", err.response?.data?.error ?? "");
        }
      };

      const activo = devolucion ? devolucion.isActive : loan.isActive;
      // Una devolución autorizada ya movió inventario: no se puede descartar,
      // así que su interruptor se muestra como texto
      if (devolucion?.status === "Autorizada") return activo ? "Activo" : "Inactivo";
      // Sin permiso de toggle: solo lectura. Descartar una devolución lo puede
      // hacer quien puede registrarla.
      const puede = devolucion ? can("create_loan_return") : can("toggle_loan");
      if (!puede) return activo ? "Activo" : "Inactivo";
      return <Switch checked={activo} onChange={handleToggle} className="inline-flex" />;
    },
  },
  { id: "actions", cell: ({ row }) => <LoanRowActions loan={row.original} devolution={devolucionDe(row.original)} {...acciones} /> },
];
