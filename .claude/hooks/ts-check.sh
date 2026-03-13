#!/bin/bash
# PostToolUse hook: 编辑/写入 .ts 文件后自动运行 TypeScript 编译检查

# 从 stdin 读取 hook 输入
INPUT=$(cat)

# 提取文件路径
FILE_PATH=$(echo "$INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('tool_input',{}).get('file_path',''))" 2>/dev/null)

# 只检查 .ts 文件
if [[ "$FILE_PATH" != *.ts ]]; then
  exit 0
fi

# 运行 TypeScript 编译检查
cd "$CLAUDE_PROJECT_DIR" || exit 0
ERRORS=$(npx tsc --noEmit 2>&1)
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
  echo "$ERRORS" | head -30 >&2
  exit 2
fi

exit 0
