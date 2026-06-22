// frontend/src/features/access/components/PermissionModule.jsx

import { Checkbox } from "@/shared";

export default function PermissionModule({ title, permissions }) {
  return (
    <div className="flex-1">
      <h3 className="text-center text-sm font-medium mb-3">{title}</h3>

      <div className="space-y-2">
        {permissions.map((permission) => (
          <Checkbox
            key={permission.codename}
            id={permission.codename}
            name={permission.codename}
            label={permission.label}
            checked={false}
            onChange={() => {}}
          />
        ))}
      </div>
    </div>
  );
}