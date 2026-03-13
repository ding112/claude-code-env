import { startWebUI } from '../core/webuiServer.js';
import { logger } from '../utils/logger.js';

export interface UiCommandOptions {
  port?: number;
  noOpen?: boolean;
}

export async function uiCommand(options: UiCommandOptions = {}): Promise<void> {
  const port = options.port || 3456;

  logger.info(`启动 WebUI 服务，端口: ${port}`);

  await startWebUI({
    port,
    open: !options.noOpen,
  });
}