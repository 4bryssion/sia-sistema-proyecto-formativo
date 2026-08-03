import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input, Button, Select, Alert } from "@/shared";
import { loanSchema, todayLocalISO } from "../schemas/loanSchema.js";
import loanService from "../services/loanService";
import userService from "@/features/users/services/userService";
import consumableMaterialService from "@/features/consumable-material/services/consumableMaterialService";
import returnableMaterialService from "@/features/returnable-material/services/returnableMaterialService";
import { buildMaterialOptions } from "../utils/materialOptions";
import LoanMaterialLines from "./LoanMaterialLines.jsx";

export default function LoanRegisterForm() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    apprenticeGroup: "",
    useJustification: "",
    returnDate: "",
    lenderId: "",
    receiverId: "",
  });
  const [materials, setMaterials]               = useState([{ materialId: "", borrowedQuantity: "" }]);
  const [userOptions, setUserOptions]           = useState([]);
  // El prestador es quien entrega y responde por el material: solo cuentadantes.
  // El receptor puede ser cualquiera, así que son dos listas distintas.
  const [lenderOptions, setLenderOptions]       = useState([]);
  const [materialOptions, setMaterialOptions]   = useState([]);
  const [errors, setErrors]                     = useState({});
  const [materialErrors, setMaterialErrors]     = useState([]);
  const [isSubmitting, setIsSubmitting]         = useState(false);

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
        setErrors((prev) => ({ ...prev, form: "No se pudieron cargar usuarios o materiales." }));
      }
    })();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
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

  const mapErrors = (issues) => {
    const fe = {};
    const me = [];
    for (const issue of issues) {
      if (issue.path[0] === "materials" && typeof issue.path[1] === "number") {
        me[issue.path[1]] = { ...(me[issue.path[1]] || {}), [issue.path[2]]: issue.message };
      } else if (issue.path[0] === "materials") {
        fe.materials = issue.message;
      } else {
        fe[issue.path[0]] = issue.message;
      }
    }
    setErrors(fe);
    setMaterialErrors(me);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = loanSchema.safeParse({ ...formData, materials });
    if (!result.success) {
      mapErrors(result.error.issues);
      return;
    }

    setErrors({});
    setMaterialErrors([]);
    setIsSubmitting(true);
    try {
      const d = result.data;
      await loanService.create({
        apprenticeGroup: Number(d.apprenticeGroup),
        useJustification: d.useJustification,
        returnDate: d.returnDate,
        lenderId: Number(d.lenderId),
        receiverId: Number(d.receiverId),
        materials: d.materials.map((m) => ({
          materialId: Number(m.materialId),
          borrowedQuantity: Number(m.borrowedQuantity),
        })),
      });
      Alert.success(
        "Préstamo creado",
        "Se enviaron los correos de firma al prestador y al receptor."
      );
      navigate("/dashboard/loans");
    } catch (error) {
      const detalles = error.response?.data?.detalles;
      const msg = detalles?.join(" · ") ?? error.response?.data?.error ?? "Error al crear el préstamo.";
      Alert.error("Error al crear el préstamo", msg);
      setErrors({ form: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Cuadro blanco que envuelve el formulario sobrepasándolo 32px (p-8),
          igual que en los módulos de materiales */}
      <div className="bg-white rounded-xl shadow-sm p-8 w-full">
      {/* La columna de datos se queda en los 320px de siempre y la de materiales
          se lleva TODO el resto: sus filas son select + cantidad + papelera, y
          con 320px el nombre del material se cortaba casi entero */}
      <form
        className="grid gap-6 md:grid-cols-[320px_minmax(0,1fr)] justify-items-center w-full"
        onSubmit={handleSubmit}
      >
        {/* Columna izquierda: datos del préstamo */}
        <div className="flex flex-col gap-6 w-full md:w-[320px]">
          <Select
            label="Prestador" variant="search"
            name="lenderId"
            required
            options={lenderOptions}
            value={formData.lenderId}
            onChange={handleChange}
            error={errors.lenderId}
          />
          <Select
            label="Receptor" variant="search"
            name="receiverId"
            required
            options={userOptions}
            value={formData.receiverId}
            onChange={handleChange}
            error={errors.receiverId}
          />
          <Input
            label="Grupo de aprendices"
            name="apprenticeGroup"
            required
            // De texto y no de número: el type="number" trae las flechas de
            // subir/bajar, que aquí no significan nada (un grupo no es una
            // cantidad que se incremente). Los dígitos los garantiza handleChange.
            type="text"
            inputMode="numeric"
            placeholder="Ingrese el número del grupo"
            value={formData.apprenticeGroup}
            onChange={handleChange}
            error={errors.apprenticeGroup}
          />
          <Input
            label="Fecha de devolución"
            name="returnDate"
            required
            type="date"
            min={todayLocalISO()}
            value={formData.returnDate}
            onChange={handleChange}
            error={errors.returnDate}
          />
          <Input
            label="Justificación de uso"
            name="useJustification"
            required
            placeholder="Escriba aquí la justificación"
            value={formData.useJustification}
            onChange={handleChange}
            error={errors.useJustification}
          />
        </div>

        {/* Columna derecha: materiales */}
        <div className="flex flex-col gap-6 w-full">
          <LoanMaterialLines
            lines={materials}
            options={materialOptions}
            onChange={handleMaterialChange}
            onAdd={addMaterial}
            onRemove={removeMaterial}
            errors={materialErrors}
            generalError={errors.materials}
          />
        </div>

        {/* Mensajes de error generales */}
        {errors.form && (
          <p className="md:col-span-2 text-error font-secondary text-center">{errors.form}</p>
        )}

        {/* Botones de acción */}
        <div className="md:col-span-2 flex flex-col sm:flex-row sm:justify-between gap-3 mt-8 sm:mt-4 lg:px-10 w-full">
          <Button
            variant="secondary"
            size="sm" onClick={() => navigate(-1)}
            className="w-full sm:w-auto sm:self-start">
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="sm" type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto sm:self-end"
            >
            {isSubmitting ? "Creando..." : "Crear Préstamo"}
          </Button>
        </div>
      </form>
      </div>
    </div>
  );
}
