import { useState } from "react";
import Button from "../Button";
import CustomInput from "../CustomInput";
import ThemeToggle from "../ThemeToggle";

const GetStartedForm = ({ setIsNext }) => {
    const [bussinessName] = useState();

    return (
        <>
            <div className="my-9 md:w-11/12">
                <h3 className="dark:text-white text-22 font-bold">Business</h3>
                <CustomInput
                    label="Bussiness name"
                    required
                    value={bussinessName}
                    onChange={() => {}}
                />
                <CustomInput
                    label="Timezone"
                    required
                    value=""
                    onChange={() => {}}
                />
            </div>

            <div className="my-9 md:w-11/12">
                <h3 className="dark:text-white text-22 font-bold">
                    Admin user
                </h3>
                <CustomInput
                    label="First name"
                    required
                    value=""
                    onChange={() => {}}
                />
                <CustomInput
                    label="Last name"
                    required
                    value=""
                    onChange={() => {}}
                />
                <CustomInput
                    label="Email"
                    required
                    value=""
                    onChange={() => {}}
                />
                <CustomInput
                    label="Job title"
                    required
                    value=""
                    onChange={() => {}}
                />
                <CustomInput
                    label="Password"
                    type="password"
                    required
                    value=""
                    onChange={() => {}}
                />
            </div>

            <div className="mt-4 mb-9 flex items-center justify-start md:w-11/12">
                <ThemeToggle />
                <p className="ml-6 text-sm dark:text-white">
                    Mode <span className="block">preference</span>{" "}
                </p>
            </div>

            <div className="md:w-11/12">
                <Button text="Next" onClick={() => setIsNext(true)} />
            </div>
        </>
    );
};

export default GetStartedForm;
