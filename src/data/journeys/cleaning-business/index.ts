import type { Journey } from '../../../types/journey'
import { discoverStage } from './discover'
import { assessStage } from './assess'
import { researchStage } from './research'
import { planStage } from './plan'
import { prepareStage } from './prepare'
import { launchStage } from './launch'
import { operateStage } from './operate'
import { growStage } from './grow'
import { masteryStage } from './mastery'

export const startACleaningBusinessJourney: Journey = {
  id: 'journey-cleaning-business',
  slug: 'start-a-cleaning-business',
  goal: 'Start a Cleaning Business',
  title: 'Cleaning Business Launch Journey™',
  industry: 'Cleaning',
  status: 'complete',
  stages: [discoverStage, assessStage, researchStage, planStage, prepareStage, launchStage, operateStage, growStage, masteryStage],
}
