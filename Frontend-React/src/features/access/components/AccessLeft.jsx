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
    // { value: "", label: "— Selecciona un grupo —" },
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
    // { value: "", label: "— Selecciona un grupo —" },
    ...availableGroups.map((g) => ({ value: String(g.id), label: g.groupName })),
  ];

  const handleAssign = () => {
    if (!groupToAssign) return;
    onAssignGroup(groupToAssign);
    setGroupToAssign("");
  };

  return (

    <div className="font-main space-y-6 grid min-w-0 min-[768px]:max-[1023px]:grid-cols-2 min-[768px]:max-[1023px]:gap-4 min-[768px]:max-[1023px]:space-y-0">

      {/* Sección Grupos */}
      <div className="justify-items-center w-full max-w-[320px] justify-self-center min-w-0">

        <h3 className="text-h3 text-text-inverse text-center font-main">
          Grupos usuarios
        </h3>

        <Select
          name="groupId"
          value={selectedGroupId ? String(selectedGroupId) : ""}
          onChange={(e) => onGroupChange(e.target.value)}
          options={groupOptions}
          className="w-full min-w-0"
        />

      </div>

      {/* Sección Usuario individual */}
      <div className="grid gap-2 justify-items-center w-full max-w-[320px] justify-self-center min-w-0">

        <h3 className="text-h3 text-text-inverse text-center font-main">
          Usuario individual
        </h3>

        <Select
          variant="search"
          name="userId"
          value={selectedUserId ? String(selectedUserId) : ""}
          onChange={(e) => onUserChange(e.target.value)}
          options={userOptions}
          className="w-full min-w-0 justify-self-center"
        />

        {selectedUserId && (
          <div className="w-full grid gap-2 mt-1 justify-self-center min-w-0">
            {userGroups.length > 0 ? (
              <div className="grid gap-2 w-full justify-self-center min-w-0">
                {userGroups.map((ug) => (
                  <div
                    key={ug.groupId}
                    className="flex items-center justify-between bg-white rounded px-2 py-1 w-full min-w-0 box-border"
                  >
                    <span className="bg-white rounded-md w-full min-w-0 truncate font-secondary">
                      {ug.group.groupName}
                    </span>
                    <button
                      onClick={() => onRemoveGroup(ug.groupId)}
                      className="text-red-600 hover:text-red-300 text-xs "
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
              <div className="grid gap-1.5 w-full">
                <Select
                  name="groupToAssign"
                  value={groupToAssign}
                  onChange={(e) => setGroupToAssign(e.target.value)}
                  options={assignOptions}
                  className="w-full min-w-0 justify-self-center"
                />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAssign}
                  disabled={!groupToAssign}
                  className="w-full justify-self-center"
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