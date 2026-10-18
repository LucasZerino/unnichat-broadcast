import React from "react";
import ReactDOM from "react-dom/client";
import {
  CssBaseline,
  GlobalStyles,
  StyledEngineProvider,
  ThemeProvider,
} from "@mui/material";
import App from "./App";
import { theme } from "./theme";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <StyledEngineProvider enableCssLayer>
      <GlobalStyles styles="@layer theme, base, mui, components, utilities;" />
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </StyledEngineProvider>
  </React.StrictMode>,
);
