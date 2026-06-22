import { DataTable, Button, IconButton } from "@/shared"
import { TaskColumns } from "../table/TaskColumns.jsx"
import { tasks } from "../data/tasks.js"
import { Link, useNavigate } from "react-router-dom";
import { Undo2 } from "lucide-react";
import { useState } from "react";

// import ReportConfigModal from "../report/components/ReportConfigModal.jsx"

export default function ListTaskPage() {

    const navigate = useNavigate();
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  return (
    <div className="p-6">

        <div className="flex justify-between mb-6">

            <div
                className="
                    flex items-center gap-2
                "
            >
                <IconButton
                    ariaLabel = "Devolverse"
                    onClick={() => navigate(-1)}
                >
                    <Undo2 strokeWidth={2.8} />
                </IconButton>

                <h1 
                    className="
                        text-xl font-semibold mb-0 text-h3 sm:text-h2
                    "
                >
                    Tareas
                </h1>
            </div>

            {/* <div className="grid sm:flex gap-12 items-center"> */}
                
                {/* <Button
                    variant="secondary" 
                    onClick={() => setIsReportModalOpen(true)}
                >
                    Generar Reporte
                </Button> */}


                <Link to="/dashboard/tasks/create">
                    <Button
                        variant="primary"
                    >
                        Crear Tarea
                    </Button>
                </Link>


            {/* </div> */}
        </div>


      <DataTable
        data={tasks}
        columns={TaskColumns}
      />

      {/* <ReportConfigModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      /> */}


    </div>
  )
}

