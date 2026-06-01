import { DataTable, Button, IconButton } from "@/shared"
import { loanColumns } from "../table/loanColumns"
import { loans } from "../data/loan"
import { Link, useNavigate } from "react-router-dom";
import { Undo2 } from "lucide-react";
import { useState } from "react";

import ReportConfigModal from "../reports/components/ReportConfigModal.jsx"

export default function ListLoanPage() {

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
                        ariaLabel="Devolverse"
                        onClick={() => navigate(-1)}
                    >
                        <Undo2 strokeWidth={2.8} />
                    </IconButton>

                    <h1
                        className="
                            text-xl font-semibold mb-0 text-h3 sm:text-h2
                        "
                    >
                        Préstamos
                    </h1>
                </div>

                <div className="grid sm:flex gap-12 items-center">

                    <Button
                        variant="secondary"
                        onClick={() => setIsReportModalOpen(true)}
                    >
                        Generar Reporte
                    </Button>

                    <Link to="/loans/create">
                        <Button
                            variant="primary"
                        >
                            Crear Préstamo
                        </Button>
                    </Link>

                </div>
            </div>

            <DataTable
                data={loans}
                columns={loanColumns}
            />

            <ReportConfigModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
            />

        </div>
    )
}