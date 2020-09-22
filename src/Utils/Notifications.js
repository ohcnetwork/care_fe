import { alert, Stack } from '@pnotify/core';
import '@pnotify/core/dist/PNotify.css';
import '@pnotify/core/dist/BrightTheme.css';

const notifyStack = new Stack({
    dir1: 'down',
    dir2: 'left',
    firstpos1: 25,
    firstpos2: 25,
    modal: false,
    maxOpen: 3,
    maxStrategy: 'close',
    maxClosureCausesWait: false,
    push: 'top'
});

const notify = (text, type) => {
    const notification = alert({
        type: type,
        text: text,
        styling: "brighttheme",
        mode: 'light',
        sticker: false,
        buttons: {
            closer: false,
            sticker: false
        },
        modules: {
            Desktop: {
                desktop: true
            }
        },
        stack: notifyStack
    });
    notification.refs.elem.addEventListener("click", () => {
        notification.close();
    });
};

const notifyError = (error) => {
    let errorMsg = '';
    if (typeof error === 'string' || !error) {
        errorMsg = !error || error.length > 100 ? 'Something went wrong...!' : error;
    } else if (error.detail) {
        errorMsg = error.detail;
    } else {
        for (let [key, value] of Object.entries(error)) {
            if (Array.isArray(value)) {
                const uniques = [...new Set(value)];
                errorMsg +=`${key} - ${uniques.splice(0, 5).join(', ')}`
            } else if(typeof value === "string") {
                errorMsg += `${key} - ${value}`;
            } else {
                errorMsg += `${key} - Bad Request`
            }
            errorMsg += '\n';
        }
    }
    notify(errorMsg, 'error');
}

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

    if (Array.isArray(errs)) {
        errs.splice(0, 5).forEach(error => notifyError(error));
    } else {
        notifyError(errs);
    }
};