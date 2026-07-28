import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { userSchema, todayLocalISO } from "../schemas/userSchema.js";
import { Input, Button, Select, FileInput, IconButton, Alert } from "@/shared";
import { Plus } from "lucide-react";
import userService from "../services/userService.js";
import documentTypeService from "../services/documentTypeService.js";
import groupService from "@/features/groups/services/groupService";
import { CreateGroupModal } from "@/features/groups";

// Trigger "Crear y asignar nuevo grupo": IconButton (+) con texto; abre CreateGroupModal
// Las clases de display (flex/hidden por breakpoint) las aporta el consumidor
// vía className para evitar conflictos entre utilidades de display
function GroupModalTrigger({ onClick, className = "", checkbox }) {
  return (
    <div className={`flex-col gap-3 ${className}`}>
      <div className="flex items-center gap-2">
      <IconButton ariaLabel="Crear y asignar nuevo grupo" onClick={onClick} hitSize={36} iconSize={20}>
        <Plus strokeWidth={2.5} />
      </IconButton>
      <button
        type="button"
        onClick={onClick}
        className="text-caption text-left cursor-pointer underline-offset-2 hover:underline"
      >
        Crear y asignar nuevo grupo
      </button>
      </div>

      {/* Misma caja que el trigger, debajo: evita romper el diseño responsive */}
      {checkbox}
    </div>
  );
}

const ACCOUNT_TYPE_OPTIONS = [
  { id: "Solidario", value: "Solidario", label: "Solidario" },
  { id: "Cuentadante", value: "Cuentadante", label: "Cuentadante" },
];

export default function UserRegisterForm() {
  const navigate = useNavigate();

  const [documentTypes, setDocumentTypes] = useState([]);
  const [groups, setGroups] = useState([]);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    userFirstName: "",
    userLastName: "",
    documentTypeId: "",
    userDocumentNumber: "",
    userPhone: "",
    userSecondPhone: "",
    userAccountType: "",
    groupId: "",
    userEndDate: "",
    userEmail: "",
    userEmailInstitutional: "",
    userAddress: "",
    userPassword: "",
    // Instructor de planta / administrador: sin fecha de finalización obligatoria
    isStaffInstructor: false,
    image: [],
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    documentTypeService
      .getAll()
      .then((dts) =>
        setDocumentTypes(
          dts.map((d) => ({
            id: d.id,
            value: String(d.id),
            label: d.documentName,
          })),
        ),
      )
      .catch(() => setDocumentTypes([]));
    fetchGroups();
  }, []);

  const fetchGroups = () =>
    groupService
      .getAll()
      .then((gs) =>
        setGroups(
          gs
            .filter((g) => g.groupName !== "SuperAdmin")
            .map((g) => ({
              id: g.id,
              value: String(g.id),
              label: g.groupName,
            })),
        ),
      )
      .catch(() => setGroups([]));

  // Grupo recién creado desde el modal (sin permisos aún): al finalizar la creación
  // del usuario se ofrece ir al módulo de permisos a asignárselos
  const [newGroupNoPerms, setNewGroupNoPerms] = useState(null);

  // Al crear un grupo desde el modal se refresca la lista y se autoselecciona
  const handleGroupCreated = async (createdGroup) => {
    await fetchGroups();
    if (createdGroup?.id) {
      setFormData((prev) => ({ ...prev, groupId: String(createdGroup.id) }));
      setNewGroupNoPerms(createdGroup);
      Alert.error(
        "Grupo sin permisos",
        `El grupo "${createdGroup.groupName}" fue creado pero no tiene permisos asignados. Al finalizar la creación del usuario podrás ir a asignárselos.`
      );
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: type === "checkbox" ? checked : value };
      // Al marcar "instructor de planta" la fecha deja de aplicar y se limpia
      if (name === "isStaffInstructor" && checked) next.userEndDate = "";
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const result = userSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors = {};
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0]] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }
    if (!formData.image || formData.image.length === 0) {
      setErrors({ image: "La foto es requerida" });
      return;
    }

    const d = result.data;
    const fd = new FormData();
    fd.append("userFirstName", d.userFirstName);
    fd.append("userLastName", d.userLastName);
    fd.append("documentTypeId", d.documentTypeId);
    fd.append("userDocumentNumber", d.userDocumentNumber);
    // Instructor de planta: sin fecha de finalización → no se envía el campo
    if (d.userEndDate) fd.append("userEndDate", d.userEndDate);
    fd.append("userEmail", d.userEmail);
    fd.append("userPhone", d.userPhone);
    fd.append("userAddress", d.userAddress);
    fd.append("userAccountType", d.userAccountType);
    fd.append("groupId", d.groupId);
    fd.append("userPassword", d.userPassword);
    if (d.userEmailInstitutional)
      fd.append("userEmailInstitutional", d.userEmailInstitutional);
    if (d.userSecondPhone) fd.append("userSecondPhone", d.userSecondPhone);
    fd.append("image", formData.image[0]);

    // Confirmación previa: datos correctos + envío de credenciales (CLAUDE.md §20)
    const confirm = await Alert.confirm(
      "¿Crear usuario?",
      `Verifica que los datos sean correctos. Se enviarán las credenciales de inicio de sesión al correo personal ${d.userEmail}.`
    );
    if (!confirm.isConfirmed) return;

    try {
      Alert.loading("Creando usuario...", "Enviando credenciales por correo");
      const res = await userService.create(fd);
      Alert.close();
      setErrors({});

      // Alertas dinámicas según el resultado del envío de credenciales (§20)
      if (res.emailSent) {
        await Alert.success(
          "Usuario creado exitosamente",
          "Las credenciales fueron enviadas exitosamente al correo personal del usuario."
        );
      } else {
        await Alert.error(
          "Usuario creado, pero el correo falló",
          res.emailError === "invalid_recipient"
            ? "El correo electrónico fue rechazado (dirección incorrecta). El usuario puede recuperar su contraseña desde el login."
            : "Falló la entrega de credenciales por un error del servicio de correo. El usuario puede recuperar su contraseña desde el login."
        );
      }

      // Grupo creado desde el modal sin permisos: ofrecer ir a asignárselos (§20)
      if (newGroupNoPerms) {
        const goPerms = await Alert.warning(
          "Grupo sin permisos asignados",
          `¿Deseas ir al módulo de permisos para asignarle permisos al grupo "${newGroupNoPerms.groupName}", o quedarte en listar usuarios?`
        );
        if (goPerms.isConfirmed) {
          navigate("/dashboard/groups");
          return;
        }
      }
      navigate("/dashboard/users");
    } catch (error) {
      Alert.close();
      const status = error.response?.status;
      const det = error.response?.data?.detalles;
      const msg = det?.length ? det.join(" · ") : (error.response?.data?.error ?? "Error al crear el usuario");
      // 409 (unique P2002): correo personal duplicado (§20 caso 4)
      Alert.error(
        "Error en la creación del usuario",
        status === 409 && msg.includes("user_email")
          ? "El correo personal ya está asignado a otra cuenta."
          : msg
      );
      setErrors({ form: msg });
    }
  };

  return (
    <div className="flex justify-center pt-4">
      {/* Cuadro blanco que envuelve el formulario sobrepasándolo 32px (p-8) y se ajusta al contenido */}
      <div className="bg-white rounded-xl shadow-sm p-8 mx-6 w-full md:mx-12 md:w-fit 1400:mx-0">
      <form
        className="grid gap-x-5 gap-y-6 w-full md:max-w-max md:grid-cols-2 lg:grid-cols-3 justify-items-center"
        onSubmit={handleSubmit}
      >
        <div className="flex flex-col gap-2 w-full md:max-w-[320px] md:col-start-1 md:row-start-1 md:row-span-2 lg:col-start-1 lg:row-start-1 lg:row-span-2">
          <FileInput
            className="h-37"
            accept="image/*"
            multiple={false}
            value={formData.image}
            onChange={(files) =>
              setFormData((prev) => ({ ...prev, image: files }))
            }
            children="Cargar imagen"
          />
          {errors.image && (
            <p className="text-error text-caption">{errors.image}</p>
          )}
        </div>

        <Input
          className="md:col-start-1 md:row-start-3 lg:col-start-1 lg:row-start-3"
          label="Nombre"
          name="userFirstName"
          required
          value={formData.userFirstName}
          onChange={handleChange}
          error={errors.userFirstName}
          placeholder="Ej: Sofía"
        />
        <Input
          className="md:col-start-1 md:row-start-4 lg:col-start-1 lg:row-start-4"
          label="Apellido"
          name="userLastName"
          required
          value={formData.userLastName}
          onChange={handleChange}
          error={errors.userLastName}
          placeholder="Ej: Cardona"
        />
        <Select
          className="md:col-start-1 md:row-start-5 lg:col-start-1 lg:row-start-5"
          label="Tipo de documento"
          name="documentTypeId"
          required
          options={documentTypes}
          value={formData.documentTypeId}
          onChange={handleChange}
          error={errors.documentTypeId}
        />
        <Input
          className="md:col-start-1 md:row-start-6 lg:col-start-2 lg:row-start-1"
          label="Número de documento"
          name="userDocumentNumber"
          required
          value={formData.userDocumentNumber}
          onChange={handleChange}
          error={errors.userDocumentNumber}
          placeholder="Ej: 1078546789"
        />
        <Input
          className="md:col-start-1 md:row-start-7 lg:col-start-2 lg:row-start-2"
          label="Teléfono"
          name="userPhone"
          required
          type="tel"
          value={formData.userPhone}
          onChange={handleChange}
          error={errors.userPhone}
          placeholder="Ej: 3125667890"
        />
        <Select
          className="md:col-start-1 md:row-start-8 lg:col-start-2 lg:row-start-4"
          label="Tipo de cuenta"
          name="userAccountType"
          required
          options={ACCOUNT_TYPE_OPTIONS}
          value={formData.userAccountType}
          onChange={handleChange}
          error={errors.userAccountType}
        />

        <Input
          className="md:col-start-2 md:row-start-1 lg:col-start-2 lg:row-start-3"
          label="Teléfono secundario (opcional)"
          name="userSecondPhone"
          type="tel"
          value={formData.userSecondPhone}
          onChange={handleChange}
          error={errors.userSecondPhone}
          placeholder="Ej: 6041234567 (opcional)"
        />
        <Select
          className="md:col-start-2 md:row-start-2 lg:col-start-2 lg:row-start-5"
          label="Grupo (rol)"
          name="groupId"
          required
          options={groups}
          value={formData.groupId}
          onChange={handleChange}
          error={errors.groupId}
        />

        <Input
          className="md:col-start-2 md:row-start-3 lg:col-start-3 lg:row-start-1"
          label="Fecha de finalización"
          name="userEndDate"
          type="date"
          min={todayLocalISO()}
          required={!formData.isStaffInstructor}
          disabled={formData.isStaffInstructor}
          value={formData.userEndDate}
          onChange={handleChange}
          error={errors.userEndDate}
        />
        <Input
          className="md:col-start-2 md:row-start-4 lg:col-start-3 lg:row-start-2"
          label="Correo personal"
          name="userEmail"
          required
          type="email"
          value={formData.userEmail}
          onChange={handleChange}
          error={errors.userEmail}
          placeholder="Ej: sofia@correo.com"
        />
        <Input
          className="md:col-start-2 md:row-start-5 lg:col-start-3 lg:row-start-3"
          label="Correo institucional (opcional)"
          name="userEmailInstitutional"
          type="email"
          value={formData.userEmailInstitutional}
          onChange={handleChange}
          error={errors.userEmailInstitutional}
          placeholder="Ej: scardona@soy.sena.edu.co (opcional)"
        />
        <Input
          className="md:col-start-2 md:row-start-6 lg:col-start-3 lg:row-start-4"
          label="Dirección"
          name="userAddress"
          required
          value={formData.userAddress}
          onChange={handleChange}
          error={errors.userAddress}
          placeholder="Ej: Calle 12 # 5-8"
        />
        <Input
          className="md:col-start-2 md:row-start-7 lg:col-start-3 lg:row-start-5"
          label="Contraseña"
          name="userPassword"
          required
          type="password"
          value={formData.userPassword}
          onChange={handleChange}
          error={errors.userPassword}
          placeholder="Mín 8, mayús, minús, número y símbolo"
        />

        {/* Trigger de crear grupo:
            base (<640) y md (768-1023): entre el input de contraseña y el botón de crear;
            lg (≥1024): al final de la primera columna, pegado a la izquierda;
            en sm (640-767) se oculta aquí y se muestra junto al botón (abajo) */}
        <GroupModalTrigger
          onClick={() => setIsGroupModalOpen(true)}
          checkbox={
            <label className="flex items-center gap-2 text-caption cursor-pointer">
              <input
                type="checkbox"
                name="isStaffInstructor"
                checked={formData.isStaffInstructor}
                onChange={handleChange}
                className="cursor-pointer"
              />
              Es instructor de planta
            </label>
          }
          className="flex sm:hidden md:flex md:col-start-2 md:row-start-8 lg:col-start-1 lg:row-start-6 lg:justify-self-start"
        />

        {errors.form && (
          <p className="text-error text-caption md:col-start-2 md:row-start-9 lg:col-start-3 lg:row-start-6">
            {errors.form}
          </p>
        )}

        <div className="flex items-center justify-center gap-6 md:col-start-2 md:row-start-9 lg:col-start-3 lg:row-start-7">
          {/* En sm (640-767) el trigger va al lado izquierdo del botón, separados por 24px (gap-6) */}
          <GroupModalTrigger
            onClick={() => setIsGroupModalOpen(true)}
          checkbox={
            <label className="flex items-center gap-2 text-caption cursor-pointer">
              <input
                type="checkbox"
                name="isStaffInstructor"
                checked={formData.isStaffInstructor}
                onChange={handleChange}
                className="cursor-pointer"
              />
              Es instructor de planta
            </label>
          }
            className="hidden sm:flex md:hidden"
          />
          <Button variant="primary" size="sm" type="submit">
            Crear Usuario
          </Button>
        </div>
      </form>

      <CreateGroupModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        onSave={handleGroupCreated}
      />
      </div>
    </div>
  );
}