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
                                       logLevel: LogLevel,
                                       message: string,
                                       timestamp: Date): Promise<void> {

    const timeStampAsIsoString: string = moment(timestamp).toISOString();

    const logEntryAsString: string =
      ['ProcessModel', timeStampAsIsoString, correlationId, processModelId, '', '', logLevel, message].join(';');
    await this._writeLogEntryToFileSystem(correlationId, processModelId, logEntryAsString);
  }

  public async writeLogForFlowNode(correlationId: string,
                                   processModelId: string,
                                   flowNodeInstanceId: string,
                                   flowNodeId: string,
                                   logLevel: LogLevel,
                                   message: string,
                                   timestamp: Date): Promise<void> {

    const timeStampAsIsoString: string = moment(timestamp).toISOString();

    const logEntryAsString: string =
      ['FlowNodeInstance', timeStampAsIsoString, correlationId, processModelId, flowNodeInstanceId, flowNodeId, logLevel, message].join(';');
    await this._writeLogEntryToFileSystem(correlationId, processModelId, logEntryAsString);
  }

  private async _writeLogEntryToFileSystem(correlationId: string, processModelId: string, entry: string): Promise<void> {

    const fileNameWithExtension: string = `${processModelId}.log`;

    const targetFilePath: string = this._buildPath(fileNameWithExtension);

    await FileSystemAdapter.ensureDirectoryExists(targetFilePath);
    await FileSystemAdapter.writeToLogFile(targetFilePath, entry);
  }

  private _buildPath(...pathSegments: Array<string>): string {
    return path.resolve(process.cwd(), this.config.output_path, ...pathSegments);
  }

}
