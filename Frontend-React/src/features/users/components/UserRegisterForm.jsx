import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { userSchema, todayLocalISO } from "../schemas/userSchema.js";
import { Input, Button, Select, FileInput, IconButton, Checkbox, Alert } from "@/shared";
import { Plus } from "lucide-react";
import userService from "../services/userService.js";
import documentTypeService from "../services/documentTypeService.js";
import groupService from "@/features/groups/services/groupService";
import { CreateGroupModal } from "@/features/groups";
import { generatePassword } from "../utils/generatePassword.js";

// Trigger "Crear y asignar nuevo grupo": IconButton (+) con texto; abre CreateGroupModal.
// Las clases de display y de alineación las aporta el consumidor vía className para
// evitar conflictos entre utilidades de display en los distintos breakpoints.
function GroupModalTrigger({ onClick, className = "", checkbox }) {
  return (
    <div className={`flex-col gap-3 ${className}`}>
      <div className="flex items-center gap-2">
        <IconButton ariaLabel="Crear y asignar nuevo grupo" onClick={onClick} hitSize={44} iconSize={26}>
          <Plus strokeWidth={2.5} />
        </IconButton>
        <button
          type="button"
          onClick={onClick}
          className="text-medium font-secondary text-left cursor-pointer underline-offset-2 hover:underline"
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

// ---------------------------------------------------------------------------
// Retícula del formulario — colocación AUTOMÁTICA.
//
// Ningún campo declara su celda. Antes había una tabla con la columna y la fila
// de cada uno de los 13 campos en cada breakpoint (39 pares de coordenadas
// escritas a mano): cualquier campo que se agregara, quitara o reordenara
// obligaba a recalcularlo todo, y bastaba una coordenada mal puesta para dejar
// un hueco o pisar una celda. Ahora lo resuelve el navegador:
//
//   grid-flow-col + un número de filas por breakpoint = relleno por columnas.
//   Los campos se colocan en el ORDEN EN QUE ESTÁN EN EL JSX: llenan una columna
//   y saltan a la siguiente, que es justamente el recorrido pedido.
//
// La columna de la imagen es el único elemento colocado a mano, y de la forma
// más simple posible: col-start-1 + row-span-full. Al abarcar TODAS las filas no
// comparte ninguna con los inputs, así que su altura —vacía o con foto cargada—
// nunca estira una fila ni abre huecos en las demás columnas. Ese era el origen
// de los espacios raros entre inputs.
//
// El reparto en varias columnas arranca en lg. Hasta md el formulario es de una
// sola columna: a 768px, tres columnas dejaban los campos demasiado apretados.
//
// Filas por breakpoint = elementos a repartir ÷ columnas de inputs:
//   lg   → 3 columnas (1 imagen + 2): 13 inputs + botón = 14 → 7 filas
//   1400 → 4 columnas (1 imagen + 3): 13 inputs + botón = 14 → 5 filas
// (desde lg el trigger vive dentro de la columna de la imagen, por eso no cuenta)
// ---------------------------------------------------------------------------
// repeat(n,auto) y no grid-rows-n: la utilidad numérica de Tailwind genera filas
// de 1fr, o sea TODAS de la misma altura. Bastaría que un campo mostrara un
// mensaje de error para que las demás filas crecieran con él. Con `auto` cada
// fila mide lo que necesita su contenido.
const FORM_GRID = `
  grid gap-x-5 gap-y-6 w-full grid-cols-1 justify-items-center
  lg:max-w-max lg:grid-flow-col lg:grid-cols-3 lg:grid-rows-[repeat(7,auto)]
  1400:grid-cols-4 1400:grid-rows-[repeat(5,auto)]
`;

// Columna de la imagen: abarca todas las filas para no compartir ninguna con
// los inputs. self-start evita que se estire al alto completo de la columna.
const MEDIA_COLUMN = `
  flex flex-col items-center gap-6 justify-self-center
  lg:col-start-1 lg:row-span-full lg:self-start 1400:gap-8
`;

// Este formulario reparte en columnas desde lg, no desde md como la mayoría, así
// que el tope de 320px de los campos también debe empezar en lg: hasta md hay una
// sola columna y los campos deben aprovechar todo el ancho, igual que en móvil.
const FIELD_WIDTH = "w-full lg:max-w-[320px]";

// Envoltorios locales para no repetir la prop en los trece campos. Al declararse
// fuera del componente no se recrean en cada render (React los vería como un tipo
// distinto y remontaría los inputs, perdiendo el foco al escribir).
const Field = (props) => <Input widthClass={FIELD_WIDTH} {...props} />;
const FieldSelect = (props) => <Select widthClass={FIELD_WIDTH} {...props} />;

// Dirección de las previsualizaciones del FileInput por breakpoint.
// El nombre de la clase describe hacia dónde crece la previsualización RESPECTO
// de la caja; como en el DOM la previsualización va antes que la caja, "abajo"
// se consigue con col-reverse y "a la izquierda" con row normal.
//   sm            → a la izquierda
//   el resto      → hacia abajo (empuja el contenido, no se superpone)
// md no necesita clase propia: hereda la de base, y lg y 1400 heredan la de md.
const PREVIEW_DIRECTION = "flex-col-reverse sm:flex-row md:flex-col-reverse";

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
    // Contraseña temporal generada al montar el formulario. El administrador
    // nunca la escribe ni la ve: viaja al backend y llega al usuario por correo.
    // Se genera aquí, en el inicializador perezoso de useState, y no en un
    // efecto: así existe desde el primer render y no provoca un render extra.
    userPassword: generatePassword(),
    // Instructor de planta / administrador: sin fecha de finalización obligatoria
    isStaffInstructor: false,
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

  // El checkbox se pasa como prop al trigger para que ambos compartan caja y se
  // muevan juntos entre breakpoints.
  // Se renderiza en dos instancias (una dentro de la columna de la imagen, para
  // 1400; otra suelta, para el resto), así que cada una necesita su propio id:
  // dos elementos con el mismo id romperían la asociación label/input.
  const staffCheckbox = (id) => (
    <Checkbox
      id={id}
      name="isStaffInstructor"
      label="Es instructor de planta"
      labelClassName="text-medium"
      // self-stretch + justify-center: el checkbox queda centrado en su propio
      // espacio en cualquier breakpoint. self-stretch es necesario porque el
      // contenedor usa items-start/items-center según el tamaño, y eso encogería
      // el label a su contenido dejando el centrado sin efecto.
      className="self-stretch justify-center"
      checked={formData.isStaffInstructor}
      onChange={handleChange}
    />
  );

  return (
    <div className="flex justify-center pt-4">
      {/* Cuadro blanco que envuelve el formulario sobrepasándolo 32px (p-8) y se ajusta al contenido */}
      {/* w-fit desde lg, no desde md: `w-fit` hace que la tarjeta se ajuste al
          contenido, así que el `w-full` del formulario y de los campos no tenía
          ancho disponible al que crecer y los inputs se quedaban en su tamaño
          natural. Mientras hay una sola columna (hasta md) la tarjeta ocupa todo
          el ancho; desde lg, que ya reparte en columnas, se ajusta al contenido. */}
      <div className="bg-white rounded-xl shadow-sm p-8 mx-6 w-full md:mx-12 lg:w-fit 1400:mx-0">
      <form className={FORM_GRID} onSubmit={handleSubmit}>

        {/* Columna de la imagen: el ÚNICO elemento con posición explícita.
            Desde lg lleva dentro el trigger, así queda al comienzo de la
            izquierda y la previsualización lo empuja hacia abajo sin tocar
            el resto de la retícula. */}
        <div className={MEDIA_COLUMN}>
          <FileInput
            accept="image/*"
            multiple={false}
            label="Cargar imagen"
            required
            directionClassName={PREVIEW_DIRECTION}
            value={formData.image}
            onChange={(files) =>
              setFormData((prev) => ({ ...prev, image: files }))
            }
            error={errors.image}
          />

          <GroupModalTrigger
            onClick={() => setIsGroupModalOpen(true)}
            checkbox={staffCheckbox("isStaffInstructorAside")}
            className="hidden lg:flex items-start"
          />
        </div>

        <Field
          label="Nombre"
          name="userFirstName"
          required
          value={formData.userFirstName}
          onChange={handleChange}
          error={errors.userFirstName}
          placeholder="Ej: Sofía"
        />
        <Field
          label="Apellido"
          name="userLastName"
          required
          value={formData.userLastName}
          onChange={handleChange}
          error={errors.userLastName}
          placeholder="Ej: Cardona"
        />
        <FieldSelect
          label="Tipo de documento"
          name="documentTypeId"
          required
          options={documentTypes}
          value={formData.documentTypeId}
          onChange={handleChange}
          error={errors.documentTypeId}
        />
        <Field
          label="Número de documento"
          name="userDocumentNumber"
          required
          value={formData.userDocumentNumber}
          onChange={handleChange}
          error={errors.userDocumentNumber}
          placeholder="Ej: 1078546789"
        />
        <Field
          label="Teléfono"
          name="userPhone"
          required
          type="tel"
          value={formData.userPhone}
          onChange={handleChange}
          error={errors.userPhone}
          placeholder="Ej: 3125667890"
        />
        <Field
          label="Teléfono secundario (opcional)"
          name="userSecondPhone"
          type="tel"
          value={formData.userSecondPhone}
          onChange={handleChange}
          error={errors.userSecondPhone}
          placeholder="Ej: 6041234567 (opcional)"
        />
        <FieldSelect
          label="Tipo de usuario"
          name="userAccountType"
          required
          options={ACCOUNT_TYPE_OPTIONS}
          value={formData.userAccountType}
          onChange={handleChange}
          error={errors.userAccountType}
        />
        <FieldSelect
          label="Grupo"
          name="groupId"
          required
          options={groups}
          value={formData.groupId}
          onChange={handleChange}
          error={errors.groupId}
        />
        <Field
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
        <Field
          label="Correo personal"
          name="userEmail"
          required
          type="email"
          value={formData.userEmail}
          onChange={handleChange}
          error={errors.userEmail}
          placeholder="Ej: sofia@correo.com"
        />
        <Field
          label="Correo institucional (opcional)"
          name="userEmailInstitutional"
          type="email"
          value={formData.userEmailInstitutional}
          onChange={handleChange}
          error={errors.userEmailInstitutional}
          placeholder="Ej: scardona@soy.sena.edu.co (opcional)"
        />
        <Field
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
        <Field
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
        <GroupModalTrigger
          onClick={() => setIsGroupModalOpen(true)}
          checkbox={staffCheckbox("isStaffInstructor")}
          className="flex items-center justify-self-center self-center
                     sm:items-start sm:justify-self-start
                     md:items-center md:justify-self-center
                     lg:hidden"
        />

        <div className="flex items-center justify-center self-center">
          <Button variant="primary" size="md" type="submit">
            Crear Usuario
          </Button>
        </div>
      </form>

      {/* El error general va FUERA de la retícula: dentro ocuparía una celda y
          movería todo el reparto de columnas justo cuando aparece */}
      {errors.form && (
        <p className="text-error text-caption mt-4 text-center">{errors.form}</p>
      )}

      <CreateGroupModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        onSave={handleGroupCreated}
      />
      </div>
    </div>
  );
}
