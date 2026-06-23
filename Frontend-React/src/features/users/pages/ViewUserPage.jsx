import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import userService from "../services/userService";
import UserViewLeft from "../components/UserViewLeft";
import UserViewRight from "../components/UserViewRight";

export default function ViewUserPage() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try { setUser(await userService.getById(id)); }
      catch (err) { setError(err.response?.data?.error ?? "Error al cargar el usuario"); }
    })();
  }, [id]);

  if (error) return <p className="p-6 text-error">{error}</p>;
  if (!user) return <p className="p-6 text-gray-600">Cargando usuario...</p>;

  return (
    <div className="p-6 grid 1400:grid-cols-[380px_1fr]">
      <div className="bg-black p-16 1400:h-full"><UserViewLeft user={user} /></div>
      <div className="bg-white p-4"><UserViewRight user={user} /></div>
    </div>
  );
}
