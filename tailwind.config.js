/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        marca: {
          canela: "#A6613A",   // Madera de canela - Marrón cálido
          beige: "#F8F7E1",    // Beige - Tono claro de fondo
          tomate: "#C13828",   // Mermelada de tomate - Rojo intenso
          otono: "#E56B31",    // Hoja de otoño - Naranja cálido
          lima: "#C0D873",     // Crema de lima - Verde suave y fresco
        },
      },
      fontFamily: {
        sans: ["Montserrat", "ui-sans-serif", "system-ui", "sans-serif"],
        titular: ["Rubik", "Berlinsans", "Montserrat", "sans-serif"],
        display: ["Rubik", "Montserrat", "sans-serif"],
        subtitulo: ["Bumbbled", "Montserrat", "sans-serif"],
      },
    },
  },
  plugins: [],
};
