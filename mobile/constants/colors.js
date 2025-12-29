// constants/colors.js
const coffeeTheme = {
    primary: "#8B593E",
    background: "#FFF8F3",
    text: "#4A3428",
    border: "#E5D3B7",
    white: "#FFFFFF",
    textLight: "#9A8478",
    expense: "#E74C3C",
    income: "#2ECC71",
    card: "#FFFFFF",
    shadow: "#000000",
};

const forestTheme = {
    primary: "#009b40",
    background: "#E8F5E9",
    text: "#1B5E20",
    border: "#C8E6C9",
    white: "#FFFFFF",
    textLight: "#66BB6A",
    expense: "#C62828",
    income: "#388E3C",
    card: "#FFFFFF",
    shadow: "#000000",
};

const purpleTheme = {
    primary: "#6A1B9A",
    background: "#F3E5F5",
    text: "#4A148C",
    border: "#D1C4E9",
    white: "#FFFFFF",
    textLight: "#BA68C8",
    expense: "#D32F2F",
    income: "#388E3C",
    card: "#FFFFFF",
    shadow: "#000000",
};

const oceanTheme = {
    primary: "#0277BD",
    background: "#E1F5FE",
    text: "#01579B",
    border: "#B3E5FC",
    white: "#FFFFFF",
    textLight: "#4FC3F7",
    expense: "#EF5350",
    income: "#26A69A",
    card: "#FFFFFF",
    shadow: "#000000",
};
const sunriseTheme = {
    primary: "#FF6F61",
    background: "#FFF3E0",
    text: "#BF360C",
    border: "#FFDAB9",
    white: "#FFFFFF",
    textLight: "#FFAB91",
    expense: "#E53935",
    income: "#43A047",
    card: "#FFFFFF",
    shadow: "#FFCCBC",
};

const auroraTheme = {
    primary: "#7B1FA2",
    background: "#F3E8FD",
    text: "#4A0072",
    border: "#CE93D8",
    white: "#FFFFFF",
    textLight: "#BA68C8",
    expense: "#F44336",
    income: "#4CAF50",
    card: "#FFFFFF",
    shadow: "#E1BEE7",
};

const tealGlowTheme = {
    primary: "#009688",
    background: "#E0F2F1",
    text: "#004D40",
    border: "#B2DFDB",
    white: "#FFFFFF",
    textLight: "#4DB6AC",
    expense: "#F06292",
    income: "#81C784",
    card: "#FFFFFF",
    shadow: "#80CBC4",
};

const goldenHourTheme = {
    primary: "#F57F17",
    background: "#FFF8E1",
    text: "#E65100",
    border: "#FFECB3",
    white: "#FFFFFF",
    textLight: "#FFD54F",
    expense: "#FF7043",
    income: "#66BB6A",
    card: "#FFFFFF",
    shadow: "#FFE082",
};

const midnightTheme = {
    primary: "#37474F",
    background: "#ECEFF1",
    text: "#263238",
    border: "#B0BEC5",
    white: "#FFFFFF",
    textLight: "#90A4AE",
    expense: "#EF5350",
    income: "#26A69A",
    card: "#FFFFFF",
    shadow: "#90A4AE",
};

const blushTheme = {
    primary: "#EC407A",
    background: "#FCE4EC",
    text: "#880E4F",
    border: "#F8BBD0",
    white: "#FFFFFF",
    textLight: "#F48FB1",
    expense: "#E57373",
    income: "#81C784",
    card: "#FFFFFF",
    shadow: "#F48FB1",
};
const darkTheme = {
    primary: "#1F1F1F",        // deep gray for main elements
    background: "#121212",     // true dark background
    text: "#E0E0E0",           // light gray for general text
    border: "#2C2C2C",         // subtle border contrast
    white: "#FFFFFF",          // for accents or highlights
    textLight: "#A0A0A0",      // secondary/descriptive text
    expense: "#FF6B6B",        // vibrant red-pink for expenses
    income: "#4CAF50",         // vivid green for income
    card: "#1E1E1E",           // card backgrounds slightly lifted
    shadow: "#000000",         // real shadows for depth
};

const blueTheme = {
    primary: "#1967fc",      // Keep your blue primary
    background: "#E3F2FD",   // Light blue background (was #FCE4EC)
    text: "#0D47A1",         // Dark blue text (was #880E4F)
    border: "#90CAF9",       // Medium blue border (was #F8BBD0)
    white: "#FFFFFF",        // Keep white
    textLight: "#64B5F6",    // Light blue text (was #F48FB1)
    expense: "#E57373",      // Keep red for expenses
    income: "#81C784",       // Keep green for income
    card: "#FFFFFF",         // Keep white cards
    shadow: "#90CAF9",       // Blue shadow (was #F48FB1)
};

const deepBlueTheme = {
    primary: "#1565C0",
    background: "#E1F5FE",
    text: "#0D47A1",
    border: "#81D4FA",
    white: "#FFFFFF",
    textLight: "#4FC3F7",
    expense: "#EF5350",
    income: "#66BB6A",
    card: "#FFFFFF",
    shadow: "#81D4FA",
};

const azureBlueTheme = {
    primary: "#2196F3",
    background: "#F5F9FF",
    text: "#1976D2",
    border: "#BBDEFB",
    white: "#FFFFFF",
    textLight: "#64B5F6",
    expense: "#FF5252",
    income: "#4CAF50",
    card: "#FFFFFF",
    shadow: "#BBDEFB",
    accent: "#2979FF",
};

export const THEMES = {
    coffee: coffeeTheme,
    forest: forestTheme,
    purple: purpleTheme,
    ocean: oceanTheme,
    sunrise: sunriseTheme,
    aurora: auroraTheme,
    tealGlow: tealGlowTheme,
    goldenHour: goldenHourTheme,
    midnight: midnightTheme,
    blush: blushTheme,
    dark: darkTheme,
    blue: blueTheme,
    deepOcean: deepBlueTheme,
    azureTheme: azureBlueTheme

};



// 👇 change this to switch theme
export const COLORS = THEMES.azureTheme;