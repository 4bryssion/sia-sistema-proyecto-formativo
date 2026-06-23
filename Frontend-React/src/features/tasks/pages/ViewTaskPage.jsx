import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import taskService from "../services/taskService";
import TaskViewLeft from "../components/TaskViewLeft";
import TaskViewRight from "../components/TaskViewRight";

export default function ViewTaskPage() {
  const { id } = useParams();
  const [task, setTask] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setTask(await taskService.getById(id));
      } catch (err) {
        setError(err.response?.data?.error ?? "Error al cargar la tarea");
      }
    })();
  }, [id]);

  if (error) return <p className="p-6 text-error">{error}</p>;
  if (!task) return <p className="p-6 text-gray-600">Cargando tarea...</p>;

  return (
    <div className="p-6 mt-12 grid 1400:grid-cols-[380px_1fr]">
      <div className="bg-black p-16 1400:h-full">
        <TaskViewLeft task={task} />
      </div>
      <div className="bg-white p-4">
        <TaskViewRight task={task} />
      </div>
    </div>
  );
}
