import { useNavigate } from "react-router-dom";
import Button from "./Button";

// Botón "Cancelar" reutilizable para formularios de edición: vuelve a la
// pantalla anterior (visualizar o tabla, según de dónde vino) sin guardar.
export default function CancelButton({ disabled = false, className = "" }) {
    const navigate = useNavigate();

    return (
        <Button
            variant="secondary"
            type="button"
            className={className}
            onClick={() => navigate(-1)}
            disabled={disabled}
        >
            Cancelar
        </Button>
    );
}
