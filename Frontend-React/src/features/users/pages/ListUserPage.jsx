import { DataTable, Button, IconButton } from "@/shared"
import { UserColumns } from "../table/UserColumns"
import { users } from "../data/users"
import { Link, useNavigate } from "react-router-dom";
import { Undo2 } from "lucide-react";
// import { useState } from "react";

// import ReportConfigModal from "../reports/components/ReportConfigModal.jsx"

export default function ListUserPage() {

    const navigate = useNavigate();
    // const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  return (
    <div className="p-6">

        <div className="flex justify-between mb-6">

            <div
                className="
                    flex items-center gap-4
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
                    Usuarios
                </h1>
            </div>

            <div className="grid sm:flex gap-12 items-center">
                
                {/* <Button
                    variant="secondary" 
                    onClick={() => setIsReportModalOpen(true)}
                >
                    Generar Reporte
                </Button> */}


                <Link to="/users/create">
                    <Button
                        variant="primary"
                    >
                        Crear Usuario
                    </Button>
                </Link>


            </div>
        </div>


      <DataTable
        data={users}
        columns={UserColumns}
      />

      {/* <ReportConfigModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      /> */}


    </div>
  )
}

