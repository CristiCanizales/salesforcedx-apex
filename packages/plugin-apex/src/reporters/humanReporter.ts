/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
  ApexTestResultData,
  CodeCoverageResult,
  TestResult,
  Table,
  Row
} from '@salesforce/apex-node';
import { Messages } from '@salesforce/core';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-apex', 'run');

export class HumanReporter {
  public format(testResult: TestResult, detailedCoverage: boolean): string {
    let tbResult = this.formatSummary(testResult);
    if (!testResult.codecoverage || !detailedCoverage) {
      tbResult += this.formatTestResults(testResult.tests);
    }

    if (testResult.codecoverage) {
      if (detailedCoverage) {
        tbResult += this.formatDetailedCov(testResult);
      }
      tbResult += this.formatCodeCov(testResult.codecoverage);
    }
    return tbResult;
  }

  private formatSummary(testResult: TestResult): string {
    const tb = new Table();

    // Summary Table
    const summaryRowArray: Row[] = [
      {
        name: messages.getMessage('outcome'),
        value: testResult.summary.outcome
      },
      {
        name: messages.getMessage('testsRan'),
        value: String(testResult.summary.testsRan)
      },
      {
        name: messages.getMessage('passRate'),
        value: testResult.summary.passRate
      },
      {
        name: messages.getMessage('failRate'),
        value: testResult.summary.failRate
      },
      {
        name: messages.getMessage('skipRate'),
        value: testResult.summary.skipRate
      },
      {
        name: messages.getMessage('testRunId'),
        value: testResult.summary.testRunId
      },
      {
        name: messages.getMessage('testExecutionTime'),
        value: `${testResult.summary.testExecutionTimeInMs} ms`
      },
      {
        name: messages.getMessage('orgId'),
        value: testResult.summary.orgId
      },
      {
        name: messages.getMessage('username'),
        value: testResult.summary.username
      },
      ...(testResult.summary.orgWideCoverage
        ? [
            {
              name: messages.getMessage('orgWideCoverage'),
              value: String(testResult.summary.orgWideCoverage)
            }
          ]
        : [])
    ];

    const summaryTable = tb.createTable(
      summaryRowArray,
      [
        {
          key: 'name',
          label: messages.getMessage('name_col_header')
        },
        { key: 'value', label: messages.getMessage('value_col_header') }
      ],
      messages.getMessage('test_summary_header')
    );
    return summaryTable;
  }

  private formatTestResults(tests: ApexTestResultData[]): string {
    const tb = new Table();
    const testRowArray: Row[] = [];
    tests.forEach(
      (elem: {
        fullName: string;
        outcome: string;
        message: string | null;
        runTime: number;
      }) => {
        testRowArray.push({
          name: elem.fullName,
          outcome: elem.outcome,
          msg: elem.message ? elem.message : '',
          runtime: `${elem.runTime}`
        });
      }
    );

    let testResultTable = '\n\n';
    testResultTable += tb.createTable(
      testRowArray,
      [
        {
          key: 'name',
          label: messages.getMessage('test_name_col_header')
        },
        { key: 'outcome', label: messages.getMessage('outcome_col_header') },
        { key: 'msg', label: messages.getMessage('msg_col_header') },
        { key: 'runtime', label: messages.getMessage('runtime_col_header') }
      ],
      messages.getMessage('test_results_header')
    );
    return testResultTable;
  }

  private formatDetailedCov(testResult: TestResult): string {
    const tb = new Table();
    const testRowArray: Row[] = [];
    testResult.tests.forEach(
      (elem: {
        fullName: string;
        outcome: string;
        perTestCoverage?: {
          apexClassOrTriggerName: string;
          percentage: string;
        };
        message: string | null;
        runTime: number;
      }) => {
        testRowArray.push({
          name: elem.fullName,
          coveredClassName: elem.perTestCoverage
            ? elem.perTestCoverage.apexClassOrTriggerName
            : '',
          outcome: elem.outcome,
          coveredClassPercentage: elem.perTestCoverage
            ? elem.perTestCoverage.percentage
            : '',
          msg: elem.message ? elem.message : '',
          runtime: `${elem.runTime}`
        });
      }
    );

    let detailedCovTable = '\n\n';
    detailedCovTable += tb.createTable(
      testRowArray,
      [
        {
          key: 'name',
          label: messages.getMessage('test_name_col_header')
        },
        {
          key: 'coveredClassName',
          label: messages.getMessage('class_tested_header')
        },
        {
          key: 'outcome',
          label: messages.getMessage('outcome_col_header')
        },
        {
          key: 'coveredClassPercentage',
          label: messages.getMessage('percent_col_header')
        },
        { key: 'msg', label: messages.getMessage('msg_col_header') },
        { key: 'runtime', label: messages.getMessage('runtime_col_header') }
      ],
      messages.getMessage('detailed_code_cov_header', [
        testResult.summary.testRunId
      ])
    );
    return detailedCovTable;
  }

  private formatCodeCov(codeCoverages: CodeCoverageResult[]): string {
    const tb = new Table();
    const codeCovRowArray: Row[] = [];
    codeCoverages.forEach(
      (elem: {
        name: string;
        percentage: string;
        uncoveredLines: number[];
      }) => {
        codeCovRowArray.push({
          name: elem.name,
          percent: elem.percentage,
          uncoveredLines: this.formatUncoveredLines(elem.uncoveredLines)
        });
      }
    );

    let codeCovTable = '\n\n';
    codeCovTable += tb.createTable(
      codeCovRowArray,
      [
        {
          key: 'name',
          label: messages.getMessage('classes_col_header')
        },
        {
          key: 'percent',
          label: messages.getMessage('percent_col_header')
        },
        {
          key: 'uncoveredLines',
          label: messages.getMessage('uncovered_lines_col_header')
        }
      ],
      messages.getMessage('code_cov_header')
    );
    return codeCovTable;
  }

  private formatUncoveredLines(uncoveredLines: number[]): string {
    const arrayLimit = 5;
    if (uncoveredLines.length === 0) {
      return '';
    }

    const limit =
      uncoveredLines.length > arrayLimit ? arrayLimit : uncoveredLines.length;
    let processedLines = uncoveredLines.slice(0, limit).join(',');
    if (uncoveredLines.length > arrayLimit) {
      processedLines += '...';
    }
    return processedLines;
  }
}