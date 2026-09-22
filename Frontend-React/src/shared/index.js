// Shared - Components

export { default as Button } from "./components/Button";
export { Alert } from "./components/utils/alert.js";
export { PermissionsProvider, usePermissions } from "./context/PermissionsContext.jsx";
export { default as RequirePermission } from "./components/auth/RequirePermission.jsx";
export { default as RequirePasswordChange } from "./components/auth/RequirePasswordChange.jsx";
export { default as Card } from "./components/Card";
export { default as Checkbox } from "./components/Checkbox";
export { default as CreateAndAssignTrigger } from "./components/CreateAndAssignTrigger";
// (sesión 4) Nuevos componentes compartidos
export { default as SupportContactButton } from "./components/SupportContactButton";
export { default as DataPolicyCheckbox } from "./components/DataPolicyCheckbox";
export { default as MultiStepModal } from "./components/MultiStepModal";
export { default as DataTable } from "./components/DataTable";

export { 
    Dropdown, 
    DropdownTrigger, 
    DropdownItem, 
    DropdownContent 
} from "./components/DropdownContext"

export { default as FileInput } from "./components/FileInput";
export { default as FilterMenu } from "./components/FilterMenu";
export { IconButton } from "./components/IconButton";
export { default as ImageZoom } from "./components/ImageZoom";
export { default as Input } from "./components/Input";
export { default as ListPageHeader } from "./components/ListPageHeader";
export { default as Modal } from "./components/Modal";
export { default as SearchField } from "./components/SearchField";
export { default as Select } from "./components/Select";
export { default as StatusFilterSelect } from "./components/StatusFilterSelect";
export { default as Switch } from "./components/Switch";
export { default as TextArea } from "./components/TextArea";

// Shared - Hooks


// Shared - Layouts

export { default as Navbar } from "./layouts/Navbar" 
export { default as DashboardLayout } from "./layouts/DashboardLayout"
export { default as ViewLayout } from "./layouts/ViewLayout"
export { default as AuthLayout } from "./layouts/AuthLayout"

// Shared - Schemas


// Shared - Auth

export { default as ProtectedRoute } from "./components/auth/ProtectedRoute";
export { default as GuestRoute } from "./components/auth/GuestRoute";
export { getCurrentUser } from "./services/authStorage";