import { initAscii } from '../lib/ascii';
import { initField } from '../lib/field';
import { initUi } from '../lib/ui';
import { initMotion } from '../lib/motion';
import { initClick } from '../lib/click';
import { initBackdrop } from '../lib/backdrop';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

initBackdrop(reduce);
initUi();
initClick();
initAscii(reduce);
initField(reduce);
initMotion(reduce);

console.log('%c\n   ∇ Gradient Works\n\n   Reading the source? Good instinct.\n   Say hi → dasarimanas049@gmail.com\n', 'font-family:monospace;color:#8a8880');
