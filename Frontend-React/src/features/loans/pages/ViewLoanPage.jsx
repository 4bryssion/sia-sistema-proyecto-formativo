import LoanViewLeft from "../components/LoanViewLeft";
import LoanViewRight from "../components/LoanViewRight";

export default function ViewLoanPage() {
  return (
    <div
      className="
        p-6 grid 1400:grid-cols-[380px_1fr]
      "
    >
      <div
        className="
          bg-black p-16 1400:h-full
        "
      >
        <LoanViewLeft />
      </div>

      <div
        className="
          bg-white p-4
        "
      >
        <LoanViewRight />
      </div>
    </div>
  );
}
