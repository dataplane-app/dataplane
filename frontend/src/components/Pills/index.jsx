import classNames from "../../utils/classNames";

const Pills = ({
    classes,
    amount,
    color = "orange",
    text,
    size = "normal",
    margin = "none"
}) => {
    const SIZE_MAPS = {
        small: `py-2 text-xs ${!amount ? 'px-2' : 'ml-2'}`,
        normal: `py-3 pr-3 text-sm ${!amount ? 'px-3' : 'ml-2'}`,
    };

    const COLOR_MAPS = {
        orange: "bg-orangeLight text-orange",
        green: "bg-greenLight text-green",
        red: "bg-redLight text-red",
        purple: "bg-purpleLight text-purple",
    };

    const AMOUNT_COLOR = {
        orange: "bg-orange",
        green: "bg-green",
        red: "bg-red",
        purple: "bg-purple",
    };

    const MARGIN = {
        "2": "mr-2",
        "4": "mr-4",
        none: "mr-0"
    }

    return (
        <div
            className={classNames(
                "rounded-3xl inline-flex items-center w-auto",
                classes,
                COLOR_MAPS[color],
                MARGIN[margin]
            )}
        >
            {amount && (
                <div
                    className={classNames(
                        "rounded-full flex items-center justify-center w-8 h-8 ml-1",
                        AMOUNT_COLOR[color]
                    )}
                >
                    <p className="text-white font-bold p-4">{amount}</p>
                </div>
            )}

            <p
                className={classNames(
                    "font-bold",
                    SIZE_MAPS[size]
                )}
            >
                {text}
            </p>
        </div>
    );
};

export default Pills;
