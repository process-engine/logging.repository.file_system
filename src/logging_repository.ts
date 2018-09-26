import {ILoggingRepository, LogEntry, LogLevel} from '@process-engine/logging_api_contracts';

import * as moment from 'moment';
import * as path from 'path';

import * as FileSystemAdapter from './adapter';

export class LoggingRepository implements ILoggingRepository {

  public config: any;

  public async readLogForProcessModel(processModelId: string): Promise<Array<LogEntry>> {

    const fileNameWithExtension: string = `${processModelId}.log`;

    const logFilePath: string = this._buildPath(fileNameWithExtension);

    const logFileExists: boolean = FileSystemAdapter.targetExists(logFilePath);
    if (!logFileExists) {
      return [];
    }

    const correlationLogs: Array<LogEntry> = FileSystemAdapter.readAndParseFile(logFilePath);

    return correlationLogs;
  }

  public async writeLogForProcessModel(correlationId: string,
                                       processModelId: string,
                                       processInstanceId: string,
                                       logLevel: LogLevel,
                                       message: string,
                                       timestamp: Date): Promise<void> {

    const timeStampAsIsoString: string = moment(timestamp).toISOString();

    const logEntryValues: Array<string> =
      ['ProcessModel', timeStampAsIsoString, correlationId, processModelId, processInstanceId, '', '', logLevel, message];
    await this._writeLogEntryToFileSystem(processModelId, ...logEntryValues);
  }

  public async writeLogForFlowNode(correlationId: string,
                                   processModelId: string,
                                   processInstanceId: string,
                                   flowNodeInstanceId: string,
                                   flowNodeId: string,
                                   logLevel: LogLevel,
                                   message: string,
                                   timestamp: Date): Promise<void> {

    const timeStampAsIsoString: string = moment(timestamp).toISOString();

    const logEntryValues: Array<string> =
      ['FlowNodeInstance', timeStampAsIsoString, correlationId, processModelId, processInstanceId, flowNodeInstanceId, flowNodeId, logLevel, message];
    await this._writeLogEntryToFileSystem(processModelId, ...logEntryValues);
  }

  private async _writeLogEntryToFileSystem(processModelId: string, ...values: Array<string>): Promise<void> {

    const fileNameWithExtension: string = `${processModelId}.log`;

    const targetFilePath: string = this._buildPath(fileNameWithExtension);

    const loggingEntryAsString: string = this._buildLoggingString(...values);

    await FileSystemAdapter.ensureDirectoryExists(targetFilePath);
    await FileSystemAdapter.writeToLogFile(targetFilePath, loggingEntryAsString);
  }

  private _buildPath(...pathSegments: Array<string>): string {
    return path.resolve(process.cwd(), this.config.output_path, ...pathSegments);
  }

  private _buildLoggingString(...args: Array<string>): string {
    return args.join(';');
  }

}
