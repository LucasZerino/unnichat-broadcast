import { createTheme } from "@mui/material";
export const theme = createTheme({
  cssVariables: true,
  palette: {
    primary: { main: "#2446a8" },
    secondary: { main: "#007c74" },
    background: { default: "#f4f6fa", paper: "#ffffff" },
    text: { primary: "#19283d", secondary: "#657389" },
  },
  typography: {
    fontFamily: '"Segoe UI", sans-serif',
    button: { textTransform: "none", fontWeight: 600 },
    h4: { fontWeight: 700, letterSpacing: "-.04em" },
    h5: { fontWeight: 700, letterSpacing: "-.03em" },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiDialog: { defaultProps: { fullWidth: true, maxWidth: "sm" } },
    MuiTextField: { defaultProps: { size: "small" } },
    MuiPaper: { defaultProps: { elevation: 0 } },
    MuiTab: {
      styleOverrides: {
        root: { textTransform: "none", minHeight: 56, fontWeight: 600 },
      },
    },
  },
});
