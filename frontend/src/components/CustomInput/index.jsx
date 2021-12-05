import './styles.css';

const CustomInput = ({ label, required, ...props }) => {
    return (
        <div className="outline relative border border-gray dark:border-darkGray my-4 rounded-md border-b-2 focus-within:border-blue-500">
            <input
                {...props}
                required={required}
                type="text" 
                name="customInput" 
                placeholder=" " 
                className="block relative z-2 text-sm px-4 py-3 w-full appearance-none focus:outline-none bg-transparent text-grayInput dark:text-white"
            />
            <label 
                htmlFor="customInput" 
                className="outline rounded-md absolute top-0 px-4 py-3 text-grayInput dark:text-white bg-white dark:bg-darkSecondary z-1 duration-300 origin-0 text-sm"
            >
                {label}{required && <span className="text-red text-xs ml-2">*</span>}
            </label>
        </div>
    );
};

export default CustomInput;
