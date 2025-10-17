
'use client';

export type AdminAssistedSignalManagementInput = {
  taskType: 'suggestNewSignals' | 'summarizeImpact';
  marketTrends?: string;
  existingSignals?: string;
  userGroups?: string;
};

export type AdminAssistedSignalManagementOutput = {
  suggestions: string;
};

export async function adminAssistedSignalManagement(
  input: AdminAssistedSignalManagementInput
): Promise<AdminAssistedSignalManagementOutput> {
  const { taskType, marketTrends, existingSignals, userGroups } = input;
  if (taskType === 'suggestNewSignals') {
    const context = marketTrends ? `Trends: ${marketTrends}` : 'No trends provided';
    return {
      suggestions:
        `Based on ${context}, consider:
 - Identify key support/resistance levels and propose entries near confluence zones.
 - Favor risk:reward ≥ 1:1.5; include SL/TP for each signal.
 - Provide at most 3 concise suggestions for both FREE and PRO tiers.`,
    };
  }
  // summarizeImpact
  const groups = userGroups || 'free vs pro';
  const signals = existingSignals || 'current active signals';
  return {
    suggestions:
      `Summary request received for ${signals} across ${groups}.
 - Highlight which signals best serve FREE users (lower risk, tighter SL).
 - For PRO, include advanced setups with clearer invalidation and TP tiers.
 - Recommend pruning low-performing signals and rotating new ones weekly.`,
  };
}
