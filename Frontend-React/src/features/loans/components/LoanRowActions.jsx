import { Pencil, EllipsisVertical, Undo2, ArrowLeft, ArrowLeftRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Dropdown, DropdownTrigger, DropdownItem, DropdownContent, Alert, usePermissions } from "@/shared";
import { getLoanStatusLabel } from "../utils/loanStatusLabel";

// onReturn: retornar dejó de ser una página y pasó a ser el modal que mantiene
// ListLoanPage en una sola instancia. Visualizar y editar siguen navegando
// mientras no se conviertan (paso 5 del bloque).
export default function LoanRowActions({ loan, onReturn }) {
  const { can } = usePermissions();
    const navigate = useNavigate();

    // Navega a la página de visualizar préstamo
    const handleView = () => {
        navigate(`/view/loans/${loan.id}`);
    };

    // Solo préstamos Activos pueden editarse/retornarse: si no, alerta SIN redirigir
    // (antes redirigía a una página vacía con el mensaje del guard)
    const handleEdit = () => {
        if (loan.status !== "Activo") {
            Alert.error(
                "No se puede editar",
                `Solo los préstamos en estado Activo pueden editarse. Estado actual: ${getLoanStatusLabel(loan.status)}.`
            );
            return;
        }
        navigate(`/view/loans/${loan.id}/edit`);
    };

    const handleReturn = () => {
        if (loan.status !== "Activo") {
            Alert.error(
                "No se puede retornar",
                `Solo los préstamos en estado Activo pueden retornarse. Estado actual: ${getLoanStatusLabel(loan.status)}.`
            );
            return;
        }
        onReturn?.(loan.id);
    };

    return (
        <div className="flex gap-2">

            {/* Editar/retornar: ocultos para roles de solo lectura (INV y nuevos) */}
            {(can("update_loan") || can("create_loan_return")) && (
            <>
            <button
                onClick={handleEdit}
                className="p-1 rounded hover:bg-gray-900"
            >
                <Pencil size={16} />
            </button>

            <button
                onClick={handleReturn}
                aria-label="Retornar préstamo"
                className="p-1 rounded hover:bg-gray-900 cursor-pointer"
            >
                < ArrowLeftRight  size={16} />
            </button>
            </>
            )}

            {/* Botón opciones */}
            <Dropdown>
                <DropdownTrigger>
                    <button className="p-1 rounded hover:bg-gray-900">
                        <EllipsisVertical size={16} />
                    </button>
                </DropdownTrigger>

                <DropdownContent className="right-0">
                    <DropdownItem>
                        <button onClick={handleView}>
                            Visualizar préstamo
                        </button>
                    </DropdownItem>
                </DropdownContent>
            </Dropdown>
        </div>
    );
}