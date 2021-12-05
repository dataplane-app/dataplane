const Button = ({ classes, text, ...props }) => {
    return (
        <button
            {...props}
            className={`${classes} bg-blue rounded-md p-3 text-white font-bold text-sm w-full hover:bg-indigo-500`}
        >
            {text}
        </button>
    );
};

export default Button;
