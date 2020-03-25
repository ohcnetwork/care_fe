import PNotify from 'pnotify/dist/es/PNotify'
import 'pnotify/dist/es/PNotifyStyleMaterial';

// Set default styling.
PNotify.defaults.styling = 'material';
// This icon setting requires the Material Icons font. (See below.)
PNotify.defaults.icons = 'material';

/** Success message handler */
export const Success = ({msg}) => {
    PNotify.success({
        text: msg
    });
}