const Navbar = () => {
    return(
        <div className="absolute top-0 left-0 right-0 border-b border-divider w-full">
            <div className="flex items-center justify-between">
                <h1 className="text-orange font-bold text-title my-6 ml-3">Dataplane</h1>

                <div className="flex items-center mr-2">
                    <div>
                        <p className="text-2xl ">22:47</p>
                        <p className="text-17 -mt-1">Europe/London</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Navbar;