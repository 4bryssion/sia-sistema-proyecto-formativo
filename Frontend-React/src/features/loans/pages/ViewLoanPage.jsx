import { useNavigate } from "react-router-dom";
import { IconButton } from "@/shared";
import LoanViewLeft from "../components/LoanViewLeft";
import LoanViewRight from "../components/LoanViewRight";
import { Undo2 } from "lucide-react";

export default function ViewLoanPage() {

    const navigate = useNavigate();

    return (
        <div
            className="
                1400:min-h-[calc(100vh-4rem)]
                1400:flex 1400:flex-col 1400:justify-center 1400:relative pb-4
            "
        >
            {/* Header con botón volver y título */}
            <div
                className="
                    flex items-center gap-4 mt-2 mb-6
                    1400:absolute 1400:top-0
                "
            >
                <IconButton
                    ariaLabel="Devolverse"
                    onClick={() => navigate(-1)}
                >
                    <Undo2 strokeWidth={2.8} />
                </IconButton>

                <h1
                    className="
                        text-xl font-semibold
                        text-h3 sm:text-h2
                    "
                >
                    Visualizar Préstamo
                </h1>
            </div>

            {/* Contenido principal: izquierda + derecha */}
            <div
                className="
                    flex flex-col items-center
                    lg:flex-row lg:items-start
                    gap-6
                "
            >
                {/* Panel izquierdo */}
                <LoanViewLeft />

                {/* Panel derecho */}
                <LoanViewRight />

            </div>

        </div>
    );
}