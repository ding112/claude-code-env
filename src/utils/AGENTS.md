# utils - 工具函数

**Parent**: cce/AGENTS.md
**Scope**: cce/src/utils/

## 概述

通用工具函数。

## 模块

| 文件 | 描述 |
|------|------|
| `file.ts` | 文件操作（安全读写 JSON/文本、目录创建、文件存在检查） |
| `logger.ts` | 日志输出（info、success、error、warn、dim） |
| `validation.ts` | 名称验证（防路径遍历攻击，只允许字母/数字/连字符/下划线） |

## 使用

```typescript
import { readJson, writeJson, fileExists, ensureDir } from './utils/file.js';
import { logger } from './utils/logger.js';
import { validateName } from './utils/validation.js';
```
