import LoanReturnLeft from "../components/LoanReturnLeft";
import LoanReturnRight from "../components/LoanReturnRight";

// Página para registrar el retorno de un préstamo
export default function CreateLoanReturnPage() {

  return (
    <div className="p-6 grid 1400:grid-cols-[380px_1fr]">
      <div className="bg-black p-16 1400:h-full">
        <LoanReturnLeft />
      </div>
      <div className="bg-white p-4">
        <LoanReturnRight />
      </div>
    </div>
  );
}