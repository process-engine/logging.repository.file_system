import {LogEntry, LogLevel} from '@process-engine/logging_api_contracts';

import * as fs from 'fs';
import * as mkdirp from 'mkdirp';
import * as moment from 'moment';
import * as path from 'path';

export function targetExists(targetPath: string): boolean {
  return fs.existsSync(targetPath);
}

/**
 * Checks if the given path exists and creates it, if it doesn't.
 *
 * @async
 * @param targetFilePath The directory to verify.
 */
export async function ensureDirectoryExists(targetFilePath: string): Promise<void> {

  return new Promise<void>((resolve: Function, reject: Function): void => {

    const parsedPath: path.ParsedPath = path.parse(targetFilePath);

    const targetDirectoryExists: boolean = fs.existsSync(parsedPath.dir);

    if (targetDirectoryExists) {
      return resolve();
    }

    mkdirp(parsedPath.dir, (error: Error, data: string) => {

      if (error) {
        return reject(error);
      }

      return resolve();
    });
  });
}

/**
 * Writes the given entry to the specificed log file.
 *
 * @async
 * @param targetFilePath The path to the file to write to.
 * @param entry          The entry to write into the file.
 */
export async function writeToLogFile(targetFilePath: string, entry: string): Promise<void> {

  return new Promise<void>((resolve: Function, reject: Function): void => {
    const fileStream: fs.WriteStream = fs.createWriteStream(targetFilePath, {flags: 'a'});

     // Note: using "end" instead of "write" will result in the stream being closed immediately afterwards, thus releasing the file.
    fileStream.end(`${entry}\n`, (error: Error) => {
      if (error) {
        return reject(error);
      }

      return resolve();
    });
  });
}

/**
 * Reads all files from the given directory and parses their content into
 * readable LogEntries.
 *
 * @param dirPath The path to the directory to read.
 * @returns       The parsed logs.
 */
export function readAndParseDirectory(dirPath: string): Array<LogEntry> {

  const logfileNames: Array<string> = fs.readdirSync(dirPath);

  const correlationLogs: Array<LogEntry> = [];

  for (const fileName of logfileNames) {
    const fullFilePath: string = path.join(dirPath, fileName);
    const logFileEntries: Array<LogEntry> = readAndParseFile(fullFilePath);
    Array.prototype.push.apply(correlationLogs, logFileEntries);
  }

  return correlationLogs;
}

/**
 * Reads a file from the given path and parses its content into a readable
 * LogEntry.
 *
 * @param   filePath The path to the file to read.
 * @returns          The parsed log.
 */
export function readAndParseFile(filePath: string): Array<LogEntry> {

  const logFileContent: string = fs.readFileSync(filePath, 'utf-8');

  const logEntriesRaw: Array<string> = logFileContent.split('\n');

  // Filter out empty lines and the final new line.
  const logEntriesFiltered: Array<string> = logEntriesRaw.filter((entry: string) => {
    return entry.length > 0;
  });

  const logEntries: Array<LogEntry> = logEntriesFiltered.map(_createLogEntryFromRawData);

  return logEntries;
}

/**
 * Takes a string representing a log entry and parses its content into a usable
 * LogEntry object.
 *
 * @param   logEntryRaw The string containing the unparsed log entry.
 * @returns             The parsed LogEntry.
 */
// tslint:disable:no-magic-numbers
function _createLogEntryFromRawData(logEntryRaw: string): LogEntry {

  const logEntryRawParts: Array<string> = logEntryRaw.split(';');

  const isFlowNodeInstanceLog: boolean = logEntryRawParts[0] === 'FlowNodeInstance';

  const logEntry: LogEntry = isFlowNodeInstanceLog
    ? _parseFlowNodeInstanceLog(logEntryRawParts)
    : _parseProcessModelLog(logEntryRawParts);

  return logEntry;
}

/**
 * Creates a LogEntry for a FlowNodeInstance from the given data.
 *
 * @param   rawData The data to parse into a LogEntry.
 * @returns         The parsed LogEntry.
 */
function _parseFlowNodeInstanceLog(rawData: Array<string>): LogEntry {

  const logEntry: LogEntry = new LogEntry();
  logEntry.timeStamp = moment(rawData[1]).toDate();
  logEntry.correlationId = rawData[2];
  logEntry.processModelId = rawData[3];
  logEntry.processInstanceId = rawData[4];
  logEntry.flowNodeInstanceId = rawData[5];
  logEntry.flowNodeId = rawData[6];
  logEntry.logLevel = LogLevel[rawData[7]];
  logEntry.message = rawData[8];

  return logEntry;
}

/**
 * Creates a LogEntry for a ProcessModel from the given data.
 *
 * @param   rawData The data to parse into a LogEntry.
 * @returns         The parsed LogEntry.
 */
function _parseProcessModelLog(rawData: Array<string>): LogEntry {

  const logEntry: LogEntry = new LogEntry();
  logEntry.timeStamp = moment(rawData[1]).toDate();
  logEntry.correlationId = rawData[2];
  logEntry.processModelId = rawData[3];
  logEntry.processInstanceId = rawData[4];
  logEntry.logLevel = LogLevel[rawData[7]];
  logEntry.message = rawData[8];

  return logEntry;
}
