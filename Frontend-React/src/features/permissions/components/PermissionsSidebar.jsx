// frontend/src/features/access/components/PermissionsSidebar.jsx

import { Select } from "@/shared";

export default function PermissionssSidebar({
  selectedGroup,
  setSelectedGroup,
  userId,
  setUserId,
  groupOptions,
  userOptions,
}) {

  return (
    <aside className="w-[350px] space-y-12">
      <section>
        <h2 className="text-lg font-semibold mb-6">Grupos usuarios</h2>

        <Select
          name="groupId"
          value={selectedGroup}
          onChange={(e) => {
            setSelectedGroup(e.target.value);
            setUserId("");
          }}
          options={groupOptions}
        />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-6">Usuario individual</h2>

        <Select
          name="userId"
          value={userId}
          onChange={(e) => {
            setUserId(e.target.value);
            setSelectedGroup("");
          }}
          options={userOptions}
        />
      </section>
    </aside>
  );
}