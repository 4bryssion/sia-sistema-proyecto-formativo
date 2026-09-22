import { Pencil, EllipsisVertical, ArrowLeftRight } from "lucide-react";

import { Dropdown, DropdownTrigger, DropdownItem, DropdownContent, Alert, usePermissions, IconButton} from "@/shared";
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
                        <IconButton ariaLabel="Más opciones" hitSize={36} iconSize={16}><EllipsisVertical size={16} /></IconButton>
                    </DropdownTrigger>

                    <DropdownContent className="right-0 w-64">
                        {devolution.status === "Autorizada" ? (
                            // Ya autorizada: la fila es histórico, no queda nada
                            // por hacer con ella
                            <DropdownItem disabled className="opacity-60">
                                Devolución ya autorizada
                            </DropdownItem>
                        ) : can("authorize_devolution") ? (
                            <DropdownItem onClick={() => onAuthorize?.(devolution)}>
                                {getAuthorizeActionLabel(devolution)}
                            </DropdownItem>
                        ) : (
                            <DropdownItem disabled className="opacity-60">
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
            <IconButton onClick={handleEdit} ariaLabel="Editar préstamo" hitSize={36} iconSize={16}><Pencil size={16} /></IconButton>

            <IconButton onClick={handleReturn} ariaLabel="Retornar préstamo" hitSize={36} iconSize={16}><ArrowLeftRight size={16} /></IconButton>
            </>
            )}

            {/* Botón opciones */}
            <Dropdown>
                <DropdownTrigger>
                    <IconButton ariaLabel="Más opciones" hitSize={36} iconSize={16}><EllipsisVertical size={16} /></IconButton>
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