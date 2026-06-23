import { useState, useEffect } from "react";

import { 
  Select, 
  Button 
} from "@/shared";

export default function AccessLeft({
  groups,
  users,
  selectedGroupId,
  selectedUserId,
  onGroupChange,
  onUserChange,
  userGroups,
  onAssignGroup,
  onRemoveGroup,
}) {
  const [groupToAssign, setGroupToAssign] = useState("");

  useEffect(() => {
    setGroupToAssign("");
  }, [selectedUserId]);

  const groupOptions = [
    { value: "", label: "— Selecciona un grupo —" },
    ...groups.map((g) => ({ value: String(g.id), label: g.groupName })),
  ];

  const userOptions = [
    { value: "", label: "— Selecciona un usuario —" },
    ...users.map((u) => ({
      value: String(u.id),
      label: `${u.userFirstName} ${u.userLastName}`,
    })),
  ];

  const assignedGroupIds = new Set(userGroups.map((ug) => ug.groupId));

  const availableGroups = groups.filter((g) => !assignedGroupIds.has(g.id));

  const assignOptions = [
    { value: "", label: "— Selecciona un grupo —" },
    ...availableGroups.map((g) => ({ value: String(g.id), label: g.groupName })),
  ];

  const handleAssign = () => {
    if (!groupToAssign) return;
    onAssignGroup(groupToAssign);
    setGroupToAssign("");
  };

  return (
    <div className="font-main space-y-10 grid sm:flex sm:space-y-0 sm:gap-10 sm:items-start sm:justify-evenly 1400:grid 1400:space-y-10 1400:h-full">

      {/* Sección Grupos */}
      <div className="grid gap-4 justify-items-center">

        <h3 className="text-h3 text-text-inverse text-center">
          Grupos usuarios
        </h3>

        <Select
          name="groupId"
          value={selectedGroupId ? String(selectedGroupId) : ""}
          onChange={(e) => onGroupChange(e.target.value)}
          options={groupOptions}
          className="bg-white"
        />

      </div>

      {/* Sección Usuario individual */}
      <div className="grid gap-4 justify-items-center w-full">

        <h3 className="text-h3 text-text-inverse text-center">
          Usuario individual
        </h3>

        <Select
          name="userId"
          value={selectedUserId ? String(selectedUserId) : ""}
          onChange={(e) => onUserChange(e.target.value)}
          options={userOptions}
          className="bg-white"
        />

        {selectedUserId && (
          <div className="w-full grid gap-3 mt-2">
            {userGroups.length > 0 ? (
              <div className="grid gap-2">
                {userGroups.map((ug) => (
                  <div
                    key={ug.groupId}
                    className="flex items-center justify-between bg-white/10 rounded px-3 py-1"
                  >
                    <span className="text-text-inverse text-sm">
                      {ug.group.groupName}
                    </span>
                    <button
                      onClick={() => onRemoveGroup(ug.groupId)}
                      className="text-red-400 hover:text-red-300 text-xs ml-2"
                      title="Remover grupo"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text-inverse/60 text-xs text-center">
                Sin grupos asignados
              </p>
            )}

            {availableGroups.length > 0 && (
              <div className="grid gap-2">
                <Select
                  name="groupToAssign"
                  value={groupToAssign}
                  onChange={(e) => setGroupToAssign(e.target.value)}
                  options={assignOptions}
                  className="bg-white"
                />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAssign}
                  disabled={!groupToAssign}
                >
                  Agregar grupo
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
