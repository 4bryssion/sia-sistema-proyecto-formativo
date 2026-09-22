import { useState } from "react";
import { Pencil, EllipsisVertical } from "lucide-react";
import { Dropdown, DropdownTrigger, DropdownItem, DropdownContent, Switch, Alert, usePermissions, IconButton } from "@/shared";
import taskService from "@/shared/services/taskService";

// (p50) Ya no navega: visualizar y editar son modales abiertos por el listado,
// igual que en los módulos principales. Por eso recibe `onView` y `onEdit` en
// vez de usar el router.
export default function TaskRowActions({ tasks, onChanged, onView, onEdit }) {
  const { can } = usePermissions();
  const [ocupado, setOcupado] = useState(false);

  const handleToggle = async () => {
    // Confirmación obligatoria antes de activar/desactivar (soft-delete)
    const result = await Alert.warning(
      `¿${tasks.isActive ? "Desactivar" : "Activar"} tarea?`,
      `"${tasks.taskName}" quedará ${tasks.isActive ? "inactiva" : "activa nuevamente"}.`,
    );
    if (!result.isConfirmed) return;
    setOcupado(true);
    try {
      await taskService.toggle(tasks.id);
      Alert.success(`Tarea ${tasks.isActive ? "desactivada" : "activada"}`);
      onChanged?.();
    } catch (err) {
      Alert.error("Error al cambiar estado", err.response?.data?.error ?? "");
      onChanged?.();
    } finally {
      setOcupado(false);
    }
  };

  return (
    <div className="flex items-center gap-3">

      {/* Activar/desactivar y editar: solo gestión. Quien solo tiene la tarea
          asignada la abre y la marca como completada, nada más. */}
      {can("toggle_task") && (
        <Switch
          checked={tasks.isActive}
          onChange={handleToggle}
          disabled={ocupado}
          size="sm"
          className="inline-flex"
        />
      )}

      {can("edit_task") && (
        <IconButton
          ariaLabel="Editar tarea"
          hitSize={36}
          iconSize={16}
          onClick={() => onEdit?.(tasks.id)}
        >
          <Pencil size={16} />
        </IconButton>
      )}

      <Dropdown>
        <DropdownTrigger>
          <IconButton ariaLabel="Más acciones" hitSize={36} iconSize={16}>
            <EllipsisVertical size={16} />
          </IconButton>
        </DropdownTrigger>
        <DropdownContent className="right-0">
          <DropdownItem onClick={() => onView?.(tasks.id)}>
            Visualizar tarea
          </DropdownItem>
        </DropdownContent>
      </Dropdown>
    </div>
  );
}
