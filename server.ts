import { createApp } from "./server/app";

// Vercel serves the Vite output directory as static assets and runs this
// exported Express application for dynamic/API requests.
export default createApp();
