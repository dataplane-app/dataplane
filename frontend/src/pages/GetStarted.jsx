import { useState } from "react";
import DataplaneDetail from "../assets/images/detail.png";
import GetStartedForm from "../components/GetStartedForm";
import SetupLoader from "../components/SetupLoader";

const GetStarted = () => {
    const [isNext, setIsNext] = useState(false);

    return (
        <div className="get-started h-screen overflow-x-hidden dark:bg-darkPrimary">
            <div className="relative top-0 left-0 right-0 border-b border-gray dark:border-darkNav w-full dark:bg-darkSecondary">
                <h1 className="text-orange font-bold text-title py-6 ml-3">
                    Dataplane
                </h1>
            </div>

            <div className="container mt-24 mb-28">
                <div className="w-full flex items-start justify-center">
                    <div className="flex flex-col items-center lg:flex-row lg:items-start justify-center lg:justify-between">
                        <div className="flex-1">
                            <h2 className="font-bold text-3xl dark:text-white">
                                First time setup
                            </h2>

                            {isNext ? <SetupLoader /> : <GetStartedForm setIsNext={setIsNext} />}
                        </div>

                        <div className="flex-2">
                            <img
                                src={DataplaneDetail}
                                alt="DataPlane"
                                className="ml-4 md:ml-12 hidden transform scale-110 lg:block"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GetStarted;
