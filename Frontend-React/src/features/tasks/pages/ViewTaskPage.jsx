// import ViewLayout from "@/shared"; // ajusta este import si ViewLayout ya envuelve la página por el router
import TaskViewLeft from "../components/TaskViewLeft";
import TaskViewRight from "../components/TaskViewRight";

export default function ViewTaskPage() {

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
                    <TaskViewRight/>
                </div>
            </div>
        );
}