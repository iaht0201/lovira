import { BENCHMARK_DATASET } from './benchmarkDataset';
import { IntentResolver } from './IntentResolver';
import { ContextBuilder } from './ContextBuilder';
import { SessionManager } from './SessionManager';

export async function runAgentBenchmark(): Promise<{
  total: number;
  passed: number;
  failed: number;
  accuracy: string;
  results: Array<{ id: string; utterance: string; passed: boolean; resolvedActions: string[]; expectedActions: string[] }>;
}> {
  let passed = 0;
  const results = [];

  for (const testCase of BENCHMARK_DATASET) {
    // Setup test context
    if (testCase.context.hasActiveSession) {
      SessionManager.createSession((testCase.context.sessionType as any) || 'healthcare');
    } else {
      SessionManager.clearActiveSession();
    }

    const context = ContextBuilder.buildContext({
      currentScreen: testCase.context.currentScreen,
      selectedText: testCase.context.hasSelection ? 'Đoạn văn bản mẫu' : undefined,
      currentResult: testCase.context.hasResult ? { type: 'test', content: 'Nội dung kết quả phân tích mẫu' } : undefined,
    });

    const resolved = await IntentResolver.resolveIntent(testCase.utterance, context);
    const resolvedActions = resolved.plan.map((p) => p.action);

    // Check if expected actions are present
    const isMatch =
      testCase.expectedActions.length === 0
        ? resolved.needsClarification
        : testCase.expectedActions.every((ea) =>
            resolvedActions.some((ra) => ra.toLowerCase() === ea.toLowerCase())
          );

    if (isMatch) {
      passed++;
    }

    results.push({
      id: testCase.id,
      utterance: testCase.utterance,
      passed: isMatch,
      resolvedActions,
      expectedActions: testCase.expectedActions,
    });
  }

  const accuracy = ((passed / BENCHMARK_DATASET.length) * 100).toFixed(1) + '%';
  console.log(`[Lovira Agent Benchmark] ${passed}/${BENCHMARK_DATASET.length} passed (${accuracy})`);

  return {
    total: BENCHMARK_DATASET.length,
    passed,
    failed: BENCHMARK_DATASET.length - passed,
    accuracy,
    results,
  };
}
