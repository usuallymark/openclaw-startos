import { VersionGraph } from '@start9labs/start-sdk'
import { current } from './current'
import { v2026_9_4_1 } from './v2026_9_4_1'
import { v2026_9_4_2 } from './v2026_9_4_2'
import { v2026_9_4_3 } from './v2026_9_4_3'
import { v2026_9_4_4 } from './v2026_9_4_4'

export const versionGraph = VersionGraph.of({
  current,
  other: [v2026_9_4_4, v2026_9_4_3, v2026_9_4_2, v2026_9_4_1],
})
