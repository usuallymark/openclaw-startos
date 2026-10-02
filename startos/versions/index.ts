import { VersionGraph } from '@start9labs/start-sdk'
import { current } from './current'
import { v2026_9_4_1 } from './v2026_9_4_1'
import { v2026_9_4_2 } from './v2026_9_4_2'
import { v2026_9_4_3 } from './v2026_9_4_3'
import { v2026_9_4_4 } from './v2026_9_4_4'
import { v2026_9_4_5 } from './v2026_9_4_5'
import { v2026_9_4_6 } from './v2026_9_4_6'
import { v2026_9_4_7 } from './v2026_9_4_7'
import { v2026_9_4_8 } from './v2026_9_4_8'
import { v2026_9_4_9 } from './v2026_9_4_9'

export const versionGraph = VersionGraph.of({
  current,
  other: [
    v2026_9_4_9,
    v2026_9_4_8,
    v2026_9_4_7,
    v2026_9_4_6,
    v2026_9_4_5,
    v2026_9_4_4,
    v2026_9_4_3,
    v2026_9_4_2,
    v2026_9_4_1,
  ],
})
