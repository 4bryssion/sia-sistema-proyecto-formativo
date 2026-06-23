import { useState } from "react";
import { Pencil, EllipsisVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Dropdown, DropdownTrigger, DropdownItem, DropdownContent,
  Checkbox, Switch,
} from "@/shared";
import taskService from "../services/taskService.js";

export default function TaskRowActions({ tasks, onChanged }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const handleToggle = async () => {
    setBusy(true);
    try {
      await taskService.toggle(tasks.id);
      onChanged?.();
    } catch {
      onChanged?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-3">

      <Switch checked={tasks.isActive} onChange={handleToggle} disabled={busy} size="sm" className="inline-flex"/>

      <button
        onClick={() => navigate(`/view/tasks/${tasks.id}/edit`)}
        className="p-1 rounded hover:bg-gray-900"
      >
        <Pencil size={16} />
      </button>

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
