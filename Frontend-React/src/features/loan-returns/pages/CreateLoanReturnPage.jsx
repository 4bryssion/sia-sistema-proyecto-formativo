import { useParams } from "react-router-dom";
import LoanReturnLeft from "../components/LoanReturnLeft";
import LoanReturnRight from "../components/LoanReturnRight";

// Página para registrar el retorno de un préstamo
export default function CreateLoanReturnPage() {

  // Obtiene el id del préstamo desde la URL
  const { id } = useParams();

  return (
    <div className="p-6 grid 1400:grid-cols-[380px_1fr]">
      <div className="bg-black p-16 1400:h-full">
        <LoanReturnLeft />
      </div>
      <div className="bg-white p-4">
        <LoanReturnRight loanId={id} materialId={id} />
      </div>
    </div>
  );
}