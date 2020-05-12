import PNotify from "pnotify/dist/es/PNotify";
import "pnotify/dist/PNotifyBrightTheme.css";

const notify = (text, type) => {
    const notification = PNotify.alert({
        type: type,
        text: text,
        styling: "brighttheme",
        buttons: {
            closer: false,
            sticker: false
        },
        modules: {
            Desktop: {
                desktop: true
            }
        }
    });
    notification.refs.elem.addEventListener("click", () => {
        notification.close();
    });
};

/** Success message handler */
export const Success = ({ msg }) => {
    notify(msg, 'success')
};

/** Error message handler */
export const Error = ({ msg }) => {
    notify(msg, 'error')
};

/** 400 Bad Request handler */
export const BadRequest = ({ errs }) => {

    for (let [key, value] of Object.entries(errs)) {
        const errorMsg = typeof value === "string" ? `${key} - ${value}` : Array.isArray(value) ? `${key} - ${value.join(', ')}` : `Bad Request - ${key}`;
        notify(errorMsg, 'error')
    }
};
