/**
 * 安全验证工具
 * 防止路径遍历攻击和其他安全问题
 */

/**
 * 验证名称格式，防止路径遍历攻击
 * @param name - 要验证的名称
 * @param type - 名称类型（用于错误消息）
 * @returns 验证结果
 */
export function validateName(name: string, type: string): { valid: boolean; error?: string } {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: `${type} name 不能为空` };
  }

  const trimmed = name.trim();
  if (trimmed === '') {
    return { valid: false, error: `${type} name 不能为空` };
  }

  // 检查路径遍历字符
  if (trimmed.includes('..') || trimmed.includes('/') || trimmed.includes('\\')) {
    return { valid: false, error: `${type} name 包含非法字符` };
  }

  return { valid: true };
}

/**
 * 验证名称并在无效时抛出错误
 * @param name - 要验证的名称
 * @param type - 名称类型
 * @throws Error 如果名称无效
 */
export function validateNameOrThrow(name: string, type: string): void {
  const result = validateName(name, type);
  if (!result.valid) {
    throw new Error(result.error);
  }
}