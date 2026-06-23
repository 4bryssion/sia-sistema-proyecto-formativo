import { useState } from "react";
import { Pencil } from "lucide-react";
import { Switch } from "@/shared";
import groupService from "../services/groupService.js";
import EditGroupModal from "../pages/EditGroupModal.jsx";

export default function GroupRowActions({ group, onChanged }) {

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [toggling, setToggling] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    try {
      await groupService.toggle(group.id);
      onChanged?.();
    } catch {
      onChanged?.();
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="flex items-center gap-3">

      <Switch
        checked={group.isActive}
        onChange={handleToggle}
        disabled={toggling}
        size="sm"
        className="inline-flex"
      />

      <button
        onClick={() => setIsEditOpen(true)}
        className="p-1 rounded hover:bg-gray-900"
      >
        <Pencil size={16} />
      </button>

      <EditGroupModal
        group={group}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSave={onChanged}
      />
    </div>
  );
}
