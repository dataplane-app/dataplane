const Pills = ({ amount, color, text }) => {
    return (
        <div className={`rounded-3xl flex items-center bg-${color}Light mr-4`}>
            <div className={`rounded-full flex items-center justify-center bg-${color} w-8 h-8 ml-1`}>
                <p className="text-white font-bold p-4">{amount}</p>
            </div>

            <p className={`text-${color} font-bold text-sm ml-2 pr-5 py-2`}>{text}</p>
        </div>
    )
}

export default Pills;