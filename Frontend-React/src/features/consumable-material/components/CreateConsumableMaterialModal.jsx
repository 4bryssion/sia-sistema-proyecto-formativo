import { useState, useEffect } from "react";
import { Input, Select, TextArea, Alert, MultiStepModal, CreateAndAssignTrigger } from "@/shared";
import { consumableMaterialSchema } from "../schemas/consumableMaterialSchema";
import consumableMaterialService from "@/shared/services/consumableMaterialService";
import CreateBrandModal from "@/shared/components/brands/CreateBrandModal";
import CreateInventoryModal from "@/shared/components/inventories/CreateInventoryModal";
import MaterialFilesBand from "@/shared/components/materials/MaterialFilesBand";
import { useMaterialCatalogs } from "@/shared/hooks/useMaterialCatalogs";
import { STATUS_FILTER_OPTIONS } from "@/shared/utils/materialStatusLabel";
import { aplicarCambioDeMaterial } from "@/shared/utils/materialForm";
import quotationService from "@/shared/services/quotationService";
import UploadQuotationsModal from "@/shared/components/quotations/UploadQuotationsModal";
import {
  MAX_POR_MATERIAL, MAX_POR_CARGA_EN_MATERIAL,
  toQuotationOptions, quotationUrl,
} from "@/shared/utils/quotationFiles";
import { Eye } from "lucide-react";

// (p49) Crear material de consumo pasó de página a modal de 5 pasos.
//
// Lo que se fue con la página:
// - La retícula de 1→2→3 columnas con `lg:w-[320px]` repetido en los trece
//   campos, y el comentario que explicaba por qué la descripción tenía que ir la
//   última ocupando la fila entera (un TextArea alto estiraba su fila y abría un
//   hueco muerto al lado). Con los campos repartidos en pasos, la descripción
//   tiene su paso y el problema desaparece en vez de esquivarse.
// - La columna lateral de archivos con sus dos FileInput propios, con textos y
//   medidas distintos a los del modal de editar. Ahora los dos usan la misma
//   MaterialFilesBand: crear y editar el mismo material se ven igual.
// - Los disparadores duplicados (una instancia oculta hasta lg y otra desde lg).

// Qué campos pertenecen a cada paso, para enseñar solo los errores del paso que
// el usuario tiene delante. `image` y `technicalSheet` no los valida el schema
// —los archivos viven fuera de formData— pero se listan igual porque es en el
// paso 5 donde deben aparecer.
const CAMPOS_POR_PASO = [
  ["materialName", "description"],
  ["brandId", "inventoryId", "location", "status", "senaPlate"],
  ["quantity", "unitPrice", "totalPrice", "purchaseDate", "entryDate", "quotationIds"],
  ["accountableIds"],
  ["image", "technicalSheet"],
];

export default function CreateConsumableMaterialModal({ isOpen, onClose, onSaved }) {
  // El cuerpo solo se monta con el modal abierto: cada apertura arranca en el
  // paso 1 y en blanco, sin un useEffect que haga setState.
  if (!isOpen) return null;

  return <CreateConsumableBody onClose={onClose} onSaved={onSaved} />;
}

function CreateConsumableBody({ onClose, onSaved }) {
  const {
    brandOptions, inventoryOptions, accountableOptions,
    refetchBrands, refetchInventories,
  } = useMaterialCatalogs();

  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);

  const [images, setImages] = useState([]);
  const [sheets, setSheets] = useState([]);

  // (p50) Cotizaciones disponibles. Se piden solo las HABILITADAS: el listado
  // del módulo sí muestra las deshabilitadas para poder reactivarlas, pero
  // ofrecerlas aquí sería ofrecer algo que el backend va a rechazar al guardar.
  const [quotationOptions, setQuotationOptions] = useState([]);
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);

  const cargarCotizaciones = () =>
    quotationService.getAll()
      .then((lista) => setQuotationOptions(toQuotationOptions(lista)))
      .catch(() => setQuotationOptions([]));

  useEffect(() => { cargarCotizaciones(); }, []);

  const [formData, setFormData] = useState({
    materialName:   "",
    brandId:        "",
    inventoryId:    "",
    accountableIds: [],
    senaPlate:      "",
    location:       "",
    quantity:       "",
    status:         "",
    unitPrice:      "",
    totalPrice:     "",
    purchaseDate:   "",
    entryDate:      "",
    description:    "",
    // (p50) Entre 1 y 3, obligatorias: son el respaldo del precio del material
    quotationIds:   [],
  });

  const [errors, setErrors] = useState({});
  const [guardando, setGuardando] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => aplicarCambioDeMaterial(prev, name, value));
  };

  // Al crear una marca o un inventario desde su modal se refresca el select y se
  // autoselecciona lo recién creado
  const handleBrandCreated = async (created) => {
    await refetchBrands();
    if (created?.id) setFormData((prev) => ({ ...prev, brandId: String(created.id) }));
  };

  const handleInventoryCreated = async (created) => {
    await refetchInventories();
    if (created?.id) setFormData((prev) => ({ ...prev, inventoryId: String(created.id) }));
  };

  // Lo recién cargado se autoselecciona: quien lo sube desde aquí es porque lo
  // quiere asignar a este material. Se respeta el tope por si ya había alguna.
  const handleQuotationsUploaded = async (creadas = []) => {
    await cargarCotizaciones();
    if (!creadas.length) return;
    setFormData((prev) => {
      const juntas = [...new Set([...prev.quotationIds, ...creadas.map((c) => String(c.id))])];
      return { ...prev, quotationIds: juntas.slice(0, MAX_POR_MATERIAL) };
    });
  };

  // Los archivos no los ve el schema (viven fuera de formData), así que su
  // obligatoriedad se comprueba aparte. (p48) La ficha técnica es obligatoria
  // también aquí, igual que en devolutivo.
  const erroresDeArchivos = () => {
    const e = {};
    if (!images.length) e.image = "La imagen es requerida";
    if (!sheets.length) e.technicalSheet = "La ficha técnica es requerida (PDF o Excel)";
    return e;
  };

  // Valida el material completo pero solo PINTA los errores del paso indicado.
  // El schema se aplica entero porque cruza campos (cantidad contra placa, fecha
  // de ingreso contra la de compra) y trocearlo perdería esas reglas.
  const validarPaso = (indice) => {
    const result = consumableMaterialSchema.safeParse(formData);

    const todos = result.success ? {} : {};
    if (!result.success) {
      result.error.issues.forEach((issue) => {
        if (!(issue.path[0] in todos)) todos[issue.path[0]] = issue.message;
      });
    }
    Object.assign(todos, erroresDeArchivos());

    const delPaso = {};
    CAMPOS_POR_PASO[indice].forEach((campo) => {
      if (todos[campo]) delPaso[campo] = todos[campo];
    });
    setErrors(delPaso);
    return Object.keys(delPaso).length === 0;
  };

  const handleSubmit = async () => {
    const result = consumableMaterialSchema.safeParse(formData);
    const archivos = erroresDeArchivos();
    // MultiStepModal ya validó los cinco pasos; esto es la red de seguridad por
    // si un campo no estuviera asignado a ninguno.
    if (!result.success || Object.keys(archivos).length) {
      Alert.error(
        "Faltan datos",
        Object.values(archivos)[0] ?? result.error?.issues[0]?.message ?? "Revisa el formulario.",
      );
      return;
    }

    setGuardando(true);

    const fd = new FormData();
    Object.entries(result.data).forEach(([key, val]) => {
      // Con placa SENA la cantidad NO se envía (el "1" del input es solo visual;
      // el backend guarda null para identificar serializados)
      if (key === "quantity" && result.data.senaPlate) return;
      // Un FormData no puede llevar un array: cuentadantes y cotizaciones
      // viajan como JSON
      if (key === "accountableIds" || key === "quotationIds") {
        fd.append(key, JSON.stringify(val));
        return;
      }
      if (val !== undefined && val !== "") fd.append(key, val);
    });
    // Repetir el mismo nombre de campo es la forma en que un FormData manda
    // varios archivos al mismo `fields({ name })` de multer
    images.forEach((file) => fd.append("image", file));
    sheets.forEach((file) => fd.append("technical_sheet", file));

    try {
      Alert.loading("Creando material...");
      await consumableMaterialService.create(fd);
      Alert.close();

      // El modal se cierra ANTES del aviso: si no, la alerta quedaría encima de
      // un formulario que ya no sirve para nada.
      onSaved?.();
      onClose?.();
      Alert.success("Material creado");
    } catch (err) {
      Alert.close();
      const detalles = err.response?.data?.detalles;
      const mensaje = err.response?.data?.error ?? "Error al crear el material";
      Alert.error("Error al crear el material", detalles?.join(" · ") ?? mensaje);
    } finally {
      setGuardando(false);
    }
  };

  // Retícula común a los pasos de campos: una columna en móvil, dos desde sm.
  // Sin anchos escritos — cada campo ocupa su celda. `items-start` impide que un
  // campo con error estire a su vecino de fila.
  const rejilla = (children) => (
    <div className="grid grid-cols-1 items-start gap-x-6 gap-y-5 sm:grid-cols-2">{children}</div>
  );

  const pasos = [
    {
      titulo: "Identificación",
      validate: () => validarPaso(0),
      contenido: (
        <div className="flex flex-col gap-5">
          {rejilla(
            <>
              <Input widthClass="w-full"
                label="ID del material" required
                value="Automático" readOnly
                title="Se genera automáticamente al guardar" />
              <Input widthClass="w-full"
                label="Nombre del material" name="materialName" required
                placeholder="Ej: Tornillos autoperforantes 1/2''"
                value={formData.materialName} onChange={handleChange} error={errors.materialName} />
            </>,
          )}
          {/* La descripción tiene sitio propio: en la página vieja había que
              ponerla la última y a fila completa para que su altura no abriera
              huecos junto a los campos bajos. */}
          <TextArea widthClass="w-full"
            label="Descripción" name="description" required
            placeholder="Ej: Caja de tornillos autoperforantes para formación en estructuras metálicas"
            value={formData.description} onChange={handleChange} error={errors.description} />
        </div>
      ),
    },
    {
      titulo: "Inventario y ubicación",
      validate: () => validarPaso(1),
      contenido: (
        <div className="flex flex-col gap-6">
          {rejilla(
            <>
              {/* (p48) La marca dejó de ser obligatoria: hay material sin marca */}
              <Select widthClass="w-full" variant="search"
                label="Marca (opcional)" name="brandId"
                options={brandOptions}
                value={formData.brandId} onChange={handleChange} error={errors.brandId} />

              {/* (p48) El inventario sí lo es: todo material pertenece a uno */}
              <Select widthClass="w-full" variant="search"
                label="Inventario" name="inventoryId" required
                options={inventoryOptions}
                value={formData.inventoryId} onChange={handleChange} error={errors.inventoryId} />

              <Input widthClass="w-full"
                label="Ubicación" name="location" required
                placeholder="Ej: Bodega 2 — Estante A3"
                value={formData.location} onChange={handleChange} error={errors.location} />

              <Select widthClass="w-full"
                label="Estado" name="status" required
                options={STATUS_FILTER_OPTIONS}
                value={formData.status} onChange={handleChange} error={errors.status} />

              <div className="sm:col-span-2">
                <Input widthClass="w-full"
                  label="Placa SENA (opcional)" name="senaPlate"
                  placeholder="Ej: 92451234 (solo materiales serializados)"
                  value={formData.senaPlate} onChange={handleChange} error={errors.senaPlate} />
              </div>
            </>,
          )}

          <div className="flex flex-col gap-4 sm:flex-row sm:gap-8">
            <CreateAndAssignTrigger
              label="Crear y asignar nueva marca"
              onClick={() => setIsBrandModalOpen(true)}
              className="flex"
            />
            <CreateAndAssignTrigger
              label="Crear y asignar nuevo inventario"
              onClick={() => setIsInventoryModalOpen(true)}
              className="flex"
            />
          </div>
        </div>
      ),
    },
    {
      titulo: "Valores y cotizaciones",
      validate: () => validarPaso(2),
      contenido: rejilla(
        <>
          <div>
            <Input widthClass="w-full"
              label="Cantidad" name="quantity" type="number"
              placeholder="Ej: 25 (vacío si es serializado)"
              value={formData.quantity} onChange={handleChange} error={errors.quantity}
              disabled={!!formData.senaPlate} />
            {/* La nota va en flujo normal, no absoluta sobre el gap: en la página
                vieja se posicionaba a mano porque en flujo separaba este campo
                del siguiente más que al resto. Aquí solo hay cinco campos y esa
                diferencia de altura no descuadra nada. */}
            {!formData.senaPlate && !errors.quantity && (
              <p className="mt-1 font-secondary text-caption text-text-muted">
                Requerida cuando no hay Placa SENA
              </p>
            )}
          </div>

          <Input widthClass="w-full"
            label="Valor unitario" name="unitPrice" required prefix="$" type="number"
            placeholder="Ej: 31000 (COP, sin puntos)"
            value={formData.unitPrice} onChange={handleChange} error={errors.unitPrice} />

          <Input widthClass="w-full"
            label="Valor total" name="totalPrice" required prefix="$" type="number"
            placeholder="Se calcula: cantidad × valor unitario"
            value={formData.totalPrice} onChange={handleChange} error={errors.totalPrice} />

          <Input widthClass="w-full"
            label="Fecha de compra" name="purchaseDate" required type="date"
            value={formData.purchaseDate} onChange={handleChange} error={errors.purchaseDate} />

          {/* (p48) Fecha de ingreso al almacén: nunca anterior a la de compra */}
          <Input widthClass="w-full"
            label="Fecha de ingreso" name="entryDate" required type="date"
            min={formData.purchaseDate || undefined}
            value={formData.entryDate} onChange={handleChange} error={errors.entryDate} />

          {/* (p50) Respaldo del precio. Va en este paso y no en el de archivos
              porque una cotización no es documentación del material: es lo que
              justifica el valor que se acaba de escribir arriba.

              El ojo de cada fila abre el PDF sin marcarla: hay que poder mirar
              una cotización para decidir si es la que corresponde. */}
          <div className="sm:col-span-2 flex flex-col gap-4">
            <Select widthClass="w-full sm:max-w-md" variant="search" multiple
              label="Cotizaciones" name="quotationIds" required
              options={quotationOptions}
              maxSelected={MAX_POR_MATERIAL}
              onPreview={(opt) => {
                const url = quotationUrl(opt.quotation);
                if (url) window.open(url, "_blank", "noopener,noreferrer");
              }}
              previewIcon={<Eye size={16} />}
              previewLabel="Ver cotización"
              value={formData.quotationIds} onChange={handleChange}
              error={errors.quotationIds} />

            {/* Mismo disparador que marca, inventario y categoría: el icono es
                el "+" de todos ellos, porque la acción es la misma (agregar algo
                y asignarlo en el acto). El icono de monedas queda para el modal
                de visualizar, que es donde identifica a las cotizaciones frente
                a la ficha técnica. */}
            <CreateAndAssignTrigger
              label="Cargar y asignar nuevas cotizaciones"
              onClick={() => setIsQuotationModalOpen(true)}
              className="flex"
            />
          </div>
        </>,
      ),
    },
    {
      titulo: "Cuentadantes",
      validate: () => validarPaso(3),
      contenido: (
        <div className="flex flex-col gap-4">
          <p className="font-secondary text-body text-text-muted">
            Quiénes responden por este material. Se puede asignar más de uno.
          </p>
          {/* (p48) Varios cuentadantes: variante secundaria del Select (casillas)
              sobre la primaria de búsqueda. El disparador resume "el primero y N
              más" cuando no caben todos. */}
          <Select widthClass="w-full sm:max-w-md" variant="search" multiple
            label="Cuentadantes" name="accountableIds" required
            options={accountableOptions}
            value={formData.accountableIds} onChange={handleChange}
            error={errors.accountableIds} />
        </div>
      ),
    },
    {
      titulo: "Imágenes y ficha técnica",
      validate: () => validarPaso(4),
      contenido: (
        <MaterialFilesBand
          images={images}
          sheets={sheets}
          onImagesChange={setImages}
          onSheetsChange={setSheets}
          imageError={errors.image}
          sheetError={errors.technicalSheet}
        />
      ),
    },
  ];

  return (
    <>
      <MultiStepModal
        isOpen
        onClose={onClose}
        titulo="Crear material de consumo"
        pasos={pasos}
        onSubmit={handleSubmit}
        textoGuardar="Crear Material"
        guardando={guardando}
      />

      <CreateBrandModal
        isOpen={isBrandModalOpen}
        onClose={() => setIsBrandModalOpen(false)}
        onSave={handleBrandCreated}
      />

      <CreateInventoryModal
        isOpen={isInventoryModalOpen}
        onClose={() => setIsInventoryModalOpen(false)}
        onSave={handleInventoryCreated}
      />

      {/* Tope de 3 y no de 6: aquí se carga para ASIGNAR en el acto, y un
          material no admite más de 3. Ofrecer 6 invitaría a cargar archivos que
          no se van a poder asignar. */}
      <UploadQuotationsModal
        isOpen={isQuotationModalOpen}
        onClose={() => setIsQuotationModalOpen(false)}
        onSave={handleQuotationsUploaded}
        maxFiles={MAX_POR_CARGA_EN_MATERIAL}
      />
    </>
  );
}
