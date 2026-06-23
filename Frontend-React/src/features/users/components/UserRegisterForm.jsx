import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { userSchema } from "../schemas/userSchema.js";
import { Input, Button, Select, FileInput } from "@/shared";
import userService from "../services/userService.js";
import documentTypeService from "../services/documentTypeService.js";
import groupService from "@/features/groups/services/groupService";

const ACCOUNT_TYPE_OPTIONS = [
  { id: "Solidario", value: "Solidario", label: "Solidario" },
  { id: "Cuentadante", value: "Cuentadante", label: "Cuentadante" },
];

export default function UserRegisterForm() {
  const navigate = useNavigate();

  const [documentTypes, setDocumentTypes] = useState([]);
  const [groups, setGroups] = useState([]);

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
    userPassword: "",
    image: [],
  });
  const [errors, setErrors] = useState({});

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
    groupService
      .getAll()
      .then((gs) =>
        setGroups(
          gs
            .filter((g) => g.groupName !== "SuperAdmin")
            .map((g) => ({
              id: g.id,
              value: String(g.id),
              label: g.groupName,
            })),
        ),
      )
      .catch(() => setGroups([]));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
    fd.append("userEndDate", d.userEndDate);
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

    try {
      await userService.create(fd);
      setErrors({});
      navigate("/dashboard/users");
    } catch (error) {
      const det = error.response?.data?.detalles;
      setErrors({
        form: det?.length
          ? det.join(" · ")
          : (error.response?.data?.error ?? "Error al crear el usuario"),
      });
    }
  };

  return (
    <div className="flex justify-center pt-6">
      <form
        className="grid place-self-center gap-6 mx-6 md:grid-cols-2 lg:grid-cols-3 md:mx-12 1400:grid-cols-3 1400:mx-0 justify-items-center max-w-max"
        onSubmit={handleSubmit}
      >
        {/* Columna 1 */}
        <div className="flex flex-col gap-6 my-0 w-[320px]">
          <FileInput
            className="h-60"
            accept="image/*"
            multiple={false}
            value={formData.image}
            onChange={(files) =>
              setFormData((prev) => ({ ...prev, image: files }))
            }
            children="Cargar imagen"
          />
          {errors.image && (
            <p className="text-error text-caption">{errors.image}</p>
          )}

          <Input
            label="Nombre"
            name="userFirstName"
            value={formData.userFirstName}
            onChange={handleChange}
            error={errors.userFirstName}
            placeholder="Ej: Sofía"
          />
          <Input
            label="Apellido"
            name="userLastName"
            value={formData.userLastName}
            onChange={handleChange}
            error={errors.userLastName}
            placeholder="Ej: Cardona"
          />
          <Select
            label="Tipo de documento"
            name="documentTypeId"
            options={documentTypes}
            value={formData.documentTypeId}
            onChange={handleChange}
            error={errors.documentTypeId}
          />
        </div>

        {/* Columna 2 */}
        <div className="flex flex-col gap-6 my-0 w-[320px]">
          <Input
            label="Número de documento"
            name="userDocumentNumber"
            value={formData.userDocumentNumber}
            onChange={handleChange}
            error={errors.userDocumentNumber}
            placeholder="Ej: 1078546789"
          />
          <Input
            label="Teléfono"
            name="userPhone"
            type="tel"
            value={formData.userPhone}
            onChange={handleChange}
            error={errors.userPhone}
            placeholder="Ej: 3125667890"
          />
          <Input
            label="Teléfono secundario (opcional)"
            name="userSecondPhone"
            type="tel"
            value={formData.userSecondPhone}
            onChange={handleChange}
            error={errors.userSecondPhone}
            placeholder="Opcional"
          />
          <Select
            label="Tipo de cuenta"
            name="userAccountType"
            options={ACCOUNT_TYPE_OPTIONS}
            value={formData.userAccountType}
            onChange={handleChange}
            error={errors.userAccountType}
          />
          <Select
            label="Grupo (rol)"
            name="groupId"
            options={groups}
            value={formData.groupId}
            onChange={handleChange}
            error={errors.groupId}
          />
        </div>

        {/* Columna 3 */}
        <div className="flex flex-col gap-6 my-0 w-[320px]">
          <Input
            label="Fecha de finalización"
            name="userEndDate"
            type="date"
            value={formData.userEndDate}
            onChange={handleChange}
            error={errors.userEndDate}
          />
          <Input
            label="Correo personal"
            name="userEmail"
            type="email"
            value={formData.userEmail}
            onChange={handleChange}
            error={errors.userEmail}
            placeholder="Ej: sofia@correo.com"
          />
          <Input
            label="Correo institucional (opcional)"
            name="userEmailInstitutional"
            type="email"
            value={formData.userEmailInstitutional}
            onChange={handleChange}
            error={errors.userEmailInstitutional}
            placeholder="Opcional"
          />
          <Input
            label="Dirección"
            name="userAddress"
            value={formData.userAddress}
            onChange={handleChange}
            error={errors.userAddress}
            placeholder="Ej: Calle 12 # 5-8"
          />
          <Input
            label="Contraseña"
            name="userPassword"
            type="password"
            value={formData.userPassword}
            onChange={handleChange}
            error={errors.userPassword}
            placeholder="Mín 8, mayús, minús, número y símbolo"
          />

          {errors.form && (
            <p className="text-error text-caption">{errors.form}</p>
          )}

          <div className="flex items-center justify-center gap-6">
            <Button variant="primary" size="sm" type="submit">
              Crear Usuario
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
