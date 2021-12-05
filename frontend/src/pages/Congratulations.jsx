import Button from "../components/Button";
import Lottie from "react-lottie";
import Confetti from '../assets/animations/confetti.json';
import { useNavigate } from "react-router-dom";

const Congratulations = () => {
    let navigate = useNavigate();

    return(
        <div className="congratulation h-screen overflow-y-hidden relative">
            <div className="absolute top-0 left-0 right-0 border-b border-gray dark:border-darkNav w-full dark:bg-darkPrimary">
                <h1 className="text-orange font-bold text-title py-6 ml-3">
                    Dataplane
                </h1>
            </div>

            <div className="h-full flex items-center justify-center">
                <div className="h-full absolute -bottom-24 z-1">
                    <Lottie
                        options={{
                            animationData: Confetti,
                            autoplay: true,
                        }}
                        loop
                        isClickToPauseDisabled={true}
                    />
                </div>
                <div>
                    <div className="flex items-center relative">
                        <h2 className="text-purple font-bold text-6xl text-center">Congratulations</h2>
                        <span className="lg:absolute lg:-right-24 bg-transparent text-6xl">🎉</span>
                    </div>
                    <h3 className="mt-5 text-purple text-lg text-center">Ready to build data pipelines!</h3>

                    <div className="mt-60 md:w-3/4 mx-auto z-10 relative">
                        <Button text="Let’s get started" onClick={() => navigate('/')} />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Congratulations;