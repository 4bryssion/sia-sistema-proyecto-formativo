// frontend/src/features/access/components/PermissionModule.jsx

import { Checkbox } from "@/shared";

export default function PermissionModule({ title, permissions, groupPermissions }) {

  return (
    <section className="border rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>

      <div className="flex flex-wrap gap-6">
        {permissions.map((permission) => (
          <Checkbox
            key={permission.codename}
            id={permission.codename}
            name={permission.codename}
            label={permission.label}
            checked={groupPermissions.some(
              (p) => p.permission_codename === permission.codename,
            )}
            onChange={() => {}}
          />
        ))}
      </div>
    </section>
  );
}