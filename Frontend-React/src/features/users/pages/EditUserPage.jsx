import UserEditLeft from "../components/UserEditLeft";
import UserEditRight from "../components/UserEditRight";

export default function EditUserPage(){


    return(
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
                <UserEditLeft/>
            </div>

            <div
                className="
                    bg-white p-4
                "
            >
                <UserEditRight/>
            </div>
        </div>
    );
}