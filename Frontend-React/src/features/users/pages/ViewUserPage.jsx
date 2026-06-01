import UserViewLeft from "../components/UserViewLeft";
import UserViewRight from "../components/UserViewRight";

export default function ViewUserPage(){


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
                <UserViewLeft/>
            </div>

            <div
                className="
                    bg-white p-4
                "
            >
                <UserViewRight/>
            </div>
        </div>
    );
}