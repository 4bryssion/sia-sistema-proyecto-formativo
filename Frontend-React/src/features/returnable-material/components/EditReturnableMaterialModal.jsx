// Editar material devolutivo — modal por pasos.
//
// (p49) Pasó de ser un modal único con los diecisiete campos apilados a tener
// los MISMOS seis pasos que el de crear. La retícula de hasta cuatro columnas
// (`1400:grid-cols-4`) existía solo para bajar el número de filas y que el modal
// cupiera sin scroll; con los campos repartidos, sobra.
//
// Navegación LIBRE entre pasos y Guardar disponible en cualquiera (modo
// "editar"): el material ya existe y todos sus pasos son válidos, así que
// obligar a recorrer los seis para corregir el serial sería una traba sin razón.
// Al guardar se validan todos y el modal salta al que falle.
//
// Al ser un formulario NO se cierra con clic fuera —se perdería lo escrito—:
// solo con Cancelar o con la X, que va por fuera del modal en una esquina.

import { useEffect, useState } from "react";
import { Input, Select, TextArea, Alert, MultiStepModal, CreateAndAssignTrigger } from "@/shared";
import { Eye } from "lucide-react";
import quotationService from "@/shared/services/quotationService";
import UploadQuotationsModal from "@/shared/components/quotations/UploadQuotationsModal";
import CreateBrandModal from "@/shared/components/brands/CreateBrandModal";
import CreateInventoryModal from "@/shared/components/inventories/CreateInventoryModal";
import CreateCategoryModal from "@/shared/components/categories/CreateCategoryModal";
import {
  MAX_POR_MATERIAL, MAX_POR_CARGA_EN_MATERIAL,
  toQuotationOptions, quotationUrl, assignedQuotationIds, assignedQuotations,
} from "@/shared/utils/quotationFiles";
import MaterialFilesBand from "@/shared/components/materials/MaterialFilesBand";
import returnableMaterialService from "@/shared/services/returnableMaterialService";
import categoryService from "@/shared/services/categoryService";
import { returnableMaterialUpdateSchema } from "../schemas/returnableMaterialSchema";
import { STATUS_FILTER_OPTIONS } from "@/shared/utils/materialStatusLabel";
import { aplicarCambioDeMaterial } from "@/shared/utils/materialForm";
import { useMaterialCatalogs, ensureOption, ensureOptions } from "@/shared/hooks/useMaterialCatalogs";
import { accountableIds } from "@/shared/utils/accountables";
import { remoteImage, remoteSheet, buildFileOrder } from "@/shared/utils/materialFiles";
import { requiresDimensions, separarClasificacion } from "@/shared/utils/materialClassification";

// Los mismos pasos que al crear, con los mismos campos: editar un material y
// crearlo deben leerse igual.
const CAMPOS_POR_PASO = [
  ["materialName", "description"],
  ["materialTypeId", "categoryId", "model", "serial", "dimensions"],
  ["brandId", "inventoryId", "location", "status", "senaPlate"],
  ["quantity", "unitPrice", "totalPrice", "purchaseDate", "entryDate", "quotationIds"],
  ["accountableIds"],
  ["image", "technicalSheet"],
];

export default function EditReturnableMaterialModal({ isOpen, materialId, onClose, onSaved }) {
  if (!isOpen || !materialId) return null;

  return <EditReturnableBody materialId={materialId} onClose={onClose} onSaved={onSaved} />;
}

function EditReturnableBody({ materialId, onClose, onSaved }) {
  // (p53) `refetchBrands` y `refetchInventories` hacían falta y no se pedían:
  // este modal no tenía «crear y asignar», que sí tienen los de crear, así que
  // para dar de alta una marca o un inventario había que salir del formulario.
  const {
    brandOptions, inventoryOptions, accountableOptions,
    refetchBrands, refetchInventories,
  } = useMaterialCatalogs(true);

  const [categoryOptions, setCategoryOptions] = useState([]);
  const [materialTypeOptions, setMaterialTypeOptions] = useState([]);
  // (p53) Crear y asignar una categoría sin salir de la edición. Hace falta aquí
  // y no solo en crear: un material anterior a p53 llega SIN categoría propia
  // —su antigua categoría pasó a ser el tipo— y la que necesita puede no existir
  // todavía. Es el mismo botón que el formulario de crear.
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [form, setForm]     = useState(null);
  // Las dos tiras mezclan lo ya guardado (descriptores) con lo recién elegido
  // (File): así arrastrar y eliminar funcionan igual sin importar el origen
  const [images, setImages] = useState([]);
  const [sheets, setSheets] = useState([]);
  const [errors, setErrors] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [loadError, setLoadError] = useState(null);
  // Marca, inventario y cuentadantes tal como venían: si alguno se desactivó
  // después, no estará entre las opciones y hay que reponerlo para no borrarlo
  // sin querer al guardar
  const [origen, setOrigen] = useState({ brand: null, inventory: null, accountables: [], quotations: [] });

  // (p50) Solo se OFRECEN las habilitadas; las ya asignadas se reponen aparte.
  const [quotationOptions, setQuotationOptions] = useState([]);
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);

  const cargarCotizaciones = () =>
    quotationService.getAll()
      .then((lista) => setQuotationOptions(toQuotationOptions(lista)))
      .catch(() => setQuotationOptions([]));

  // El cuerpo se monta con el modal, así que no hay estado de una apertura
  // anterior que limpiar: no hay ninguna.
  useEffect(() => {
    (async () => {
      try {
        const m  = await returnableMaterialService.getById(materialId);
        // (p48) Cuentadantes, imágenes y fichas cuelgan de la tabla PADRE
        const cm = m.consumableMaterial;
        setForm({
          materialName:   cm.materialName ?? "",
          brandId:        String(cm.brandId ?? ""),
          inventoryId:    String(cm.inventoryId ?? ""),
          accountableIds: accountableIds(cm.accountables),
          // (p53) La clasificación vive en la tabla padre. Un material anterior a
          // p53 llega sin categoría propia (su antigua categoría pasó a ser el
          // tipo), así que el campo aparece vacío y el formulario lo exige.
          categoryId:     String(cm.categoryId ?? ""),
          materialTypeId: String(cm.materialTypeId ?? ""),
          senaPlate:      cm.senaPlate ?? "",
          // Con placa SENA (serializado, quantity null en BD) se muestra 1 fijo
          quantity:       cm.quantity != null ? String(cm.quantity) : (cm.senaPlate ? "1" : ""),
          location:       cm.location ?? "",
          status:         cm.status ?? "",
          unitPrice:      String(cm.unitPrice ?? ""),
          totalPrice:     String(cm.totalPrice ?? ""),
          purchaseDate:   cm.purchaseDate ? cm.purchaseDate.slice(0, 10) : "",
          entryDate:      cm.entryDate ? cm.entryDate.slice(0, 10) : "",
          description:    cm.description ?? "",
          // (p53) `model` y `serial` también se mudaron al padre; lo único que
          // queda en la fila del devolutivo son las dimensiones.
          model:          cm.model ?? "",
          serial:         cm.serial ?? "",
          dimensions:     m.dimensions ?? "",
          quotationIds:   assignedQuotationIds(cm.quotations),
        });
        setOrigen({
          brand: cm.brand ?? null,
          inventory: cm.inventory ?? null,
          accountables: cm.accountables ?? [],
          quotations: assignedQuotations(cm.quotations),
          // (p53) Para reponer la clasificación en el select si la categoría o el
          // tipo se desactivaron después de asignarlos.
          category: cm.category ?? null,
          materialType: cm.materialType ?? null,
        });
        setImages((cm.images ?? []).map(remoteImage));
        setSheets((cm.technicalSheets ?? []).map(remoteSheet));
      } catch (err) {
        setLoadError(err.response?.data?.error ?? "Error al cargar el material");
      }
    })();

    cargarCotizaciones();

    // Catálogo propio de devolutivo; el resto los trae useMaterialCatalogs
    categoryService.getAll()
      .then((c) => {
        const { categoryOptions: cats, materialTypeOptions: tipos } = separarClasificacion(c);
        setCategoryOptions(cats);
        setMaterialTypeOptions(tipos);
      })
      .catch(() => {});
  }, [materialId]);

  // (p53) La regla la trae el TIPO de material, no la categoría.
  const cargarClasificacion = () =>
    categoryService.getAll()
      .then((lista) => {
        const { categoryOptions: cats, materialTypeOptions: tipos } = separarClasificacion(lista);
        setCategoryOptions(cats);
        setMaterialTypeOptions(tipos);
      })
      .catch(() => {});

  // (p53) Los tres se comportan igual: se recarga el catálogo y lo recién
  // creado queda seleccionado, porque quien lo crea desde aquí es para asignarlo.
  const handleBrandCreated = async (created) => {
    await refetchBrands();
    if (created?.id) setForm((prev) => ({ ...prev, brandId: String(created.id) }));
  };

  const handleInventoryCreated = async (created) => {
    await refetchInventories();
    if (created?.id) setForm((prev) => ({ ...prev, inventoryId: String(created.id) }));
  };

  const handleCategoryCreated = async (creada) => {
    await cargarClasificacion();
    if (creada?.id) setForm((prev) => ({ ...prev, categoryId: String(creada.id) }));
  };

  const showDimensions = requiresDimensions(materialTypeOptions, form?.materialTypeId);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = aplicarCambioDeMaterial(prev, name, value);
      // Al pasar a una categoría que no pide dimensiones se limpia lo escrito:
      // dejarlo guardaría una medida que el usuario ya no ve.
      if (name === "materialTypeId" && !requiresDimensions(materialTypeOptions, value)) {
        next.dimensions = "";
      }
      return next;
    });
  };

  // Reglas que el schema no ve: los archivos viven fuera de `form` y la
  // obligatoriedad de las dimensiones depende del NOMBRE de la categoría.
  const erroresExtra = () => {
    const e = {};
    if (!images.length) e.image = "El material debe conservar al menos una imagen";
    if (!sheets.length) e.technicalSheet = "El material debe conservar al menos una ficha técnica";
    if (showDimensions && !form?.dimensions) {
      e.dimensions = "Las dimensiones son obligatorias para este tipo de material";
    }
    return e;
  };

  const validarPaso = (indice) => {
    // Mientras el material se está cargando no hay nada que validar, y devolver
    // false dejaría el modal atascado sin decir por qué.
    if (!form) return false;

    const result = returnableMaterialUpdateSchema.safeParse(form);
    const todos = {};
    if (!result.success) {
      result.error.issues.forEach((issue) => {
        if (!(issue.path[0] in todos)) todos[issue.path[0]] = issue.message;
      });
    }
    Object.assign(todos, erroresExtra());

    const delPaso = {};
    CAMPOS_POR_PASO[indice].forEach((campo) => {
      if (todos[campo]) delPaso[campo] = todos[campo];
    });
    setErrors(delPaso);
    return Object.keys(delPaso).length === 0;
  };

  // Lo recién cargado se autoselecciona: quien lo sube desde aquí es porque lo
  // quiere asignar a este material.
  const handleQuotationsUploaded = async (creadas = []) => {
    await cargarCotizaciones();
    if (!creadas.length) return;
    setForm((prev) => {
      const juntas = [...new Set([...(prev.quotationIds ?? []), ...creadas.map((c) => String(c.id))])];
      return { ...prev, quotationIds: juntas.slice(0, MAX_POR_MATERIAL) };
    });
  };

  const handleSubmit = async () => {
    const result = returnableMaterialUpdateSchema.safeParse(form);
    const extra = erroresExtra();
    if (!result.success || Object.keys(extra).length) {
      Alert.error(
        "Faltan datos",
        Object.values(extra)[0] ?? result.error?.issues[0]?.message ?? "Revisa el formulario.",
      );
      return;
    }

    setGuardando(true);

    const fd = new FormData();
    Object.entries(result.data).forEach(([key, val]) => {
      // Placa y cantidad se envían SIEMPRE, incluso vacías: el vacío es como se
      // quitan (el backend los convierte en null). Con placa, la cantidad viaja
      // vacía —el "1" del input es solo visual— porque un material serializado
      // se identifica justamente por tener quantity null.
      if (key === "quantity")  { fd.append(key, result.data.senaPlate ? "" : (val ?? "")); return; }
      if (key === "senaPlate") { fd.append(key, val ?? ""); return; }
      // Un FormData no puede llevar un array: cuentadantes y cotizaciones
      // viajan como JSON
      if (key === "accountableIds" || key === "quotationIds") {
        fd.append(key, JSON.stringify(val));
        return;
      }
      // Estos cuatro vacíos SÍ se envían: es como se borran (el backend los
      // convierte en NULL). Dimensiones al cambiar de TIPO de material; marca,
      // modelo y serial porque son opcionales y deben poder quitarse.
      if (key === "dimensions" || key === "brandId" || key === "model" || key === "serial") {
        fd.append(key, val ?? "");
        return;
      }
      if (val !== undefined && val !== "") fd.append(key, val);
    });

    // El orden final se manda explícito: mezcla ids ya guardados con referencias
    // "new:<i>" a los archivos de esta petición, para que arrastrar uno nuevo al
    // principio no lo mande al final al guardar. Lo que no aparezca en la lista,
    // el backend lo elimina.
    const imagenes = buildFileOrder(images);
    fd.append("imageOrder", JSON.stringify(imagenes.order));
    imagenes.nuevos.forEach((file) => fd.append("image", file));

    const fichas = buildFileOrder(sheets);
    fd.append("sheetOrder", JSON.stringify(fichas.order));
    fichas.nuevos.forEach((file) => fd.append("technical_sheet", file));

    try {
      Alert.loading("Actualizando material...");
      await returnableMaterialService.update(materialId, fd);
      Alert.close();
      onSaved?.();
      onClose?.();
      Alert.success("Material actualizado");
    } catch (err) {
      Alert.close();
      const det = err.response?.data?.detalles;
      const msg = det?.length ? det.join(" · ") : (err.response?.data?.error ?? "Error al actualizar");
      Alert.error("Error al actualizar el material", msg);
    } finally {
      setGuardando(false);
    }
  };

  // Las habilitadas más las que este material ya tenía, sin repetir.
  const opcionesDeCotizacion = [
    ...quotationOptions,
    ...origen.quotations
      .filter((q) => !quotationOptions.some((o) => String(o.value) === String(q.id)))
      .map((q) => ({ value: String(q.id), label: `${q.fileName} (inactiva)`, quotation: q })),
  ];

  const rejilla = (children) => (
    <div className="grid grid-cols-1 items-start gap-x-6 gap-y-5 sm:grid-cols-2">{children}</div>
  );

  // Mientras carga —o si falló— se enseña un único paso con el mensaje, en vez
  // de un recorrido de seis pasos vacíos por el que no tiene sentido navegar.
  const pasosDeEspera = [{
    titulo: "Editar material devolutivo",
    contenido: loadError
      ? <p className="text-error font-secondary">{loadError}</p>
      : <p className="text-text-muted font-secondary">Cargando material...</p>,
  }];

  const pasos = !form ? pasosDeEspera : [
    {
      titulo: "Identificación",
      validate: () => validarPaso(0),
      contenido: (
        <div className="flex flex-col gap-5">
          {rejilla(
            <Input widthClass="w-full"
              label="Nombre del material" name="materialName" required
              value={form.materialName} onChange={handleChange} error={errors.materialName} />,
          )}
          <TextArea widthClass="w-full"
            label="Descripción" name="description" required
            value={form.description} onChange={handleChange} error={errors.description} />
        </div>
      ),
    },
    {
      titulo: "Clasificación y características",
      validate: () => validarPaso(1),
      contenido: (
        <div className="flex flex-col gap-6">
          {rejilla(
        <>
              {/* (p53) `ensureOption` repone la clasificación del material si la
                  categoría o el tipo se desactivaron después de asignarlos: sin
                  ella el select saldría en blanco aunque el material sí esté
                  clasificado. Es lo mismo que ya se hacía con la marca. */}
          <Select widthClass="w-full" variant="search"
            label="Tipo de material" name="materialTypeId" required
            options={ensureOption(materialTypeOptions, form.materialTypeId, origen.materialType?.categoryName)}
            value={form.materialTypeId} onChange={handleChange} error={errors.materialTypeId} />

          <Select widthClass="w-full" variant="search"
            label="Categoría" name="categoryId" required
            options={ensureOption(categoryOptions, form.categoryId, origen.category?.categoryName)}
            value={form.categoryId} onChange={handleChange} error={errors.categoryId} />

          {/* (p48) Modelo y serial pasaron a opcionales */}
          <Input widthClass="w-full"
            label="Modelo (opcional)" name="model"
            value={form.model} onChange={handleChange} error={errors.model} />

          <Input widthClass="w-full"
            label="Serial (opcional)" name="serial"
            value={form.serial} onChange={handleChange} error={errors.serial} />

          {/* Solo para el tipo que las pide; al cambiar a otro se limpia */}
          {showDimensions && (
            <Input widthClass="w-full"
              label="Dimensiones" name="dimensions" required
              value={form.dimensions} onChange={handleChange} error={errors.dimensions} />
          )}
        </>,
          )}

          <CreateAndAssignTrigger
            label="Crear y asignar nueva categoría"
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex"
          />
        </div>
      ),
    },
    {
      titulo: "Inventario y ubicación",
      validate: () => validarPaso(2),
      contenido: (
        <div className="flex flex-col gap-6">
          {rejilla(
        <>
          {/* ensureOption repone la marca del material si se desactivó después
              de asignarla: sin ella no estaría entre las opciones y guardar la
              borraría sin que nadie lo pidiera. */}
          <Select widthClass="w-full" variant="search"
            label="Marca (opcional)" name="brandId"
            options={ensureOption(brandOptions, form.brandId, origen.brand?.brandName)}
            value={form.brandId} onChange={handleChange} error={errors.brandId} />

          <Select widthClass="w-full" variant="search"
            label="Inventario" name="inventoryId" required
            options={ensureOption(inventoryOptions, form.inventoryId, origen.inventory?.inventoryName)}
            value={form.inventoryId} onChange={handleChange} error={errors.inventoryId} />

          <Input widthClass="w-full"
            label="Ubicación" name="location" required
            value={form.location} onChange={handleChange} error={errors.location} />

          <Select widthClass="w-full"
            label="Estado" name="status" required
            options={STATUS_FILTER_OPTIONS}
            value={form.status} onChange={handleChange} error={errors.status} />

          <div className="sm:col-span-2">
            <Input widthClass="w-full"
              label="Placa SENA (opcional)" name="senaPlate"
              value={form.senaPlate} onChange={handleChange} error={errors.senaPlate} />
          </div>
        </>,
          )}

          {/* (p53) Los mismos dos que el formulario de crear, en el mismo paso y
              con la misma disposición: en columna hasta sm y en fila desde ahí. */}
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
      validate: () => validarPaso(3),
      contenido: rejilla(
        <>
          <Input widthClass="w-full"
            label="Cantidad" name="quantity" type="number"
            value={form.quantity} onChange={handleChange} error={errors.quantity}
            disabled={!!form.senaPlate}
            title={form.senaPlate ? "Material serializado: la cantidad es siempre 1" : undefined} />

          <Input widthClass="w-full"
            label="Valor unitario" name="unitPrice" required prefix="$" type="number"
            value={form.unitPrice} onChange={handleChange} error={errors.unitPrice} />

          <Input widthClass="w-full"
            label="Valor total" name="totalPrice" required prefix="$" type="number"
            value={form.totalPrice} onChange={handleChange} error={errors.totalPrice} />

          <Input widthClass="w-full"
            label="Fecha de compra" name="purchaseDate" required type="date"
            value={form.purchaseDate} onChange={handleChange} error={errors.purchaseDate} />

          {/* (p48) Fecha de ingreso al almacén: nunca anterior a la de compra */}
          <Input widthClass="w-full"
            label="Fecha de ingreso" name="entryDate" required type="date"
            min={form.purchaseDate || undefined}
            value={form.entryDate} onChange={handleChange} error={errors.entryDate} />

          {/* (p50) Respaldo del precio. `opcionesDeCotizacion` repone las que
              este material ya tenía si se deshabilitaron después de asignarlas:
              sin ellas, guardar se las quitaría sin que nadie lo pidiera. */}
          <div className="sm:col-span-2 flex flex-col gap-4">
            <Select widthClass="w-full sm:max-w-md" variant="search" multiple
              label="Cotizaciones" name="quotationIds" required
              options={opcionesDeCotizacion}
              maxSelected={MAX_POR_MATERIAL}
              onPreview={(opt) => {
                const url = quotationUrl(opt.quotation);
                if (url) window.open(url, "_blank", "noopener,noreferrer");
              }}
              previewIcon={<Eye size={16} />}
              previewLabel="Ver cotización"
              value={form.quotationIds} onChange={handleChange}
              error={errors.quotationIds} />

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
      validate: () => validarPaso(4),
      contenido: (
        <div className="flex flex-col gap-4">
          <p className="font-secondary text-body text-text-muted">
            Quiénes responden por este material. Se puede asignar más de uno.
          </p>
          {/* ensureOptions repone a los cuentadantes que se hayan desactivado
              después de asignarlos, marcados como inactivos: sin ellos el
              material no se podría editar sin perderlos. */}
          <Select widthClass="w-full sm:max-w-md" variant="search" multiple
            label="Cuentadantes" name="accountableIds" required
            options={ensureOptions(accountableOptions, origen.accountables)}
            value={form.accountableIds} onChange={handleChange}
            error={errors.accountableIds} />
        </div>
      ),
    },
    {
      titulo: "Imágenes y ficha técnica",
      validate: () => validarPaso(5),
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
      titulo="Editar material devolutivo"
      pasos={pasos}
      onSubmit={handleSubmit}
      textoGuardar="Guardar"
      guardando={guardando}
      modo="editar"
    />

    {/* Tope de 3 y no de 6: aquí se carga para ASIGNAR en el acto. */}
    <UploadQuotationsModal
      isOpen={isQuotationModalOpen}
      onClose={() => setIsQuotationModalOpen(false)}
      onSave={handleQuotationsUploaded}
      maxFiles={MAX_POR_CARGA_EN_MATERIAL}
    />

    {/* (p53) Igual que en crear: la categoría que hace falta puede no existir. */}
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

    <CreateCategoryModal
      isOpen={isCategoryModalOpen}
      onClose={() => setIsCategoryModalOpen(false)}
      onSave={handleCategoryCreated}
    />
    </>
  );
}
