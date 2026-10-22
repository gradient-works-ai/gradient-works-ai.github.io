import { initAscii } from '../lib/ascii';
import { initField } from '../lib/field';
import { initUi } from '../lib/ui';
import { initMotion } from '../lib/motion';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

initUi();
initAscii(reduce);
initField(reduce);
initMotion(reduce);

console.log('%c\n   ∇ Gradient Works\n\n   Reading the source? Good instinct.\n   Say hi → dasarimanas049@gmail.com\n', 'font-family:monospace;color:#8a8880');
