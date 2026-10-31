import type {Reporter, TestCase, TestResult} from '@playwright/test/reporter';
import {safe} from './process.ts';
export default class SafeReporter implements Reporter {
  onTestEnd(_test: TestCase, result: TestResult) {
    for (const error of result.errors) {
      if (error.message) error.message = safe(error.message);
      if (error.stack) error.stack = safe(error.stack);
      if (error.snippet) error.snippet = safe(error.snippet);
    }
  }
}
