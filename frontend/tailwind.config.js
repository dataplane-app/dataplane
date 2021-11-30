module.exports = {
    purge: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                orange: "#FF5722",
                orangeLight: "rgba(255, 87, 34, 0.16)",
                green: "rgba(83, 138, 45, 0.79)",
                greenLight: "rgba(114, 184, 66, 0.24)",
                red: "#F80000",
                redLight: "rgba(248, 0, 0, 0.09)",
                purple: "#7B61FF",
                purpleLight: "rgba(123, 97, 255, 0.12)",
                blue: "#0073C6",
                online: "#2E6707",
                halfBlack: "rgba(0, 0, 0, 0.52)"
            },
            borderColor: {
                gray: "#D3D3D3",
                divider: "#C7C3C3"
            },
            fontSize: {
                title: "1.75rem",
                "17": "1.0625rem",
                "22": "1.375rem"
            },
        },
    },
    variants: {
        extend: {},
    },
    plugins: [],
};
