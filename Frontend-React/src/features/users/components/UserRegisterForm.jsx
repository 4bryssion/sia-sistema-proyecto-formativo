import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { userSchema, todayLocalISO } from "@/shared/schemas/userSchema";
import {
  Input, Button, Select, FileInput, Alert,
  CreateAndAssignTrigger, DataPolicyCheckbox,
} from "@/shared";
import userService from "@/shared/services/userService";
import documentTypeService from "@/shared/services/documentTypeService";
import groupService from "@/shared/services/groupService";
import CreateGroupModal from "@/shared/components/groups/CreateGroupModal";
import { generatePassword } from "../utils/generatePassword.js";

// El disparador "Crear y asignar nuevo grupo" estaba escrito aquí a mano; ahora
// es el componente compartido CreateAndAssignTrigger, el mismo que usan los dos
// formularios de material para marca e inventario. Su tamaño mayor de icono y de
// texto se conserva con props, y la casilla que colgaba debajo sigue colgando
// (ahora la de tratamiento de datos) usando su hueco `children`.

const ACCOUNT_TYPE_OPTIONS = [
  { id: "Solidario", value: "Solidario", label: "Solidario" },
  { id: "Cuentadante", value: "Cuentadante", label: "Cuentadante" },
];

// ---------------------------------------------------------------------------
// Retícula del formulario — colocación AUTOMÁTICA.
//
// ---------------------------------------------------------------------------
// Distribución del formulario — retícula de CSS, sin cuentas en JavaScript.
//
// Antes esto era `grid-flow-col` con un número de filas escrito por breakpoint
// (`grid-rows-[repeat(7,auto)]` en lg, 5 en 1400). Ese número salía de dividir
// "13 campos + botón" entre las columnas, así que agregar o quitar un campo
// obligaba a recalcularlo a mano y, si no se hacía, el reparto se rompía. Se
// eliminó (sesión 4) junto con los hooks que medían el ancho: el proyecto
// prohíbe hardcodear la responsividad.
//
// Ahora los campos van en una retícula normal que crece de 1 a 3 columnas y se
// llena por filas. Agregar un campo no obliga a tocar nada más.
//
// La columna de la imagen sale de la retícula y pasa a ser HERMANA del bloque de
// campos: así su altura —vacía o con foto— nunca estira una fila ni abre huecos,
// que era el motivo por el que antes necesitaba `col-start-1 + row-span-full`.
// ---------------------------------------------------------------------------

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
    // (p48) Las dos fechas son obligatorias. La de inicio arranca en HOY porque
    // es el caso normal —se registra a alguien que empieza ahora—, pero se puede
    // mover al pasado para alguien que ya venía vinculado.
    userStartDate: todayLocalISO(),
    userEndDate: "",
    userEmail: "",
    userEmailInstitutional: "",
    userAddress: "",
    // Contraseña temporal generada al montar el formulario. El administrador
    // nunca la escribe ni la ve: viaja al backend y llega al usuario por correo.
    // Se genera aquí, en el inicializador perezoso de useState, y no en un
    // efecto: así existe desde el primer render y no provoca un render extra.
    userPassword: generatePassword(),
    // (p48) Tratamiento de datos personales: sin aceptar no se crea el usuario.
    // Sustituye a la casilla "es instructor de planta", que desapareció junto con
    // la excepción de fecha de finalización que la justificaba.
    dataPolicyAccepted: false,
    image: [],
  });
  const [errors, setErrors] = useState({});

  // Declarada ANTES del efecto que la usa: al revés, el efecto capturaría la
  // referencia antes de existir y no se actualizaría si la función cambiara
  const fetchGroups = () =>
    groupService
      .getAll()
      .then((gs) =>
        // El grupo SuperAdmin ya viene excluido por el backend (systemIdentities.js)
        setGroups(
          gs.map((g) => ({
            id: g.id,
            value: String(g.id),
            label: g.groupName,
          })),
        ),
      )
      .catch(() => setGroups([]));

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
      return { ...prev, [name]: type === "checkbox" ? checked : value };
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
    if (d.userEmailInstitutional)
      fd.append("userEmailInstitutional", d.userEmailInstitutional);
    if (d.userSecondPhone) fd.append("userSecondPhone", d.userSecondPhone);
    // (p48) La foto pasó a ser OPCIONAL: sin ella, la interfaz muestra un icono
    if (formData.image?.length) fd.append("image", formData.image[0]);

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
    }
  };

  // La casilla cuelga del disparador para que ambos compartan caja y se muevan
  // juntos entre breakpoints.
  // Se renderiza en dos instancias (una dentro de la columna de la imagen, para
  // lg en adelante; otra suelta, para el resto), así que cada una necesita su
  // propio id: dos elementos con el mismo id romperían la asociación label/input.
  const dataPolicy = (id) => (
    <DataPolicyCheckbox
      id={id}
      name="dataPolicyAccepted"
      checked={formData.dataPolicyAccepted}
      onChange={handleChange}
      error={errors.dataPolicyAccepted}
      className="self-stretch"
    />
  );

  // El disparador compartido, con la casilla colgando debajo
  const groupTrigger = (id, className) => (
    <CreateAndAssignTrigger
      label="Crear y asignar nuevo grupo"
      onClick={() => setIsGroupModalOpen(true)}
      className={className}
      hitSize={44}
      iconSize={26}
      textClassName="text-medium"
    >
      {dataPolicy(id)}
    </CreateAndAssignTrigger>
  );

  return (
    <div className="flex justify-center pt-4">
      {/* Cuadro blanco que envuelve el formulario sobrepasándolo 32px (p-8) y se ajusta al contenido */}
      {/* w-fit desde lg, no desde md: `w-fit` hace que la tarjeta se ajuste al
          contenido, así que el `w-full` del formulario y de los campos no tenía
          ancho disponible al que crecer y los inputs se quedaban en su tamaño
          natural. Mientras hay una sola columna (hasta md) la tarjeta ocupa todo
          el ancho; desde lg, que ya reparte en columnas, se ajusta al contenido. */}
      <div className="bg-white rounded-xl shadow-sm p-8 mx-6 w-full md:mx-12 1400:mx-0 1400:w-fit">
      <form className="flex flex-col items-center gap-8 lg:flex-row lg:items-start" onSubmit={handleSubmit}>

        {/* Columna de la imagen: hermana del bloque de campos, NO parte de la
            retícula. Desde lg lleva dentro el trigger, así queda al comienzo de
            la izquierda y la previsualización lo empuja hacia abajo sin tocar
            ninguna fila de campos. */}
        <div className="flex flex-col items-center gap-6 shrink-0 self-start lg:w-45 1400:gap-8">
          {/* (p48) La foto dejó de ser obligatoria: sin ella el sistema muestra
              un icono de usuario en su lugar */}
          <FileInput
            accept="image/*"
            multiple={false}
            label="Cargar imagen (opcional)"
            directionClassName="flex-col-reverse sm:flex-row md:flex-col-reverse"
            value={formData.image}
            onChange={(files) =>
              setFormData((prev) => ({ ...prev, image: files }))
            }
            error={errors.image}
          />

          {groupTrigger("dataPolicyAside", "hidden lg:flex items-start")}
        </div>

        {/* Campos: retícula que crece de 1 a 3 columnas. `items-start` impide
            que un campo estire a sus vecinos de fila. */}
        <div className="grid w-full grid-cols-1 items-start gap-x-5 gap-y-6 justify-items-center lg:w-auto lg:grid-cols-2 1400:grid-cols-3">

        <Input
          widthClass="w-full lg:max-w-[320px]"
          label="Nombre"
          name="userFirstName"
          required
          value={formData.userFirstName}
          onChange={handleChange}
          error={errors.userFirstName}
          placeholder="Ej: Sofía"
        />
        <Input
          widthClass="w-full lg:max-w-[320px]"
          label="Apellido"
          name="userLastName"
          required
          value={formData.userLastName}
          onChange={handleChange}
          error={errors.userLastName}
          placeholder="Ej: Cardona"
        />
        <Select
          widthClass="w-full lg:max-w-[320px]"
          label="Tipo de documento"
          name="documentTypeId"
          required
          options={documentTypes}
          value={formData.documentTypeId}
          onChange={handleChange}
          error={errors.documentTypeId}
        />
        <Input
          widthClass="w-full lg:max-w-[320px]"
          label="Número de documento"
          name="userDocumentNumber"
          required
          value={formData.userDocumentNumber}
          onChange={handleChange}
          error={errors.userDocumentNumber}
          placeholder="Ej: 1078546789"
        />
        <Input
          widthClass="w-full lg:max-w-[320px]"
          label="Teléfono"
          name="userPhone"
          required
          type="tel"
          value={formData.userPhone}
          onChange={handleChange}
          error={errors.userPhone}
          placeholder="Ej: 3125667890"
        />
        <Input
          widthClass="w-full lg:max-w-[320px]"
          label="Teléfono secundario (opcional)"
          name="userSecondPhone"
          type="tel"
          value={formData.userSecondPhone}
          onChange={handleChange}
          error={errors.userSecondPhone}
          placeholder="Ej: 6041234567 (opcional)"
        />
        <Select
          widthClass="w-full lg:max-w-[320px]"
          label="Tipo de usuario"
          name="userAccountType"
          required
          options={ACCOUNT_TYPE_OPTIONS}
          value={formData.userAccountType}
          onChange={handleChange}
          error={errors.userAccountType}
        />
        <Select
          widthClass="w-full lg:max-w-[320px]"
          label="Grupo"
          name="groupId"
          required
          options={groups}
          value={formData.groupId}
          onChange={handleChange}
          error={errors.groupId}
        />
        {/* (p48) La vigencia del vínculo gobierna el acceso: antes de la fecha
            de inicio el login rechaza, y cumplida la de finalización el usuario
            se desactiva solo. La de inicio SÍ admite fechas pasadas (alguien que
            ya venía vinculado), por eso no lleva `min`. */}
        <Input
          widthClass="w-full lg:max-w-[320px]"
          label="Fecha de inicio"
          name="userStartDate"
          type="date"
          required
          title="Antes de esta fecha el usuario no podrá iniciar sesión"
          value={formData.userStartDate}
          onChange={handleChange}
          error={errors.userStartDate}
        />
        <Input
          widthClass="w-full lg:max-w-[320px]"
          label="Fecha de finalización"
          name="userEndDate"
          type="date"
          min={formData.userStartDate || todayLocalISO()}
          required
          title="Al cumplirse, el usuario se desactiva automáticamente"
          value={formData.userEndDate}
          onChange={handleChange}
          error={errors.userEndDate}
        />
        <Input
          widthClass="w-full lg:max-w-[320px]"
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
          widthClass="w-full lg:max-w-[320px]"
          label="Correo institucional (opcional)"
          name="userEmailInstitutional"
          type="email"
          value={formData.userEmailInstitutional}
          onChange={handleChange}
          error={errors.userEmailInstitutional}
          placeholder="Ej: scardona@soy.sena.edu.co (opcional)"
        />
        <Input
          widthClass="w-full lg:max-w-[320px]"
          label="Dirección"
          name="userAddress"
          required
          value={formData.userAddress}
          onChange={handleChange}
          error={errors.userAddress}
          placeholder="Ej: Calle 12 # 5-8"
        />
        {/* Contraseña automática: el campo es solo informativo. El value real
            vive en formData.userPassword y nunca se muestra; readOnly (y no
            disabled) para que siga siendo legible y no se vea apagado. */}
        <Input
          widthClass="w-full lg:max-w-[320px]"
          label="Contraseña"
          name="userPasswordDisplay"
          required
          type="text"
          value="Automática"
          readOnly
          title="Se genera automáticamente y se envía al correo personal del usuario"
          error={errors.userPassword}
        />

        {/* Trigger + checkbox para base, sm y md. Desde lg se usa la instancia
            que vive dentro de la columna de la imagen (al comienzo de la
            izquierda). Aquí queda entre la contraseña y el botón por su posición
            en el JSX: centrado en base y md, pegado al comienzo en sm. */}
        </div>
      </form>

      {/* Trigger (hasta md) y botón, fuera de la retícula para que su posición no
          dependa del reparto. Desde lg se usa la instancia que vive dentro de la
          columna de la imagen. */}
      <div className="mt-8 flex flex-col items-center gap-6 sm:items-start md:items-center lg:hidden">
        {groupTrigger("dataPolicy", "flex items-center")}
      </div>

      <div className="mt-6 flex justify-center">
        <Button variant="primary" size="md" type="submit" onClick={handleSubmit}>
          Crear Usuario
        </Button>
      </div>


      <CreateGroupModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        onSave={handleGroupCreated}
      />
      </div>
    </div>
  );
}
