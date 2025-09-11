export const ColorDark = "#ffffff";
export const ColorLight = "#000000";

export function hexToRgb(hex) {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : null;
}
export const contrastColor = (incol, darkColor = ColorDark, lightColor = ColorLight) => {
    const threshold = 186;
    let rgb;

    if (typeof incol === 'string' && incol.startsWith("#")) {
        rgb = hexToRgb(incol);
    } else if (Array.isArray(incol) && incol.length === 3) {
        rgb = incol;
    } else {
        throw new Error("Invalid color format. Please provide a hex color or an RGB array.");
    }

    return (((rgb[0] * 0.299) + (rgb[1] * 0.587) + (rgb[2] * 0.114)) > threshold) ? darkColor : lightColor;
};
export function getContrastingTextColor(backgroundColor, textColor) {
    // Calculate the relative luminance of the background and text colors
    const backgroundLuminance = calculateLuminance(backgroundColor);
    const textLuminance = calculateLuminance(textColor);

    // Determine the appropriate contrasting color
    const luminanceDiff = Math.abs(backgroundLuminance - textLuminance);
    return luminanceDiff > 0.5 ? textColor : invertColor(textColor);
}
export function calculateLuminance(hexColor) {
    const r = parseInt(hexColor.slice(1, 3), 16) / 255;
    const g = parseInt(hexColor.slice(3, 5), 16) / 255;
    const b = parseInt(hexColor.slice(5, 7), 16) / 255;

    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luminance;
}
export function invertColor(hexColor) {
    const r = 255 - parseInt(hexColor.slice(1, 3), 16);
    const g = 255 - parseInt(hexColor.slice(3, 5), 16);
    const b = 255 - parseInt(hexColor.slice(5, 7), 16);

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
