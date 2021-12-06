import { useState } from "react";
import Pills from "../components/Pills";
import CustomInput from "../components/CustomInput";
import Search from "../components/Search";
import Button from "../components/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashAlt } from "@fortawesome/free-solid-svg-icons";
import {
    belongToAcessGroupsItems,
    belongToEnvironmentItems,
    environmentPermissions,
    expecificPermissionsItems,
    platformItems,
} from "../utils/teamsMockData";

const TeamDetail = () => {
    const [isActive] = useState(true);
    const [isAdmin] = useState(true);

    return (
        <div className="team_details xl:w-10/12">
            <div className="flex items-center">
                <h2 className="font-bold text-22 dark:text-white">
                    Team {" > "} Saul Frank
                </h2>
                <div className="ml-8">
                    {isActive && <Pills text="Active" color="green" margin="2" size="small" />}
                    {isAdmin && (
                        <Pills text="Admin" color="orange" size="small" />
                    )}
                </div>
            </div>

            <div className="mt-10 flex items-start justify-between">
                <div className="flex-3">
                    <h3 className="font-black text-17 dark:text-white">
                        Details
                    </h3>
                    <div className="mt-3">
                        <CustomInput value="" label="First name" />
                        <CustomInput value="" label="Last name" />
                        <CustomInput value="" label="Email" />
                        <CustomInput value="" label="Job title" />
                        <CustomInput value="" label="Timezone" />

                        <div className="mt-4">
                            <Button text="Save" />
                        </div>

                        <div className="border-b border-divider dark:border-darkDivider my-8"></div>

                        <div>
                            <h3 className="font-black text-17 dark:text-white">
                                Control
                            </h3>

                            <div className="mt-3">
                                <Button text="Change password" variant="border" size="small" />
                                <div className="my-4">
                                    <Button text="Deactivate user" variant="border" size="small" />
                                </div>
                                <Button text="Delete user" variant="border" size="small" />
                            </div>

                            <div className="mt-4">
                                <p className="text-red text-xs w-64">Warning: this action can’t be undone. It is usually better to deactivate a user. </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-3 mx-10 2xl:mx-0">
                    <h3 className="font-black text-17 dark:text-white">
                        Permissions
                    </h3>
                    <div className="mt-3 flex items-center">
                        <div className="flex-1">
                            <Search
                                placeholder="Find platform permissions"
                                onChange={() => {}}
                                classes="ml-0"
                            />
                        </div>
                        <div className="flex-none">
                            <Button text="Add" classes="ml-3" />
                        </div>
                    </div>

                    <div className="mt-6">
                        <h3 className="font-black text-17 dark:text-white">
                            Platform
                        </h3>

                        <div className="mt-4">
                            {platformItems.map((plat) => (
                                <div
                                    className="flex cursor-pointer items-center my-3"
                                    key={plat.id}
                                >
                                    <FontAwesomeIcon
                                        icon={faTrashAlt}
                                        className="text-red text-17 mr-2"
                                    />
                                    <p className="text-sm dark:text-white">{plat.name}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-9">
                        <h3 className="font-black text-17 dark:text-white">
                            Environment permissions
                        </h3>
                        <h4 className="mt-1 text-sm">
                            Environment: Production
                        </h4>

                        <div className="mt-7">
                            {environmentPermissions.map((env) => (
                                <div
                                    className="flex cursor-pointer items-center my-3"
                                    key={env.id}
                                >
                                    <FontAwesomeIcon
                                        icon={faTrashAlt}
                                        className="text-red text-17 mr-2"
                                    />
                                    <p className="text-sm dark:text-white">{env.name}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-16">
                        <h3 className="font-black text-17 dark:text-white">
                            Specific permissions
                        </h3>
                        <h4 className="mt-1 text-sm">
                            Environment: Production
                        </h4>

                        <div className="mt-4">
                            {expecificPermissionsItems.map((perm) => (
                                <div
                                    className="flex cursor-pointer items-center my-3"
                                    key={perm.id}
                                >
                                    <FontAwesomeIcon
                                        icon={faTrashAlt}
                                        className="text-red text-17 mr-2"
                                    />
                                    <p className="text-sm dark:text-white">{perm.name}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex-3">
                    <h3 className="font-black text-17 dark:text-white">
                        Belongs to environments
                    </h3>

                    <div className="mt-3 flex items-center">
                        <div className="flex-1">
                            <Search
                                placeholder="Find access groups"
                                onChange={() => {}}
                                classes="ml-0"
                            />
                        </div>
                        <div className="flex-none">
                            <Button text="Add" classes="ml-3" />
                        </div>
                    </div>

                    <div className="mt-5">
                        {belongToEnvironmentItems.map((perm) => (
                            <div
                                className="flex cursor-pointer items-center my-3"
                                key={perm.id}
                            >
                                <FontAwesomeIcon
                                    icon={faTrashAlt}
                                    className="text-red text-17 mr-2"
                                />
                                <p className="text-sm font-black text-blue">
                                    {perm.name}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-10">
                        <h3 className="font-black text-17 dark:text-white">
                            Belongs to access groups
                        </h3>

                        <div className="mt-3 flex items-center">
                            <div className="flex-1">
                                <Search
                                    placeholder="Find access groups"
                                    onChange={() => {}}
                                    classes="ml-0"
                                />
                            </div>
                            <div className="flex-none">
                                <Button text="Add" classes="ml-3" />
                            </div>
                        </div>

                        <div className="mt-5">
                        {belongToAcessGroupsItems.map((perm) => (
                            <div
                                className="flex cursor-pointer items-center my-3"
                                key={perm.id}
                            >
                                <FontAwesomeIcon
                                    icon={faTrashAlt}
                                    className="text-red text-17 mr-2"
                                />
                                <p className="text-sm font-black text-blue">
                                    {perm.name}
                                </p>
                            </div>
                        ))}
                    </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeamDetail;
