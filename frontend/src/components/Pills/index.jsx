const Pills = ({ amount, color, text }) => {
    return (
        <div className={`rounded-3xl inline-flex items-center bg-${color}Light mr-4 w-auto`}>
            {
                amount && 
                <div className={`rounded-full flex items-center justify-center bg-${color} w-8 h-8 ml-1`}>
                    <p className="text-white font-bold p-4">{amount}</p>
                </div>
            }

            <p className={`text-${color} ${!amount ? 'px-5' : 'ml-2'} font-bold text-sm pr-5 py-2`}>{text}</p>
        </div>
    )
}

export default Pills;