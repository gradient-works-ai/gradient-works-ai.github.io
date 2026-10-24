import { initAscii } from '../lib/ascii';
import { initField } from '../lib/field';
import { initUi } from '../lib/ui';
import { initMotion } from '../lib/motion';
import { initClick } from '../lib/click';
import { initBackdrop } from '../lib/backdrop';
import { initForm } from '../lib/form';
import { initPortrait } from '../lib/portrait';
import { initLiquid } from '../lib/liquid';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

initBackdrop(reduce);
initLiquid();
initUi();
initForm();
initClick();
initAscii(reduce);
initField(reduce);
initPortrait(reduce);
initMotion(reduce);

console.log('%c\n   ∇ Gradient Works\n\n   Reading the source? Good instinct.\n   Say hi → dasarimanas049@gmail.com\n', 'font-family:monospace;color:#8a8880');
