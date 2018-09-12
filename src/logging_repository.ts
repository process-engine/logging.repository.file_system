import {ILoggingRepository, LogEntry, LogLevel} from '@process-engine/logging_api_contracts';

import * as path from 'path';

import * as FileSystemAdapter from './adapter';

export class LoggingRepository implements ILoggingRepository {

  public config: any;

  public async readLogForCorrelation(correlationId: string): Promise<Array<LogEntry>> {

    const folderPath: string = this._buildPath(correlationId);

    const correlationLogs: Array<LogEntry> = FileSystemAdapter.readAndParseDirectory(folderPath);

    return correlationLogs;
  }

  public async readLogForProcessModel(correlationId: string, processModelId: string): Promise<Array<LogEntry>> {

    const logFilePath: string = this._buildPath(correlationId, processModelId);

    const logFileExists: boolean = FileSystemAdapter.targetExists(logFilePath);
    if (!logFileExists) {
      return [];
    }

    const correlationLogs: Array<LogEntry> = FileSystemAdapter.readAndParseFile(logFilePath);

    return correlationLogs;
  }

  public async writeLogForProcessModel(correlationId: string,
                                       processModelId: string,
                                       logLevel: LogLevel,
                                       message: string,
                                       timestamp: Date): Promise<void> {

    const logEntryAsString: string = [timestamp, correlationId, processModelId, logLevel, message].join('\t');
    await this._writeLogEntryToFileSystem(correlationId, processModelId, logEntryAsString);
  }

  public async writeLogForFlowNode(correlationId: string,
                                   processModelId: string,
                                   flowNodeInstanceId: string,
                                   flowNodeId: string,
                                   logLevel: LogLevel,
                                   message: string,
                                   timestamp: Date): Promise<void> {

    const logEntryAsString: string = [timestamp, correlationId, processModelId, flowNodeInstanceId, flowNodeId, logLevel, message].join('\t');
    await this._writeLogEntryToFileSystem(correlationId, processModelId, logEntryAsString);
  }

  private async _writeLogEntryToFileSystem(correlationId: string, processModelId: string, entry: string): Promise<void> {

    const targetFilePath: string = this._buildPath(correlationId, processModelId);

    await FileSystemAdapter.ensureDirectoryExists(targetFilePath);
    await FileSystemAdapter.writeToLogFile(targetFilePath, entry);
  }

  private _buildPath(...pathSegments: Array<string>): string {
    return path.resolve(process.cwd(), this.config.log_output_path, ...pathSegments);
  }

}
