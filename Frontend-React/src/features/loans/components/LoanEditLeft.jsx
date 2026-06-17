export default function LoanEditLeft() {
  return (
    <div className="font-main text-text-inverse space-y-6 grid sm:flex sm:space-y-0 sm:gap-6 sm:items-center sm:justify-evenly 1400:grid 1400:h-full">
      <div className="grid items-center justify-center 1400:content-between">
        <div className="w-32 h-32 bg-white" />
        <h3 className="text-h3 text-center">@Usuario</h3>
      </div>

      <div className="grid text-center">
        <h4>Estado del préstamo:</h4>
        <p>Activo</p>
      </div>

      <div className="grid text-center">
        <h4>Fecha de inicio:</h4>
        <p>(DD/MM/AAAA)</p>
      </div>

      <div className="grid text-center">
        <h4>Fecha de finalización:</h4>
        <p>(DD/MM/AAAA)</p>
      </div>
    </div>
  );
}