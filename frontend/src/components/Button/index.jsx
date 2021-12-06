import classNames from '../../utils/classNames';

const Button = ({ classes, text, size = 'large', variant = 'solid', ...props }) => {
    const SIZE_MAPS = {
        small: 'p-2 text-xs',
        large: 'p-3 text-sm',
    };

    const COLOR_MAPS = {
        blue: 'bg-blue hover:bg-indigo-500' ,
    };

    const VARIANT_MAPS = {
        border: 'bg-transparent border-2 border-red text-red hover:bg-redLight',
        solid: COLOR_MAPS['blue']
    };
    
    return (
        <button
            {...props}
            className={
                classNames(
                    'rounded-md text-white font-bold w-full',
                    classes,
                    SIZE_MAPS[size],
                    VARIANT_MAPS[variant]
            )}>
            {text}
        </button>
    );
};

export default Button;
