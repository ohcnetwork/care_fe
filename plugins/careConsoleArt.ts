import type { Plugin } from "vite";

const careLogo = `
          +++++   ++++++                                                            
          +++++   ++++++            ######     ##### ###  #########   #####         
     +++++++++#####+++++++++      ########## ###########  ######### #########       
     ++++++   #####    +++++     #####   ## #####  #####  #####    ####   ####      
      ++++#############+++++     ####       ####     ###  ####    ############      
          ##############         #####   ## #####   ####  ####     ####    #        
          ##############          ########## ###########  ####      #########       
              #####                  #####     ##### ###  ####       #######        
              #####                                                                 
`;

// ANSI color codes for beautiful terminal output
const colors = {
  green: "\x1b[32m",
  brightBlue: "\x1b[94m",
  bold: "\x1b[1m",
  reset: "\x1b[0m",
};

// Function to center text in a given width
function centerText(text: string, width: number): string {
  const padding = Math.max(0, Math.floor((width - text.length) / 2));
  return " ".repeat(padding) + text;
}

export function careConsoleArt(): Plugin {
  return {
    name: "vite-plugin-care-console-art",
    configureServer(server) {
      server.httpServer?.once("listening", () => {
        console.log(
          `\n${colors.brightBlue}${colors.bold}══════════════════════════════════════════════════════════════════════════════════════════${colors.reset}`,
        );
        console.log(
          `${colors.brightBlue}${colors.bold}${centerText("WELCOME TO OPEN HEALTHCARE NETWORK", 90)}${colors.reset}`,
        );
        console.log(
          `${colors.brightBlue}${colors.bold}══════════════════════════════════════════════════════════════════════════════════════════${colors.reset}\n`,
        );

        console.log(`${colors.green}${colors.bold}%s${colors.reset}`, careLogo);
        console.log(
          `${colors.brightBlue}${colors.bold}══════════════════════════════════════════════════════════════════════════════════════════${colors.reset}\n`,
        );
      });
    },
  };
}
