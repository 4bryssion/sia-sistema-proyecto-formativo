import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import userService from "../services/userService";
import documentTypeService from "../services/documentTypeService";
import UserEditLeft from "../components/UserEditLeft";
import UserEditRight from "../components/UserEditRight";

export default function EditUserPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [form, setForm] = useState(null);
  const [image, setImage] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const u = await userService.getById(id);
        setUser(u);
        setForm({
          userFirstName: u.userFirstName ?? "",
          userLastName: u.userLastName ?? "",
          documentTypeId: u.documentType ? String(u.documentType.id) : "",
          userDocumentNumber: u.userDocumentNumber ?? "",
          userEndDate: u.userEndDate ? u.userEndDate.slice(0, 10) : "",
          userEmail: u.userEmail ?? "",
          userEmailInstitutional: u.userEmailInstitutional ?? "",
          userPhone: u.userPhone ?? "",
          userSecondPhone: u.userSecondPhone ?? "",
          userAddress: u.userAddress ?? "",
          userAccountType: u.userAccountType ?? "",
          userPassword: "",
        });
      } catch (err) {
        setLoadError(err.response?.data?.error ?? "Error al cargar el usuario");
      }
    })();
    documentTypeService.getAll()
      .then((dts) => setDocumentTypes(dts.map((d) => ({ id: d.id, value: String(d.id), label: d.documentName }))))
      .catch(() => setDocumentTypes([]));
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (form.userEmailInstitutional && form.userEmailInstitutional === form.userEmail) {
      setErrors({ userEmailInstitutional: "El institucional no puede ser igual al personal" });
      return;
    }

    const fd = new FormData();
    fd.append("userFirstName", form.userFirstName);
    fd.append("userLastName", form.userLastName);
    fd.append("documentTypeId", form.documentTypeId);
    fd.append("userDocumentNumber", form.userDocumentNumber);
    fd.append("userEndDate", form.userEndDate);
    fd.append("userEmail", form.userEmail);
    fd.append("userPhone", form.userPhone);
    fd.append("userAddress", form.userAddress);
    fd.append("userAccountType", form.userAccountType);
    fd.append("userEmailInstitutional", form.userEmailInstitutional ?? "");
    fd.append("userSecondPhone", form.userSecondPhone ?? "");
    if (form.userPassword) fd.append("userPassword", form.userPassword);
    if (image.length) fd.append("image", image[0]);

    setSaving(true);
    try {
      await userService.update(id, fd);
      setErrors({});
      navigate(`/view/users/${id}`);
    } catch (err) {
      const det = err.response?.data?.detalles;
      setErrors({ form: det?.length ? det.join(" · ") : (err.response?.data?.error ?? "Error al actualizar el usuario") });
    } finally {
      setSaving(false);
    }
  };

  if (loadError) return <p className="p-6 text-error">{loadError}</p>;
  if (!form) return <p className="p-6 text-gray-600">Cargando usuario...</p>;

  return (
    // Se reduce el espacio entre las dos columnas para aprovechar mejor el ancho.
    // Se reduce el padding interno del panel izquierdo para disminuir la altura total.linea 94
    <div className="p-4 grid 1400:grid-cols-[380px_1fr]">
      <div className="bg-black p-8 1400:h-full">
        <UserEditLeft user={user} image={image} onImageChange={setImage} />
      </div>
      <div className="bg-white p-3">
        <UserEditRight
          form={form}
          onChange={handleChange}
          documentTypes={documentTypes}
          errors={errors}
          onSubmit={handleSubmit}
          saving={saving}
        />
      </div>
    </div>
  );
}
