import { useState } from "react";
import { Pencil, EllipsisVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Dropdown, DropdownTrigger, DropdownItem, DropdownContent, Checkbox, Switch, Alert, usePermissions } from "@/shared";
import taskService from "../services/taskService.js";

export default function TaskRowActions({ tasks, onChanged }) {
  const { can } = usePermissions();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const handleToggle = async () => {
    // Confirmación obligatoria antes de activar/desactivar (soft-delete)
    const result = await Alert.warning(
      `¿${tasks.isActive ? "Desactivar" : "Activar"} tarea?`,
      `"${tasks.taskName}" quedará ${tasks.isActive ? "inactiva" : "activa nuevamente"}.`
    );
    if (!result.isConfirmed) return;
    setBusy(true);
    try {
      await taskService.toggle(tasks.id);
      Alert.success(`Tarea ${tasks.isActive ? "desactivada" : "activada"}`);
      onChanged?.();
    } catch (err) {
      Alert.error("Error al cambiar estado", err.response?.data?.error ?? "");
      onChanged?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-3">

      {/* Toggle y editar: solo gestión (ADMIN/SADMIN); INST/INV ven sus tareas */}
      {can("edit_task") && (
      <>
      <Switch checked={tasks.isActive} onChange={handleToggle} disabled={busy} size="sm" className="inline-flex"/>

      <button
        onClick={() => navigate(`/view/tasks/${tasks.id}/edit`)}
        className="p-1 rounded hover:bg-gray-900"
      >
        <Pencil size={16} />
      </button>
      </>
      )}

      <Dropdown>
        <DropdownTrigger>
          <button className="p-1 rounded hover:bg-gray-900">
            <EllipsisVertical size={16} />
          </button>
        </DropdownTrigger>
        <DropdownContent className="right-0">
          <DropdownItem>
            <button onClick={() => navigate(`/view/tasks/${tasks.id}`)}>
              Visualizar Tarea
            </button>
          </DropdownItem>
        </DropdownContent>
      </Dropdown>
    </div>
  );
}
