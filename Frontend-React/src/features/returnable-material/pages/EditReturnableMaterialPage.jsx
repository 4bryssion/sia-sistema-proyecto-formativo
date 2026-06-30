import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import returnableMaterialService from "../services/returnableMaterialService";
import categoryService from "../services/categoryService";
import brandService from "@/features/brands/services/brandService";
import userService from "@/features/users/services/userService";
import { returnableMaterialUpdateSchema } from "../schemas/returnableMaterialSchema";
import ReturnableMaterialEditLeft from "../components/ReturnableMaterialEditLeft";
import ReturnableMaterialEditRight from "../components/ReturnableMaterialEditRight";

export default function EditReturnableMaterialPage() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [refreshKey, setRefreshKey]           = useState(0);
  const [material, setMaterial]               = useState(null);
  const [brandOptions, setBrandOptions]       = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [userOptions, setUserOptions]         = useState([]);
  const [form, setForm]                       = useState(null);
  const [image, setImage]                     = useState([]);
  const [techSheetFile, setTechSheetFile]     = useState([]);
  const [errors, setErrors]                   = useState({});
  const [saving, setSaving]                   = useState(false);
  const [toggling, setToggling]               = useState(false);
  const [loadError, setLoadError]             = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const m  = await returnableMaterialService.getById(id);
        const cm = m.consumableMaterial;
        setMaterial(m);
        setForm({
          materialName: cm.materialName ?? "",
          brandId:      String(cm.brandId ?? ""),
          categoryId:   String(m.categoryId ?? ""),
          userId:       String(cm.userId ?? ""),
          senaPlate:    cm.senaPlate ?? "",
          quantity:     cm.quantity !== null && cm.quantity !== undefined ? String(cm.quantity) : "",
          location:     cm.location ?? "",
          status:       cm.status ?? "",
          unitPrice:    String(cm.unitPrice ?? ""),
          totalPrice:   String(cm.totalPrice ?? ""),
          purchaseDate: cm.purchaseDate ? cm.purchaseDate.slice(0, 10) : "",
          description:  cm.description ?? "",
          model:        m.model ?? "",
          serial:       m.serial ?? "",
          dimensions:   m.dimensions ?? "",
        });
      } catch (err) {
        setLoadError(err.response?.data?.error ?? "Error al cargar el material");
      }
    })();
  }, [id, refreshKey]);

  useEffect(() => {
    brandService.getAll()
      .then((b) => setBrandOptions(b.map((x) => ({ value: String(x.id), label: x.brandName }))))
      .catch(() => {});

    categoryService.getAll()
      .then((c) => setCategoryOptions(c.map((x) => ({ value: String(x.id), label: x.categoryName }))))
      .catch(() => {});

    userService.getAll()
      .then((users) =>
        setUserOptions(
          users
            .filter((u) => u.userAccountType === "Cuentadante")
            .map((u) => ({ value: String(u.id), label: `${u.userFirstName} ${u.userLastName}` }))
        )
      )
      .catch(() => {});
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggle = async () => {
    setToggling(true);
    try {
      await returnableMaterialService.toggle(id);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      console.error("Error al cambiar estado:", err);
    } finally {
      setToggling(false);
    }
  };

  const handleSubmit = async () => {
    const result = returnableMaterialUpdateSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors = {};
      result.error.issues.forEach((issue) => { fieldErrors[issue.path[0]] = issue.message; });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setSaving(true);

    const fd = new FormData();
    Object.entries(result.data).forEach(([key, val]) => {
      if (val !== undefined && val !== "") fd.append(key, val);
    });
    if (image.length)         fd.append("image", image[0]);
    if (techSheetFile.length) fd.append("technical_sheet", techSheetFile[0]);

    try {
      await returnableMaterialService.update(id, fd);
      navigate(`/view/returnable-materials/${id}`);
    } catch (err) {
      const det = err.response?.data?.detalles;
      setErrors({
        form: det?.length
          ? det.join(" · ")
          : (err.response?.data?.error ?? "Error al actualizar"),
      });
    } finally {
      setSaving(false);
    }
  };

  if (loadError) return <p className="p-6 text-error">{loadError}</p>;
  if (!form)     return <p className="p-6 text-gray-600">Cargando material...</p>;

  return (
    <div className="p-6 grid 1400:grid-cols-[380px_1fr]">
      <div className="bg-black p-16 1400:h-full">
        <ReturnableMaterialEditLeft
          material={material}
          image={image}
          onImageChange={setImage}
        />
      </div>
      <div className="bg-white p-4">
        <ReturnableMaterialEditRight
          form={form}
          onChange={handleChange}
          brandOptions={brandOptions}
          categoryOptions={categoryOptions}
          userOptions={userOptions}
          errors={errors}
          onSubmit={handleSubmit}
          saving={saving}
          isActive={material?.consumableMaterial?.isActive ?? false}
          onToggle={handleToggle}
          toggling={toggling}
          technicalSheet={material?.technicalSheet}
          techSheetFile={techSheetFile}
          onTechSheetChange={setTechSheetFile}
        />
      </div>
    </div>
  );
}
