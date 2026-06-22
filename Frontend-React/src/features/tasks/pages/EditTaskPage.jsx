import TaskViewLeft from "../components/TaskViewLeft";
import TaskEditRight from "../components/TaskEditRight";

export default function EditTaskPage() {

    return(
                <div
                    className="
                        p-6 mt-12 grid 1400:grid-cols-[380px_1fr]
                    "
                >
                    <div
                        className="
                            bg-black p-16 1400:h-full
                        "
                    >
                        <TaskViewLeft/>
                    </div>
        
                    <div
                        className="
                            bg-white p-4
                        "
                    >
                        <TaskEditRight/>
                    </div>
                </div>
            );
}