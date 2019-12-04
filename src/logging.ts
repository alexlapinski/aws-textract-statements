import * as R from 'ramda';
import chalk from 'chalk';

export enum LogLevelLabel {
    Info = 'Info',
    Error = 'Error',
    Success = 'Success',
};

export const errorMessageOrUndefined = R.pipe(
    R.prop('message'),
    R.defaultTo('Undefined'),
);

export const formatErrorMessage = (message: string, error: Error): string =>
    `[${LogLevelLabel.Error}] ${message} '${chalk.underline(errorMessageOrUndefined(error))}'`;

export const log = (message: string): void => 
    console.log(`[${LogLevelLabel.Info}] ${message}`);

export const error = (message: string, error?: Error): void =>
    error
        ? console.error(chalk.red(formatErrorMessage(message, error)))
        : console.error(chalk.red(message));

export const success = (message: string): void =>
    console.log(chalk.green(`[${LogLevelLabel.Success}] ${message}`));

export default {
    log,
    error,
    success,
};