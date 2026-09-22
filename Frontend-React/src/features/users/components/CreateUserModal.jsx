import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { userSchema, todayLocalISO } from "@/shared/schemas/userSchema";
import {
  Input, Select, FileInput, Alert, MultiStepModal,
  CreateAndAssignTrigger, DataPolicyCheckbox,
} from "@/shared";
import userService from "@/shared/services/userService";
import documentTypeService from "@/shared/services/documentTypeService";
import groupService from "@/shared/services/groupService";
import CreateGroupModal from "@/shared/components/groups/CreateGroupModal";
import { generatePassword } from "../utils/generatePassword.js";

// (p49) Crear usuario pasó de página a modal por pasos.
//
// Lo que se fue con la página, y por qué era un problema:
// - La retícula de 1→2→3 columnas con `lg:max-w-[320px]` en cada campo: catorce
//   medidas escritas a mano que había que mantener sincronizadas. Aquí cada paso
//   tiene pocos campos, así que basta con una retícula de 1→2 columnas y campos
//   al ancho disponible: ninguna medida.
// - Dos instancias del mismo disparador y de la misma casilla, una visible hasta
//   md y otra desde lg, cada una con su propio id para no romper la asociación
//   label/input. Con los campos repartidos en pasos no hay dos sitios donde
//   ponerlos: hay uno.
//
// El estado del formulario vive AQUÍ y no dentro de cada paso: MultiStepModal
// solo monta el paso visible, así que un estado que viviera en el JSX de un paso
// se perdería al avanzar.

const ACCOUNT_TYPE_OPTIONS = [
  { id: "Solidario", value: "Solidario", label: "Solidario" },
  { id: "Cuentadante", value: "Cuentadante", label: "Cuentadante" },
];

// Qué campos pertenecen a cada paso. Es la ÚNICA lista de este archivo, y existe
// para una cosa concreta: al validar, enseñar solo los errores del paso que el
// usuario tiene delante. Sin ella, equivocarse en el paso 1 pintaría también los
// errores de campos que todavía no ha visto.
const CAMPOS_POR_PASO = [
  ["userFirstName", "userLastName"],
  ["documentTypeId", "userDocumentNumber", "userPhone", "userSecondPhone",
   "userEmail", "userEmailInstitutional", "userAddress"],
  ["userAccountType", "groupId", "userStartDate", "userEndDate"],
  ["image", "userPassword", "dataPolicyAccepted"],
];

export default function CreateUserModal({ isOpen, onClose, onSaved }) {
  // El cuerpo solo se monta con el modal abierto: así cada apertura arranca en el
  // paso 1 y con los campos vacíos, sin un useEffect que haga setState.
  if (!isOpen) return null;

  return <CreateUserBody onClose={onClose} onSaved={onSaved} />;
}

function CreateUserBody({ onClose, onSaved }) {
  const navigate = useNavigate();

  const [documentTypes, setDocumentTypes] = useState([]);
  const [groups, setGroups] = useState([]);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [formData, setFormData] = useState({
    userFirstName: "",
    userLastName: "",
    documentTypeId: "",
    userDocumentNumber: "",
    userPhone: "",
    userSecondPhone: "",
    userAccountType: "",
    groupId: "",
    // (p48) Las dos fechas son obligatorias. La de inicio arranca en HOY porque
    // es el caso normal —se registra a alguien que empieza ahora—, pero se puede
    // mover al pasado para alguien que ya venía vinculado.
    userStartDate: todayLocalISO(),
    userEndDate: "",
    userEmail: "",
    userEmailInstitutional: "",
    userAddress: "",
    // Contraseña temporal generada al montar. El administrador nunca la escribe
    // ni la ve: viaja al backend y llega al usuario por correo. Se genera en el
    // inicializador perezoso de useState, no en un efecto, para que exista desde
    // el primer render y no provoque un render extra.
    userPassword: generatePassword(),
    // (p48) Tratamiento de datos personales: sin aceptar no se crea el usuario.
    dataPolicyAccepted: false,
    image: [],
  });
  const [errors, setErrors] = useState({});

  const fetchGroups = () =>
    groupService
      .getAll()
      .then((gs) =>
        // El grupo SuperAdmin ya viene excluido por el backend (systemIdentities.js)
        setGroups(gs.map((g) => ({ id: g.id, value: String(g.id), label: g.groupName }))),
      )
      .catch(() => setGroups([]));

  useEffect(() => {
    documentTypeService
      .getAll()
      .then((dts) =>
        setDocumentTypes(dts.map((d) => ({ id: d.id, value: String(d.id), label: d.documentName }))),
      )
      .catch(() => setDocumentTypes([]));
    fetchGroups();
  }, []);

  // Grupo recién creado desde el modal (sin permisos aún): al terminar se ofrece
  // ir al módulo de permisos a asignárselos
  const [newGroupNoPerms, setNewGroupNoPerms] = useState(null);

  const handleGroupCreated = async (createdGroup) => {
    await fetchGroups();
    if (!createdGroup?.id) return;
    setFormData((prev) => ({ ...prev, groupId: String(createdGroup.id) }));
    setNewGroupNoPerms(createdGroup);
    Alert.error(
      "Grupo sin permisos",
      `El grupo "${createdGroup.groupName}" fue creado pero no tiene permisos asignados. Al finalizar la creación del usuario podrás ir a asignárselos.`,
    );
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  // Valida el formulario completo pero solo PINTA los errores de los campos del
  // paso indicado. El schema se aplica entero porque tiene reglas que cruzan
  // campos (la fecha de finalización contra la de inicio, el correo institucional
  // contra el personal) y trocearlo las perdería.
  const validarPaso = (indice) => {
    const result = userSchema.safeParse(formData);
    if (result.success) {
      setErrors({});
      return true;
    }

    const todos = {};
    result.error.issues.forEach((issue) => {
      if (!(issue.path[0] in todos)) todos[issue.path[0]] = issue.message;
    });

    const delPaso = {};
    CAMPOS_POR_PASO[indice].forEach((campo) => {
      if (todos[campo]) delPaso[campo] = todos[campo];
    });
    setErrors(delPaso);
    return Object.keys(delPaso).length === 0;
  };

  const handleSubmit = async () => {
    const result = userSchema.safeParse(formData);
    // MultiStepModal ya validó los cuatro pasos antes de llegar aquí; esto es la
    // red de seguridad por si un campo no estuviera asignado a ningún paso.
    if (!result.success) {
      Alert.error("Faltan datos", result.error.issues[0]?.message ?? "Revisa el formulario.");
      return;
    }

    const d = result.data;
    const fd = new FormData();
    fd.append("userFirstName", d.userFirstName);
    fd.append("userLastName", d.userLastName);
    fd.append("documentTypeId", d.documentTypeId);
    fd.append("userDocumentNumber", d.userDocumentNumber);
    // (p48) Las dos fechas van siempre: son obligatorias en el backend
    fd.append("userStartDate", d.userStartDate);
    fd.append("userEndDate", d.userEndDate);
    // (p48) El backend lo exige como `true` y persiste la FECHA de aceptación
    fd.append("dataPolicyAccepted", "true");
    fd.append("userEmail", d.userEmail);
    fd.append("userPhone", d.userPhone);
    fd.append("userAddress", d.userAddress);
    fd.append("userAccountType", d.userAccountType);
    fd.append("groupId", d.groupId);
    fd.append("userPassword", d.userPassword);
    if (d.userEmailInstitutional) fd.append("userEmailInstitutional", d.userEmailInstitutional);
    if (d.userSecondPhone) fd.append("userSecondPhone", d.userSecondPhone);
    // (p48) La foto es OPCIONAL: sin ella, la interfaz muestra un icono
    if (formData.image?.length) fd.append("image", formData.image[0]);

    // Confirmación previa: datos correctos + envío de credenciales (CLAUDE.md §20)
    const confirm = await Alert.confirm(
      "¿Crear usuario?",
      `Verifica que los datos sean correctos. Se enviarán las credenciales de inicio de sesión al correo personal ${d.userEmail}.`,
    );
    if (!confirm.isConfirmed) return;

    setGuardando(true);
    try {
      Alert.loading("Creando usuario...", "Enviando credenciales por correo");
      const res = await userService.create(fd);
      Alert.close();

      // El modal se cierra ANTES de las alertas de resultado: si no, quedarían
      // apiladas sobre un formulario que ya no sirve para nada.
      onSaved?.();
      onClose?.();

      // Alertas dinámicas según el resultado del envío de credenciales (§20)
      if (res.emailSent) {
        await Alert.success(
          "Usuario creado exitosamente",
          "Las credenciales fueron enviadas exitosamente al correo personal del usuario.",
        );
      } else {
        await Alert.error(
          "Usuario creado, pero el correo falló",
          res.emailError === "invalid_recipient"
            ? "El correo electrónico fue rechazado (dirección incorrecta). El usuario puede recuperar su contraseña desde el login."
            : "Falló la entrega de credenciales por un error del servicio de correo. El usuario puede recuperar su contraseña desde el login.",
        );
      }

      // Grupo creado desde el modal sin permisos: ofrecer ir a asignárselos (§20)
      if (newGroupNoPerms) {
        const goPerms = await Alert.warning(
          "Grupo sin permisos asignados",
          `¿Deseas ir al módulo de permisos para asignarle permisos al grupo "${newGroupNoPerms.groupName}", o quedarte en listar usuarios?`,
        );
        if (goPerms.isConfirmed) navigate("/dashboard/groups");
      }
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
          : msg,
      );
    } finally {
      setGuardando(false);
    }
  };

  // Retícula común a todos los pasos: una columna en móvil, dos desde sm. No hay
  // anchos escritos — los campos ocupan su celda y la celda la reparte la
  // retícula. `items-start` impide que un campo con error estire a su vecino.
  const rejilla = (children) => (
    <div className="grid grid-cols-1 items-start gap-x-6 gap-y-5 sm:grid-cols-2">
      {children}
    </div>
  );

  const campo = (props) => (
    <Input widthClass="w-full" onChange={handleChange} {...props} />
  );

  const pasos = [
    {
      titulo: "Datos personales",
      validate: () => validarPaso(0),
      contenido: rejilla(
        <>
          {campo({ label: "Nombre", name: "userFirstName", required: true,
                   value: formData.userFirstName, error: errors.userFirstName,
                   placeholder: "Ej: Sofía" })}
          {campo({ label: "Apellido", name: "userLastName", required: true,
                   value: formData.userLastName, error: errors.userLastName,
                   placeholder: "Ej: Cardona" })}
        </>,
      ),
    },
    {
      titulo: "Documento y contacto",
      validate: () => validarPaso(1),
      contenido: rejilla(
        <>
          <Select
            widthClass="w-full"
            label="Tipo de documento"
            name="documentTypeId"
            required
            options={documentTypes}
            value={formData.documentTypeId}
            onChange={handleChange}
            error={errors.documentTypeId}
          />
          {campo({ label: "Número de documento", name: "userDocumentNumber", required: true,
                   value: formData.userDocumentNumber, error: errors.userDocumentNumber,
                   placeholder: "Ej: 1078546789" })}
          {campo({ label: "Teléfono", name: "userPhone", required: true, type: "tel",
                   value: formData.userPhone, error: errors.userPhone,
                   placeholder: "Ej: 3125667890" })}
          {campo({ label: "Teléfono secundario (opcional)", name: "userSecondPhone", type: "tel",
                   value: formData.userSecondPhone, error: errors.userSecondPhone,
                   placeholder: "Ej: 6041234567 (opcional)" })}
          {campo({ label: "Correo personal", name: "userEmail", required: true, type: "email",
                   value: formData.userEmail, error: errors.userEmail,
                   placeholder: "Ej: sofia@correo.com" })}
          {campo({ label: "Correo institucional (opcional)", name: "userEmailInstitutional", type: "email",
                   value: formData.userEmailInstitutional, error: errors.userEmailInstitutional,
                   placeholder: "Ej: scardona@soy.sena.edu.co (opcional)" })}
          <div className="sm:col-span-2">
            {campo({ label: "Dirección", name: "userAddress", required: true,
                     value: formData.userAddress, error: errors.userAddress,
                     placeholder: "Ej: Calle 12 # 5-8" })}
          </div>
        </>,
      ),
    },
    {
      titulo: "Rol y vigencia",
      validate: () => validarPaso(2),
      contenido: (
        <div className="flex flex-col gap-6">
          {rejilla(
            <>
              <Select
                widthClass="w-full"
                label="Tipo de usuario"
                name="userAccountType"
                required
                options={ACCOUNT_TYPE_OPTIONS}
                value={formData.userAccountType}
                onChange={handleChange}
                error={errors.userAccountType}
              />
              <Select
                widthClass="w-full"
                label="Grupo"
                name="groupId"
                required
                options={groups}
                value={formData.groupId}
                onChange={handleChange}
                error={errors.groupId}
              />
              {/* (p48) La vigencia gobierna el acceso: antes de la fecha de
                  inicio el login rechaza, y cumplida la de finalización el
                  usuario se desactiva solo. La de inicio SÍ admite fechas
                  pasadas (alguien que ya venía vinculado), por eso no lleva
                  `min`. */}
              {campo({ label: "Fecha de inicio", name: "userStartDate", type: "date", required: true,
                       title: "Antes de esta fecha el usuario no podrá iniciar sesión",
                       value: formData.userStartDate, error: errors.userStartDate })}
              {campo({ label: "Fecha de finalización", name: "userEndDate", type: "date", required: true,
                       min: formData.userStartDate || todayLocalISO(),
                       title: "Al cumplirse, el usuario se desactiva automáticamente",
                       value: formData.userEndDate, error: errors.userEndDate })}
            </>,
          )}

          <CreateAndAssignTrigger
            label="Crear y asignar nuevo grupo"
            onClick={() => setIsGroupModalOpen(true)}
            className="flex items-center"
            hitSize={44}
            iconSize={26}
            textClassName="text-medium"
          />
        </div>
      ),
    },
    {
      titulo: "Foto y políticas",
      validate: () => validarPaso(3),
      contenido: (
        <div className="flex flex-col items-start gap-8 sm:flex-row sm:items-start sm:gap-10">
          {/* (p48) La foto dejó de ser obligatoria: sin ella el sistema muestra
              un icono de usuario en su lugar.
              slots={1} reserva desde el principio el hueco de la
              previsualización, para que elegir la foto no cambie la altura del
              paso ni desplace lo que hay debajo. */}
          <FileInput
            accept="image/*"
            multiple={false}
            slots={1}
            visibleCount={1}
            label="Cargar imagen (opcional)"
            previewPosition="right"
            value={formData.image}
            onChange={(files) => setFormData((prev) => ({ ...prev, image: files }))}
            error={errors.image}
          />

          <div className="flex w-full flex-col gap-6">
            {/* Contraseña automática: el campo es solo informativo. El valor real
                vive en formData.userPassword y nunca se muestra; readOnly (y no
                disabled) para que siga siendo legible y no se vea apagado. */}
            <Input
              widthClass="w-full"
              label="Contraseña"
              name="userPasswordDisplay"
              required
              type="text"
              value="Automática"
              readOnly
              title="Se genera automáticamente y se envía al correo personal del usuario"
              error={errors.userPassword}
            />

            <DataPolicyCheckbox
              id="dataPolicyAccepted"
              name="dataPolicyAccepted"
              checked={formData.dataPolicyAccepted}
              onChange={handleChange}
              error={errors.dataPolicyAccepted}
            />
          </div>
        </div>
      ),
    },
  ];

  return (
    <>
      <MultiStepModal
        isOpen
        onClose={onClose}
        titulo="Crear Usuario"
        pasos={pasos}
        onSubmit={handleSubmit}
        textoGuardar="Crear Usuario"
        guardando={guardando}
      />

      <CreateGroupModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        onSave={handleGroupCreated}
      />
    </>
  );
}
