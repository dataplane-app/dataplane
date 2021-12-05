import HeaderDropdown from "../HeaderDropdown";

const Navbar = () => {
    return(
        <div className="absolute top-0 left-0 right-0 border-b border-divider dark:border-darkNav w-full dark:bg-darkSecondary">
            <div className="flex items-center justify-between">
                <h1 className="text-orange font-bold text-title py-6 ml-3">Dataplane</h1>

                <div className="flex items-center mr-2">
                    <div className="mr-6">
                        <p className="text-2xl dark:text-white">22:47</p>
                        <p className="text-17 -mt-1 dark:text-white">Europe/London</p>
                    </div>

                    <HeaderDropdown title="Production" subtitle="Enviroment" />
                    <HeaderDropdown title="Saul Frank" user="Saul" subtitle="Data Engineer">
                        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Culpa reprehenderit id quisquam assumenda.</p>
                    </HeaderDropdown>
                </div>
            </div>
        </div>
    )
}

export default Navbar;