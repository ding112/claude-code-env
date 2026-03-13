import chalk from 'chalk';

export const logger = {
  info: (msg: string, ...args: unknown[]) => console.log(chalk.blue('ℹ'), msg, ...args),
  success: (msg: string, ...args: unknown[]) => console.log(chalk.green('✔'), msg, ...args),
  error: (msg: string, ...args: unknown[]) => console.log(chalk.red('✖'), msg, ...args),
  warn: (msg: string, ...args: unknown[]) => console.log(chalk.yellow('⚠'), msg, ...args),
  dim: (msg: string, ...args: unknown[]) => console.log(chalk.gray(msg), ...args),
};
