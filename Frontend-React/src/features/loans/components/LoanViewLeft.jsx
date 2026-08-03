import { getLoanStatusLabel } from "../utils/loanStatusLabel";

const API_FILES = "http://localhost:5000"; // mismo patrón de UserViewLeft
const fmt = (d) => (d ? String(d).slice(0, 10) : "—");

export default function LoanViewLeft({ loan }) {
  const receiver = loan?.signatures?.find((s) => s.party === "Receptor")?.user;
  const receiverName = receiver ? `${receiver.userFirstName} ${receiver.userLastName}` : "@Usuario";

  return (
    <div className="font-main text-text-inverse space-y-6 grid sm:flex sm:space-y-0 sm:gap-6 sm:items-center sm:justify-evenly 1400:grid 1400:h-full">
      <div className="grid items-center justify-center justify-items-center 1400:content-between">
        {receiver?.userPhoto ? (
          <img
            src={`${API_FILES}${receiver.userPhoto}`}
            alt={receiverName}
            className="w-32 h-32 object-cover"
          />
        ) : (
          <div className="w-32 h-32 bg-white" />
        )}
        <h3 className="text-h3 text-center">{receiverName}</h3>
      </div>

      <div className="grid text-center">
        <h4>Estado del préstamo:</h4>
        <p>{getLoanStatusLabel(loan?.status)}</p>
      </div>

      <div className="grid text-center">
        <h4>Fecha de inicio:</h4>
        <p>{fmt(loan?.loanDate)}</p>
      </div>

      <div className="grid text-center">
        <h4>Fecha de finalización:</h4>
        <p>{fmt(loan?.returnDate)}</p>
      </div>
    </div>
  );
}
