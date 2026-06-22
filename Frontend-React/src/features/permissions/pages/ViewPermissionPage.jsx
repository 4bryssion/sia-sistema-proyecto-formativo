// frontend/src/features/access/pages/PermissionPage.jsx

import { useState } from "react";
import PermissionsSidebar from "../components/PermissionsSidebar";
import PermissionModule from "../components/PermissionModule";

// Opciones de ejemplo para los Select (sin fetch, solo visual)
const groupOptions = [
  { value: "1", label: "Administradores" },
  { value: "2", label: "Instructores" },
];

const userOptions = [
  { value: "10", label: "Sebastián Arce" },
  { value: "11", label: "Sofía Valencia" },
  { value: "12", label: "José Marín" },
];

// Definición de módulos del sistema y sus permisos (solo visual, sin fetch)
const modules = [
  {
    title: "Gestión usuarios",
    permissions: [
      { codename: "create_user", label: "Crear usuarios" },
      { codename: "list_user", label: "Listar usuarios" },
      { codename: "view_user", label: "Visualizar usuarios" },
      { codename: "update_user", label: "Editar usuarios" },
      { codename: "report_user", label: "Reporte de usuarios" },
      { codename: "delete_user", label: "Eliminar usuarios" },
    ],
  },
  {
    title: "Gestión materiales",
    permissions: [
      { codename: "create_material", label: "Crear materiales" },
      { codename: "list_material", label: "Listar materiales" },
      { codename: "view_material", label: "Visualizar materiales" },
      { codename: "update_material", label: "Editar materiales" },
      { codename: "report_material", label: "Reporte de materiales" },
      { codename: "delete_material", label: "Eliminar materiales" },
    ],
  },
  {
    title: "Gestión marcas",
    permissions: [
      { codename: "create_brand", label: "Crear marcas" },
      { codename: "list_brand", label: "Listar marcas" },
      { codename: "view_brand", label: "Visualizar marcas" },
      { codename: "update_brand", label: "Editar marcas" },
      { codename: "delete_brand", label: "Eliminar marcas" },
    ],
  },
  {
    title: "Gestión préstamos",
    permissions: [
      { codename: "create_loan", label: "Crear préstamos" },
      { codename: "list_loan", label: "Listar préstamos" },
      { codename: "view_loan", label: "Visualizar préstamos" },
      { codename: "update_loan", label: "Editar préstamos" },
    ],
  },
];

export default function ViewPermissionPage() {
  const [selectedGroup, setSelectedGroup] = useState("");
  const [userId, setUserId] = useState("");

  // Lista vacía: sin fetch, sin lógica de permisos reales todavía
  const groupPermissions = [];

  return (
    <div className="p-6 flex gap-10">
      <PermissionsSidebar
        selectedGroup={selectedGroup}
        setSelectedGroup={setSelectedGroup}
        userId={userId}
        setUserId={setUserId}
        groupOptions={groupOptions}
        userOptions={userOptions}
      />

      <div className="flex-1 space-y-6">
        <h1 className="text-xl font-semibold mb-6">Gestión de permisos</h1>

        {modules.map((module) => (
          <PermissionModule
            key={module.title}
            title={module.title}
            permissions={module.permissions}
            groupPermissions={groupPermissions}
          />
        ))}
      </div>
    </div>
  );
}