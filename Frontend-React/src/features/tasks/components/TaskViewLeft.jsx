export default function TaskViewLeft() {

    return (
        <div
            className="
                font-main text-text-inverse space-y-6 grid sm:flex sm:space-y-0 sm:gap-6 sm:items-center sm:justify-evenly 1400:grid 1400:h-full
                
            "
        >
            <div className="grid items-center justify-center 1400:content-between">
                <h3 className="text-h3 text-center">
                    @Tarea
                </h3>
            </div>

            <div className="grid text-center">
                <h4>Estado:</h4>
                <p>Pendiente</p>
            </div>

            <div className="grid text-center">
                <h4>Fecha de inicio:</h4>
                <p>(DD/MM/AAAA)</p>
            </div>

            <div className="grid text-center">
                <h4>Fecha de fin:</h4>
                <p>(DD/MM/AAAA)</p>
            </div>
        </div>
    );
}