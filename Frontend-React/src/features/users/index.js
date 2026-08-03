export { default as CreateUserPage } from "./pages/CreateUserPage";

export { default as ListUserPage } from "./pages/ListUserPage";

// Visualizar y editar dejaron de ser páginas: ahora son modales (jul-2026).
// Se exportan porque el Navbar los monta para "Mi perfil".
export { default as ViewUserModal } from "./components/ViewUserModal";

export { default as EditUserModal } from "./components/EditUserModal";
