import { Input, Button, Select, CancelButton } from "@/shared";
import { Save } from "lucide-react";
import logo from "@/assets/logos/logo-sena-negro.png";

const ACCOUNT_TYPE_OPTIONS = [
  { id: "Solidario", value: "Solidario", label: "Solidario" },
  { id: "Cuentadante", value: "Cuentadante", label: "Cuentadante" },
];

export default function UserEditRight({
  form,
  onChange,
  documentTypes = [],
  errors = {},
  onSubmit,
  saving,
}) {
  return (
    <div className="relative">
      <div className="mb-4 1400:grid 1400:grid-cols-2 1400:gap-6">
        <h2 className="font-main text-h2 text-center font-bold 1400:text-start 1400:justify-self-center 1400:w-[320px]">
          Usuario
        </h2>
      </div>

      <div className="grid lg:grid-cols-2 lg:gap-4 w-full">
        <div className="grid gap-1 justify-items-center">
          <Input
            label="Nombre"
            name="userFirstName"
            value={form.userFirstName}
            onChange={onChange}
            error={errors.userFirstName}
          />
          <Input
            label="Apellido"
            name="userLastName"
            value={form.userLastName}
            onChange={onChange}
            error={errors.userLastName}
          />
          <Select
            label="Tipo de documento"
            name="documentTypeId"
            options={documentTypes}
            value={form.documentTypeId}
            onChange={onChange}
            error={errors.documentTypeId}
          />
          <Input
            label="Número de documento"
            name="userDocumentNumber"
            value={form.userDocumentNumber}
            onChange={onChange}
            error={errors.userDocumentNumber}
          />
          <Input
            label="Teléfono"
            name="userPhone"
            type="tel"
            value={form.userPhone}
            onChange={onChange}
            error={errors.userPhone}
          />
          <Input
            label="Teléfono secundario (opcional)"
            name="userSecondPhone"
            type="tel"
            value={form.userSecondPhone}
            onChange={onChange}
            error={errors.userSecondPhone}
          />
        </div>

        <div className="grid gap-1 justify-items-center lg:h-max">
          <Select
            label="Tipo de cuenta"
            name="userAccountType"
            options={ACCOUNT_TYPE_OPTIONS}
            value={form.userAccountType}
            onChange={onChange}
            error={errors.userAccountType}
          />
          <Input
            label="Fecha de finalización"
            name="userEndDate"
            type="date"
            value={form.userEndDate}
            onChange={onChange}
            error={errors.userEndDate}
          />
          <Input
            label="Correo personal"
            name="userEmail"
            type="email"
            value={form.userEmail}
            onChange={onChange}
            error={errors.userEmail}
          />
          <Input
            label="Correo institucional (opcional)"
            name="userEmailInstitutional"
            type="email"
            value={form.userEmailInstitutional}
            onChange={onChange}
            error={errors.userEmailInstitutional}
          />
          <Input
            label="Dirección"
            name="userAddress"
            value={form.userAddress}
            onChange={onChange}
            error={errors.userAddress}
          />
        </div>
      </div>

      {errors.form && (
        <p className="text-error text-caption mt-4">{errors.form}</p>
      )}
      
      <div className="grid gap-4 mt-4 sm:flex sm:w-80 sm:mx-auto sm:justify-end lg:flex lg:w-full lg:justify-end">
        <CancelButton disabled={saving} />
        <Button
          variant="primary"
          className="gap-2 lg:justify-self-end lg:mr-24"
          onClick={onSubmit}
          disabled={saving}
        >
          <Save size={16} />
          Guardar
        </Button>
      </div>

      <img
        src={logo}
        alt="Logo SENA"
        className="absolute right-0 -bottom-3 w-16"
      />
    </div>
  );
}
