import { ACTIVITY_RULES } from '../emails/rules/activity-rules';

export function getActivityRules(activity: string): string[] {
  return (
    ACTIVITY_RULES[activity] || [
      'Utilize a caçamba apenas para resíduos permitidos.',
      'Evite colocar lixo doméstico ou materiais perigosos.',
    ]
  );
}
