import PNotify from "pnotify/dist/es/PNotify";
import "pnotify/dist/es/PNotifyStyleMaterial";
import "pnotify/dist/es/PNotifyButtons";

// Set default styling.
PNotify.defaults.styling = "material";
// This icon setting requires the Material Icons font. (See below.)
PNotify.defaults.icons = "material";

/** Success message handler */
export const Success = ({msg}) => {
    PNotify.success({
        text: msg,
        modules: {
            Desktop: {
                desktop: true
            }
        }
    });
};

/** Error message handler */
export const Error = ({msg}) => {
    PNotify.error({
        text: msg,
        modules: {
            Desktop: {
                desktop: true
            }
        }
    });
};

/** 400 Bad Request handler */
export const BadRequest = ({errs}) => {
    
    for (let [key, value] of Object.entries(errs)) {
        const errorMsg = typeof value === "string" ? `${key} - ${value}` : `Bad Request - ${key}`;
        PNotify.error({
            text: errorMsg,
            modules: {
                Desktop: {
                    desktop: true
                }
            }
        });
    }
};