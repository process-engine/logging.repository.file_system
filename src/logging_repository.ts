import {ILoggingRepository, LogEntry, LogLevel} from '@process-engine/logging_api_contracts';

import * as moment from 'moment';
import * as path from 'path';

import * as FileSystemAdapter from './adapter';

export class LoggingRepository implements ILoggingRepository {

  public config: any;

  public async readLogForProcessModel(processModelId: string): Promise<Array<LogEntry>> {

    const fileNameWithExtension = `${processModelId}.log`;

    const logFilePath = this.buildPath(fileNameWithExtension);

    const logFileExists = FileSystemAdapter.targetExists(logFilePath);
    if (!logFileExists) {
      return [];
    }

    const correlationLogs = FileSystemAdapter.readAndParseFile(logFilePath);

    return correlationLogs;
  }

  public async writeLogForProcessModel(
    correlationId: string,
    processModelId: string,
    processInstanceId: string,
    logLevel: LogLevel,
    message: string,
    timestamp: Date,
  ): Promise<void> {

    const timeStampAsIsoString = moment(timestamp).toISOString();

    const logEntryValues = [
      'ProcessModel',
      timeStampAsIsoString,
      correlationId,
      processModelId,
      processInstanceId,
      '',
      '',
      logLevel,
      message,
    ];

    await this.writeLogEntryToFileSystem(processModelId, ...logEntryValues);
  }

  public async writeLogForFlowNode(
    correlationId: string,
    processModelId: string,
    processInstanceId: string,
    flowNodeInstanceId: string,
    flowNodeId: string,
    logLevel: LogLevel,
    message: string,
    timestamp: Date,
  ): Promise<void> {

    const timeStampAsIsoString = moment(timestamp).toISOString();

    const logEntryValues = [
      'FlowNodeInstance',
      timeStampAsIsoString,
      correlationId,
      processModelId,
      processInstanceId,
      flowNodeInstanceId,
      flowNodeId,
      logLevel,
      message,
    ];

    await this.writeLogEntryToFileSystem(processModelId, ...logEntryValues);
  }

  private async writeLogEntryToFileSystem(processModelId: string, ...values: Array<string>): Promise<void> {

    const fileNameWithExtension = `${processModelId}.log`;

    const targetFilePath = this.buildPath(fileNameWithExtension);

    const loggingEntryAsString = this.buildLoggingString(...values);

    await FileSystemAdapter.ensureDirectoryExists(targetFilePath);
    await FileSystemAdapter.writeToLogFile(targetFilePath, loggingEntryAsString);
  }

  private buildPath(...pathSegments: Array<string>): string {
    return path.resolve(process.cwd(), this.config.output_path, ...pathSegments);
  }

  private buildLoggingString(...args: Array<string>): string {
    return args.join(';');
  }

}
