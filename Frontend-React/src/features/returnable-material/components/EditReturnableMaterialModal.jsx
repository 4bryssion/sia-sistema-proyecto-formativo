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
import { requiresDimensions, toCategoryOptions } from "../utils/categoryRules";

// Los mismos pasos que al crear, con los mismos campos: editar un material y
// crearlo deben leerse igual.
const CAMPOS_POR_PASO = [
  ["materialName", "description"],
  ["categoryId", "model", "serial", "dimensions"],
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
  const { brandOptions, inventoryOptions, accountableOptions } = useMaterialCatalogs(true);

  const [categoryOptions, setCategoryOptions] = useState([]);
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
          categoryId:     String(m.categoryId ?? ""),
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
          model:          m.model ?? "",
          serial:         m.serial ?? "",
          dimensions:     m.dimensions ?? "",
          quotationIds:   assignedQuotationIds(cm.quotations),
        });
        setOrigen({
          brand: cm.brand ?? null,
          inventory: cm.inventory ?? null,
          accountables: cm.accountables ?? [],
          quotations: assignedQuotations(cm.quotations),
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
      .then((c) => setCategoryOptions(toCategoryOptions(c)))
      .catch(() => {});
  }, [materialId]);

  const showDimensions = requiresDimensions(categoryOptions, form?.categoryId);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = aplicarCambioDeMaterial(prev, name, value);
      // Al pasar a una categoría que no pide dimensiones se limpia lo escrito:
      // dejarlo guardaría una medida que el usuario ya no ve.
      if (name === "categoryId" && !requiresDimensions(categoryOptions, value)) {
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
      e.dimensions = "Las dimensiones son obligatorias para muebles y enseres";
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
      // convierte en NULL). Dimensiones al cambiar de categoría; marca, modelo
      // y serial porque desde p48 son opcionales y deben poder quitarse.
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
      titulo: "Categoría y características",
      validate: () => validarPaso(1),
      contenido: rejilla(
        <>
          <Select widthClass="w-full" variant="search"
            label="Categoría" name="categoryId" required
            options={categoryOptions}
            value={form.categoryId} onChange={handleChange} error={errors.categoryId} />

          {/* (p48) Modelo y serial pasaron a opcionales */}
          <Input widthClass="w-full"
            label="Modelo (opcional)" name="model"
            value={form.model} onChange={handleChange} error={errors.model} />

          <Input widthClass="w-full"
            label="Serial (opcional)" name="serial"
            value={form.serial} onChange={handleChange} error={errors.serial} />

          {/* Solo para la categoría que las pide; al cambiar a otra se limpia */}
          {showDimensions && (
            <Input widthClass="w-full"
              label="Dimensiones" name="dimensions" required
              value={form.dimensions} onChange={handleChange} error={errors.dimensions} />
          )}
        </>,
      ),
    },
    {
      titulo: "Inventario y ubicación",
      validate: () => validarPaso(2),
      contenido: rejilla(
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
    </>
  );
}
