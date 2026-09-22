import { useEffect, useState } from "react";
import { Input, Select, Alert, MultiStepModal } from "@/shared";
import LabelValue from "@/shared/components/LabelValue";
import { loanSchema, todayLocalISO, LOAN_TYPE_OPTIONS } from "../schemas/loanSchema.js";
import LoanReceiverField from "@/shared/components/loans/LoanReceiverField";
import loanService from "@/shared/services/loanService";
import userService from "@/shared/services/userService";
import consumableMaterialService from "@/shared/services/consumableMaterialService";
import returnableMaterialService from "@/shared/services/returnableMaterialService";
import { buildMaterialOptions } from "../utils/materialOptions";
import LoanMaterialLines from "./LoanMaterialLines.jsx";

// (p49) Crear préstamo pasó de página a modal por pasos.
//
// Lo que se fue con la página: la retícula `md:grid-cols-[320px_minmax(0,1fr)]`
// con una columna de datos de 320px fijos y otra para los materiales. Existía
// porque las filas de material (select + cantidad + papelera) no cabían en 320px
// junto al resto. Al repartir en pasos, los materiales tienen el paso 2 entero
// para ellos y no compiten con nada: no hace falta ninguna medida.
//
// El cuarto paso es un resumen de solo lectura. No es relleno: crear un préstamo
// descuenta existencias y dispara correos de firma al prestador y al receptor,
// así que conviene poder repasar antes de confirmar — y es justo lo que un
// recorrido por pasos permite y una página larga no.

// Qué campos pertenecen a cada paso, para enseñar solo los errores del paso que
// el usuario tiene delante. El cuarto no tiene campos propios: solo resume.
const CAMPOS_POR_PASO = [
  ["lenderId", "receiverRegistered", "receiverId", "receiverEmail", "loanType"],
  ["materials"],
  ["returnDate", "apprenticeGroup", "useJustification"],
  [],
];

export default function CreateLoanModal({ isOpen, onClose, onSaved }) {
  // El cuerpo solo se monta con el modal abierto: cada apertura arranca en el
  // paso 1 y en blanco, sin un useEffect que haga setState.
  if (!isOpen) return null;

  return <CreateLoanBody onClose={onClose} onSaved={onSaved} />;
}

function CreateLoanBody({ onClose, onSaved }) {
  const [formData, setFormData] = useState({
    apprenticeGroup: "",
    // (p48) Naturaleza del préstamo, obligatoria. NO se deduce de si el receptor
    // está registrado: son dos cosas independientes.
    loanType: "",
    useJustification: "",
    returnDate: "",
    lenderId: "",
    // (p48) La casilla arranca MARCADA: lo normal es prestarle a alguien del
    // sistema, y el caso externo es la excepción
    receiverRegistered: true,
    receiverId: "",
    receiverEmail: "",
  });
  const [materials, setMaterials]             = useState([{ materialId: "", borrowedQuantity: "" }]);
  const [userOptions, setUserOptions]         = useState([]);
  // El prestador es quien entrega y responde por el material: solo cuentadantes.
  // El receptor puede ser cualquiera, así que son dos listas distintas.
  const [lenderOptions, setLenderOptions]     = useState([]);
  const [materialOptions, setMaterialOptions] = useState([]);
  const [errors, setErrors]                   = useState({});
  const [materialErrors, setMaterialErrors]   = useState([]);
  const [guardando, setGuardando]             = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [users, consumables, returnables] = await Promise.all([
          userService.getAll(),
          consumableMaterialService.getAll("active"),
          returnableMaterialService.getAll("active").catch(() => []),
        ]);
        // El SADMIN ya viene excluido por el backend (systemIdentities.js).
        // El value va como STRING: el schema Zod espera string y con el número
        // crudo fallaba con "Invalid input: expected string, received number"
        // en cuanto se elegía un usuario.
        const opciones = users.map((u) => ({
          value: String(u.id),
          label: `${u.userFirstName} ${u.userLastName}`,
        }));
        setUserOptions(opciones);
        setLenderOptions(
          users
            .filter((u) => u.userAccountType === "Cuentadante")
            .map((u) => ({ value: String(u.id), label: `${u.userFirstName} ${u.userLastName}` })),
        );
        setMaterialOptions(buildMaterialOptions(consumables, returnables));
      } catch {
        // Sin usuarios ni materiales el formulario no sirve para nada, así que
        // el fallo se avisa en vez de dejar los selects vacíos sin explicación
        Alert.error(
          "No se pudieron cargar los datos del formulario",
          "Revisa tu conexión con el servidor e inténtalo de nuevo.",
        );
      }
    })();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      // Al cambiar de tipo de receptor se limpia el campo que deja de aplicar:
      // el backend recibe uno u otro (xor), nunca los dos
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
        ...(name === "receiverRegistered"
          ? checked
            ? { receiverEmail: "" }
            : { receiverId: "" }
          : {}),
      }));
      return;
    }
    // El grupo de aprendices es un número pero el campo es de texto (para no
    // arrastrar las flechas del type="number"): se filtra a dígitos al escribir
    const limpio = name === "apprenticeGroup" ? value.replace(/\D/g, "") : value;
    setFormData((prev) => ({ ...prev, [name]: limpio }));
  };

  // Cuántas unidades admite un material. Sale de las opciones ya cargadas, que
  // llevan el disponible calculado (serializado ⇒ 1).
  const disponibleDe = (materialId) =>
    materialOptions.find((o) => String(o.value) === String(materialId))?.available ?? null;

  const handleMaterialChange = (idx, field, value) => {
    setMaterials((prev) =>
      prev.map((linea, i) => {
        if (i !== idx) return linea;

        if (field === "materialId") {
          const tope = disponibleDe(value);
          return {
            materialId: value,
            // Al elegir material la cantidad arranca en 0 para que el campo se
            // lea "0/disponible"; si venía escrita, se recorta al nuevo tope
            borrowedQuantity: !value
              ? ""
              : linea.borrowedQuantity === "" || Number(linea.borrowedQuantity) > tope
                ? (linea.borrowedQuantity === "" ? "0" : String(tope))
                : linea.borrowedQuantity,
          };
        }

        // Cantidad: solo dígitos, sin ceros a la izquierda y con tope en el
        // disponible del material elegido
        const tope = disponibleDe(linea.materialId);
        let cantidad = value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
        if (cantidad === "") cantidad = linea.materialId ? "0" : "";
        if (tope != null && Number(cantidad) > tope) cantidad = String(tope);
        return { ...linea, borrowedQuantity: cantidad };
      }),
    );
  };
  const addMaterial    = () => setMaterials((prev) => [...prev, { materialId: "", borrowedQuantity: "" }]);
  const removeMaterial = (idx) => setMaterials((prev) => prev.filter((_, i) => i !== idx));

  // Valida el préstamo completo pero solo PINTA los errores del paso indicado.
  // El schema se aplica entero porque cruza campos (receptor registrado contra
  // correo externo) y trocearlo perdería esas reglas.
  const validarPaso = (indice) => {
    const result = loanSchema.safeParse({ ...formData, materials });
    if (result.success) {
      setErrors({});
      setMaterialErrors([]);
      return true;
    }

    const campos = CAMPOS_POR_PASO[indice];
    const propios = result.error.issues.filter((issue) => campos.includes(issue.path[0]));

    const fe = {};
    const me = [];
    for (const issue of propios) {
      // Los errores de una LÍNEA de material llegan como materials.<i>.<campo>;
      // el general (lista vacía, material repetido) llega como materials a secas.
      if (issue.path[0] === "materials" && typeof issue.path[1] === "number") {
        me[issue.path[1]] = { ...(me[issue.path[1]] || {}), [issue.path[2]]: issue.message };
      } else {
        fe[issue.path[0]] = issue.message;
      }
    }
    setErrors(fe);
    setMaterialErrors(me);
    return propios.length === 0;
  };

  const handleSubmit = async () => {
    const result = loanSchema.safeParse({ ...formData, materials });
    // MultiStepModal ya validó los cuatro pasos; esto es la red de seguridad por
    // si un campo no estuviera asignado a ninguno.
    if (!result.success) {
      Alert.error("Faltan datos", result.error.issues[0]?.message ?? "Revisa el formulario.");
      return;
    }

    setGuardando(true);
    try {
      const d = result.data;
      await loanService.create({
        // (p48) Grupo opcional: vacío se OMITE para que el backend lo guarde
        // como null. Mandarlo como 0 inventaría un grupo que no existe.
        ...(d.apprenticeGroup ? { apprenticeGroup: Number(d.apprenticeGroup) } : {}),
        loanType: d.loanType,
        useJustification: d.useJustification,
        returnDate: d.returnDate,
        lenderId: Number(d.lenderId),
        // (p48) Uno u otro, nunca ambos: es lo que exige el `xor` del backend
        ...(d.receiverRegistered
          ? { receiverId: Number(d.receiverId) }
          : { receiverEmail: d.receiverEmail }),
        materials: d.materials.map((m) => ({
          materialId: Number(m.materialId),
          borrowedQuantity: Number(m.borrowedQuantity),
        })),
      });

      // El modal se cierra ANTES del aviso: si no, la alerta quedaría encima de
      // un formulario que ya no sirve para nada.
      onSaved?.();
      onClose?.();

      Alert.success(
        "Préstamo creado",
        d.receiverRegistered
          ? "Se enviaron los correos de firma al prestador y al receptor."
          : `Se enviaron los correos de firma al prestador y a ${d.receiverEmail}.`,
      );
    } catch (error) {
      const detalles = error.response?.data?.detalles;
      const msg = detalles?.join(" · ") ?? error.response?.data?.error ?? "Error al crear el préstamo.";
      Alert.error("Error al crear el préstamo", msg);
    } finally {
      setGuardando(false);
    }
  };

  // ---- Textos del resumen -------------------------------------------------
  const etiquetaDe = (opciones, valor) =>
    opciones.find((o) => String(o.value) === String(valor))?.label ?? "";

  const receptor = formData.receiverRegistered
    ? etiquetaDe(userOptions, formData.receiverId)
    : formData.receiverEmail;

  const lineasResumen = materials
    .filter((m) => m.materialId)
    .map((m) => `${etiquetaDe(materialOptions, m.materialId)} × ${m.borrowedQuantity || 0}`);

  const pasos = [
    {
      titulo: "Partes y tipo",
      validate: () => validarPaso(0),
      contenido: (
        <div className="grid grid-cols-1 items-start gap-x-6 gap-y-5 sm:grid-cols-2">
          <Select
            label="Prestador"
            variant="search"
            name="lenderId"
            required
            widthClass="w-full"
            options={lenderOptions}
            value={formData.lenderId}
            onChange={handleChange}
            error={errors.lenderId}
          />
          {/* (p48) Tipo de préstamo: independiente de si el receptor está
              registrado. Un usuario del sistema puede llevarse material a una
              actividad externa. */}
          <Select
            label="Tipo de préstamo"
            name="loanType"
            required
            widthClass="w-full"
            options={LOAN_TYPE_OPTIONS}
            value={formData.loanType}
            onChange={handleChange}
            error={errors.loanType}
          />
          <div className="sm:col-span-2">
            <LoanReceiverField
              registered={formData.receiverRegistered}
              receiverId={formData.receiverId}
              receiverEmail={formData.receiverEmail}
              userOptions={userOptions}
              onChange={handleChange}
              errors={errors}
            />
          </div>
        </div>
      ),
    },
    {
      titulo: "Materiales",
      validate: () => validarPaso(1),
      contenido: (
        <LoanMaterialLines
          lines={materials}
          options={materialOptions}
          onChange={handleMaterialChange}
          onAdd={addMaterial}
          onRemove={removeMaterial}
          errors={materialErrors}
          generalError={errors.materials}
        />
      ),
    },
    {
      titulo: "Devolución y destino",
      validate: () => validarPaso(2),
      contenido: (
        <div className="grid grid-cols-1 items-start gap-x-6 gap-y-5 sm:grid-cols-2">
          <Input
            label="Fecha de devolución"
            name="returnDate"
            required
            type="date"
            widthClass="w-full"
            min={todayLocalISO()}
            value={formData.returnDate}
            onChange={handleChange}
            error={errors.returnDate}
          />
          <Input
            label="Grupo de aprendices (opcional)"
            name="apprenticeGroup"
            // De texto y no de número: el type="number" trae las flechas de
            // subir/bajar, que aquí no significan nada (un grupo no es una
            // cantidad que se incremente). Los dígitos los garantiza handleChange.
            type="text"
            inputMode="numeric"
            widthClass="w-full"
            placeholder="Ingrese el número del grupo (opcional)"
            value={formData.apprenticeGroup}
            onChange={handleChange}
            error={errors.apprenticeGroup}
          />
          <div className="sm:col-span-2">
            <Input
              label="Justificación de uso"
              name="useJustification"
              required
              widthClass="w-full"
              placeholder="Escriba aquí la justificación"
              value={formData.useJustification}
              onChange={handleChange}
              error={errors.useJustification}
            />
          </div>
        </div>
      ),
    },
    {
      titulo: "Confirmación",
      contenido: (
        <div className="flex flex-col gap-5">
          <p className="font-secondary text-body text-text-muted">
            Revisa el préstamo antes de crearlo. Al confirmar se descuentan las
            existencias y se envían los correos de firma.
          </p>

          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <LabelValue label="Prestador" value={etiquetaDe(lenderOptions, formData.lenderId)} />
            <LabelValue
              label={formData.receiverRegistered ? "Receptor" : "Receptor externo (correo)"}
              value={receptor}
            />
            <LabelValue label="Tipo de préstamo" value={formData.loanType} />
            <LabelValue label="Fecha de devolución" value={formData.returnDate} />
            <LabelValue label="Grupo de aprendices" value={formData.apprenticeGroup} />
            <LabelValue label="Justificación de uso" value={formData.useJustification} className="sm:col-span-2" />
          </div>

          <div>
            <p className="font-secondary text-small text-text-muted">Materiales</p>
            {lineasResumen.length === 0 ? (
              <p className="font-secondary text-body">—</p>
            ) : (
              <ul className="mt-1 flex flex-col gap-1">
                {lineasResumen.map((linea) => (
                  <li key={linea} className="font-secondary text-body wrap-break-word">
                    {linea}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ),
    },
  ];

  return (
    <MultiStepModal
      isOpen
      onClose={onClose}
      titulo="Crear Préstamo"
      pasos={pasos}
      onSubmit={handleSubmit}
      textoGuardar="Crear Préstamo"
      guardando={guardando}
    />
  );
}
