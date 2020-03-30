import PNotify from "pnotify/dist/es/PNotify";
import "pnotify/dist/es/PNotifyStyleMaterial";

// Set default styling.
PNotify.defaults.styling = "material";
// This icon setting requires the Material Icons font. (See below.)
PNotify.defaults.icons = "material";

/** Success message handler */
export const Success = ({msg}) => {
    PNotify.success({
        text: msg
    });
};

/** Error message handler */
export const Error = ({msg}) => {
    PNotify.error({
        text: msg
    });
};

/** Bad Request handler */
export const BadRequest = ({errs}) => {
    for (let [, value] of Object.entries(errs)) {
        PNotify.error({
            text: `Bad Request - ${value}`
        });
    }
};

/** All Other 4xx Error handler */
export const Errors4XX = ({errs}) => {
    for ( const msg of errs) {
        PNotify.error({
            text: msg.message
        });
    }
};