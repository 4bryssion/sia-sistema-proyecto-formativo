import { Pencil, EllipsisVertical, ArrowLeftRight } from "lucide-react";

import { Dropdown, DropdownTrigger, DropdownItem, DropdownContent, Alert, usePermissions } from "@/shared";
import { getLoanStatusLabel } from "../utils/loanStatusLabel";
import { getAuthorizeActionLabel } from "@/shared/utils/devolutionLabels";

// Las cuatro acciones abren modales que ListLoanPage mantiene en una sola
// instancia: la fila solo dice qué abrir. Ya no queda navegación aquí.
export default function LoanRowActions({ loan, devolution, onView, onEdit, onReturn, onAuthorize }) {
  const { can } = usePermissions();

    // Una fila de devolución no se edita ni se retorna: lo único que se puede
    // hacer con ella es autorizarla
    if (devolution) {
        return (
            <div className="flex gap-2 justify-end">
                <Dropdown>
                    <DropdownTrigger>
                        <button className="p-1 rounded hover:bg-gray-900 cursor-pointer" aria-label="Más opciones">
                            <EllipsisVertical size={16} />
                        </button>
                    </DropdownTrigger>

                    <DropdownContent className="right-0 w-64">
                        {devolution.status === "Autorizada" ? (
                            // Ya autorizada: la fila es histórico, no queda nada
                            // por hacer con ella
                            <DropdownItem className="opacity-60">
                                Devolución ya autorizada
                            </DropdownItem>
                        ) : can("authorize_devolution") ? (
                            <DropdownItem onClick={() => onAuthorize?.(devolution)}>
                                {getAuthorizeActionLabel(devolution)}
                            </DropdownItem>
                        ) : (
                            <DropdownItem className="opacity-60">
                                Sin permiso para autorizar
                            </DropdownItem>
                        )}
                    </DropdownContent>
                </Dropdown>
            </div>
        );
    }

    const handleView = () => onView?.(loan.id);

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
        onEdit?.(loan.id);
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
                aria-label="Editar préstamo"
                className="p-1 rounded hover:bg-gray-900 cursor-pointer"
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
                    <button className="p-1 rounded hover:bg-gray-900 cursor-pointer" aria-label="Más opciones">
                        <EllipsisVertical size={16} />
                    </button>
                </DropdownTrigger>

                <DropdownContent className="right-0">
                    <DropdownItem onClick={handleView}>
                        Visualizar préstamo
                    </DropdownItem>
                </DropdownContent>
            </Dropdown>
        </div>
    );
}