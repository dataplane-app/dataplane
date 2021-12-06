import { useState, useEffect } from 'react';
import Lottie from "react-lottie";
import Loader from '../../assets/animations/spinner.json'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons'
import { useNavigate } from 'react-router-dom'

const SetupLoader = () => {
    let navigate = useNavigate();

    const [isSettingProfile, setIsSettingProfile] = useState(true);
    const [isCreatingEnv, setIsCreatingEnv] = useState(true);
    const [isCreatingAdmin, setIsCreatingAdmin] = useState(true);

    useEffect(() => {
        const settingProfile = window.setTimeout(() => {
            setIsSettingProfile(false);
        }, 1000);

        const creatingEnv = window.setTimeout(() => {
            setIsCreatingEnv(false);
        }, 2000);
    
        const isCreatingAdmin = window.setTimeout(() => {
            setIsCreatingAdmin(false);
        }, 3000);

        const goToCongrats = window.setTimeout(() => {
            navigate('/congratulations')
        }, 3300)
    
        return () => {
            window.clearTimeout(settingProfile);
            window.clearTimeout(creatingEnv);
            window.clearTimeout(isCreatingAdmin);
            window.clearTimeout(goToCongrats);
        };
    }, []);

    return(
        <div className="mt-9">
            <div className="flex items-center">
                <div className="w-11">
                    {
                        isSettingProfile ?
                        <Lottie
                                options={{
                                    animationData: Loader,
                                    autoplay: true,
                                }}
                                loop
                                className='text-3xl'
                            /> : <FontAwesomeIcon className="text-green text-4xl" icon={faCheckCircle} />
                    }
                </div>
                <p className="ml-5 text-lg dark:text-white">Setting business profile</p>
            </div>

            <div className="flex items-center mt-4">
                <div className="w-11">
                    {
                        isCreatingEnv ?
                        <Lottie
                                options={{
                                    animationData: Loader,
                                    autoplay: true,
                                }}
                                loop
                                isClickToPauseDisabled={true}
                                height={44}
                            /> : <FontAwesomeIcon className="text-green w-full text-4xl" icon={faCheckCircle} />
                    }
                </div>
                <p className="ml-5 text-lg dark:text-white">Creating environments</p>
            </div>

            <div className="flex items-center mt-4">
                <div className="w-11">
                    {
                        isCreatingAdmin ?
                        <Lottie
                                options={{
                                    animationData: Loader,
                                    autoplay: true,
                                }}
                                loop
                                isClickToPauseDisabled={true}
                                height={44}
                            /> : <FontAwesomeIcon className="text-green w-full text-4xl" icon={faCheckCircle} />
                    }
                </div>
                <p className="ml-5 text-lg dark:text-white">Creating admin user</p>
            </div>
        </div>
    )
}

export default SetupLoader;