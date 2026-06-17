import LoanEditLeft from "../components/LoanEditLeft";
import LoanEditRight from "../components/LoanEditRight";

export default function EditLoanPage() {
  return (
    <div className="p-6 grid 1400:grid-cols-[380px_1fr]">
      <div className="bg-black p-16 1400:h-full">
        <LoanEditLeft />
      </div>
      <div className="bg-white p-4">
        <LoanEditRight />
      </div>
    </div>
  );
}