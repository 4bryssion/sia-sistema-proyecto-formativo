// Editar material de consumo — modal por pasos.
//
// (p49) Pasó de ser un modal único con los trece campos apilados a tener los
// MISMOS cinco pasos que el de crear: un modal de esa altura obligaba a
// desplazarse para encontrar un campo, y era la razón de la retícula de hasta
// cuatro columnas (`1400:grid-cols-4`), que existía solo para bajar el número de
// filas y que cupiera sin scroll. Con los campos repartidos, esa retícula sobra.
//
// Navegación LIBRE entre pasos y Guardar disponible en cualquiera (modo
// "editar"): el material ya existe y todos sus pasos son válidos, así que
// obligar a recorrer los cinco para corregir la ubicación sería una traba sin
// razón. Al guardar se validan todos y el modal salta al que falle.
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
import consumableMaterialService from "@/shared/services/consumableMaterialService";
import { consumableMaterialUpdateSchema } from "../schemas/consumableMaterialSchema";
import { STATUS_FILTER_OPTIONS } from "@/shared/utils/materialStatusLabel";
import { aplicarCambioDeMaterial } from "@/shared/utils/materialForm";
import { useMaterialCatalogs, ensureOption, ensureOptions } from "@/shared/hooks/useMaterialCatalogs";
import { accountableIds } from "@/shared/utils/accountables";
import { remoteImage, remoteSheet, buildFileOrder } from "@/shared/utils/materialFiles";

// Los mismos pasos que al crear, con los mismos campos en cada uno: editar un
// material y crearlo deben leerse igual.
const CAMPOS_POR_PASO = [
  ["materialName", "description"],
  ["brandId", "inventoryId", "location", "status", "senaPlate"],
  ["quantity", "unitPrice", "totalPrice", "purchaseDate", "entryDate", "quotationIds"],
  ["accountableIds"],
  ["image", "technicalSheet"],
];

export default function EditConsumableMaterialModal({ isOpen, materialId, onClose, onSaved }) {
  if (!isOpen || !materialId) return null;

  return <EditConsumableBody materialId={materialId} onClose={onClose} onSaved={onSaved} />;
}

function EditConsumableBody({ materialId, onClose, onSaved }) {
  const { brandOptions, inventoryOptions, accountableOptions } = useMaterialCatalogs(true);

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

  // (p50) Solo se OFRECEN las habilitadas. Las que el material ya tenía se
  // reponen aparte aunque se hayan deshabilitado después: si no estuvieran en la
  // lista, guardar se las quitaría sin que nadie lo hubiera pedido.
  const [quotationOptions, setQuotationOptions] = useState([]);
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);

  const cargarCotizaciones = () =>
    quotationService.getAll()
      .then((lista) => setQuotationOptions(toQuotationOptions(lista)))
      .catch(() => setQuotationOptions([]));

  // El cuerpo se monta con el modal, así que no hace falta limpiar el estado de
  // la apertura anterior: no hay ninguna.
  useEffect(() => {
    (async () => {
      try {
        const m = await consumableMaterialService.getById(materialId);
        setForm({
          materialName:   m.materialName ?? "",
          brandId:        String(m.brandId ?? ""),
          inventoryId:    String(m.inventoryId ?? ""),
          accountableIds: accountableIds(m.accountables),
          senaPlate:      m.senaPlate ?? "",
          // Con placa SENA (serializado, quantity null en BD) se muestra 1 fijo
          quantity:       m.quantity != null ? String(m.quantity) : (m.senaPlate ? "1" : ""),
          location:       m.location ?? "",
          status:         m.status ?? "",
          unitPrice:      String(m.unitPrice ?? ""),
          totalPrice:     String(m.totalPrice ?? ""),
          purchaseDate:   m.purchaseDate ? m.purchaseDate.slice(0, 10) : "",
          entryDate:      m.entryDate ? m.entryDate.slice(0, 10) : "",
          description:    m.description ?? "",
          quotationIds:   assignedQuotationIds(m.quotations),
        });
        setOrigen({
          brand: m.brand ?? null,
          inventory: m.inventory ?? null,
          accountables: m.accountables ?? [],
          quotations: assignedQuotations(m.quotations),
        });
        setImages((m.images ?? []).map(remoteImage));
        setSheets((m.technicalSheets ?? []).map(remoteSheet));
      } catch (err) {
        setLoadError(err.response?.data?.error ?? "Error al cargar el material");
      }
      cargarCotizaciones();
    })();
  }, [materialId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => aplicarCambioDeMaterial(prev, name, value));
  };

  // Los archivos no los ve el schema. El backend exige que quede al menos una
  // imagen y una ficha: editar no puede dejar el material sin ellas.
  const erroresDeArchivos = () => {
    const e = {};
    if (!images.length) e.image = "El material debe conservar al menos una imagen";
    if (!sheets.length) e.technicalSheet = "El material debe conservar al menos una ficha técnica";
    return e;
  };

  const validarPaso = (indice) => {
    // Mientras el material se está cargando no hay nada que validar, y devolver
    // false dejaría el modal atascado sin decir por qué.
    if (!form) return false;

    const result = consumableMaterialUpdateSchema.safeParse(form);
    const todos = {};
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
    const result = consumableMaterialUpdateSchema.safeParse(form);
    const archivos = erroresDeArchivos();
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
      // Placa y cantidad se envían SIEMPRE, incluso vacías: el vacío es como se
      // quitan (el backend los convierte en null). Con placa, la cantidad viaja
      // vacía —el "1" del input es solo visual— porque un material serializado
      // se identifica justamente por tener quantity null.
      // Antes se omitían cuando estaban vacías, así que borrar la placa no hacía
      // nada y poner una a un material con cantidad dejaba las dos a la vez.
      if (key === "quantity")  { fd.append(key, result.data.senaPlate ? "" : (val ?? "")); return; }
      if (key === "senaPlate") { fd.append(key, val ?? ""); return; }
      // Un FormData no puede llevar un array: cuentadantes y cotizaciones
      // viajan como JSON
      if (key === "accountableIds" || key === "quotationIds") {
        fd.append(key, JSON.stringify(val));
        return;
      }
      // La marca vacía SÍ se envía: es como se le quita la marca a un material
      // (el backend la convierte en NULL). Ya es un campo opcional (p48)
      if (key === "brandId") { fd.append(key, val ?? ""); return; }
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
      await consumableMaterialService.update(materialId, fd);
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

  // Las habilitadas más las que este material ya tenía, sin repetir. Se marcan
  // como inactivas para que se entienda por qué no aparecerían en un material
  // nuevo.
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
  // de un recorrido de cinco pasos vacíos por el que no tiene sentido navegar.
  const pasosDeEspera = [{
    titulo: "Editar material de consumo",
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
      titulo: "Inventario y ubicación",
      validate: () => validarPaso(1),
      contenido: rejilla(
        <>
          {/* (p48) La marca dejó de ser obligatoria.
              ensureOption repone la marca del material si se desactivó después
              de asignarla: sin ella no estaría entre las opciones y guardar la
              borraría sin que nadie lo pidiera. */}
          <Select widthClass="w-full" variant="search"
            label="Marca (opcional)" name="brandId"
            options={ensureOption(brandOptions, form.brandId, origen.brand?.brandName)}
            value={form.brandId} onChange={handleChange} error={errors.brandId} />

          {/* (p48) El inventario sí lo es */}
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
      validate: () => validarPaso(2),
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

          {/* (p50) Respaldo del precio. En este paso y no en el de archivos:
              una cotización no es documentación del material, es lo que justifica
              el valor escrito arriba. El ojo abre el PDF sin marcarla.

              `ensureOptions` repone las que el material ya tenía si se
              deshabilitaron después de asignarlas: sin ellas, guardar se las
              quitaría sin que nadie lo pidiera. */}
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
      validate: () => validarPaso(3),
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
      titulo="Editar material de consumo"
      pasos={pasos}
      onSubmit={handleSubmit}
      textoGuardar="Guardar"
      guardando={guardando}
      modo="editar"
    />

    {/* Tope de 3 y no de 6: aquí se carga para ASIGNAR en el acto, y un material
        no admite más de 3. */}
    <UploadQuotationsModal
      isOpen={isQuotationModalOpen}
      onClose={() => setIsQuotationModalOpen(false)}
      onSave={handleQuotationsUploaded}
      maxFiles={MAX_POR_CARGA_EN_MATERIAL}
    />
    </>
  );
}
