import { createMuiTheme, responsiveFontSizes } from "@material-ui/core/styles";
import { blueGrey } from "@material-ui/core/colors";

let theme = createMuiTheme({
  palette: {
    primary: blueGrey
  }
});
theme = responsiveFontSizes(theme);
export default theme;
