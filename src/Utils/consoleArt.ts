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

// Function to center text in a given width
function centerText(text: string, width: number): string {
  const padding = Math.max(0, Math.floor((width - text.length) / 2));
  return " ".repeat(padding) + text;
}

export function displayCareConsoleArt() {
  const separator =
    "══════════════════════════════════════════════════════════════════════════════════════════";
  const welcomeText = centerText("WELCOME TO OPEN HEALTHCARE NETWORK", 90);

  // Use CSS styling for browser console
  console.log(
    "%c" + separator + "\n%c" + welcomeText + "\n%c" + separator,
    "color: #4B9CD3; font-weight: bold;",
    "color: #4B9CD3; font-weight: bold;",
    "color: #4B9CD3; font-weight: bold;",
  );

  console.log("%c" + careLogo, "color: #2ECC71; font-weight: bold;");

  console.log("%c" + separator, "color: #4B9CD3; font-weight: bold;");
}
