import { describe, it, expect } from 'vitest';
import { validateName, validateNameOrThrow } from '../src/utils/validation.js';

describe('validateName', () => {
  describe('路径遍历防护', () => {
    it('应拒绝包含 .. 的名称', () => {
      expect(validateName('../etc', 'Provider')).toEqual({
        valid: false,
        error: 'Provider name 包含非法字符',
      });
    });

    it('应拒绝包含 / 的名称', () => {
      expect(validateName('test/name', 'Provider')).toEqual({
        valid: false,
        error: 'Provider name 包含非法字符',
      });
    });

    it('应拒绝包含 \\ 的名称', () => {
      expect(validateName('test\\name', 'Provider')).toEqual({
        valid: false,
        error: 'Provider name 包含非法字符',
      });
    });
  });

  describe('空值验证', () => {
    it('应拒绝空字符串', () => {
      expect(validateName('', 'Provider')).toEqual({
        valid: false,
        error: 'Provider name 不能为空',
      });
    });

    it('应拒绝只有空格的字符串', () => {
      expect(validateName('   ', 'Provider')).toEqual({
        valid: false,
        error: 'Provider name 不能为空',
      });
    });

    it('应拒绝 null/undefined', () => {
      expect(validateName(null as unknown as string, 'Provider')).toEqual({
        valid: false,
        error: 'Provider name 不能为空',
      });
      expect(validateName(undefined as unknown as string, 'Provider')).toEqual({
        valid: false,
        error: 'Provider name 不能为空',
      });
    });

    it('应拒绝超过 64 个字符的名称', () => {
      expect(validateName('a'.repeat(65), 'Profile')).toEqual({
        valid: false,
        error: 'Profile name 长度不能超过 64 个字符',
      });
    });
  });

  describe('放宽的名称格式验证', () => {
    it('应接受简单的英文名称', () => {
      expect(validateName('my-provider', 'Provider')).toEqual({ valid: true });
    });

    it('应接受包含下划线的名称', () => {
      expect(validateName('my_provider', 'Provider')).toEqual({ valid: true });
    });

    it('应接受包含点号的名称', () => {
      expect(validateName('my.provider-1', 'Provider')).toEqual({ valid: true });
    });

    it('应接受包含中文的名称', () => {
      expect(validateName('我的配置', 'Provider')).toEqual({ valid: true });
    });

    it('应接受包含空格的名称', () => {
      expect(validateName('my provider', 'Provider')).toEqual({ valid: true });
    });

    it('应接受包含特殊符号的名称（不含路径遍历字符）', () => {
      expect(validateName('provider@prod', 'Provider')).toEqual({ valid: true });
      expect(validateName('provider#1', 'Provider')).toEqual({ valid: true });
      expect(validateName('provider$test', 'Provider')).toEqual({ valid: true });
    });
  });
});

describe('validateNameOrThrow', () => {
  it('有效名称不应抛出异常', () => {
    expect(() => validateNameOrThrow('valid-name', 'Provider')).not.toThrow();
  });

  it('无效名称应抛出异常', () => {
    expect(() => validateNameOrThrow('../etc', 'Provider')).toThrow('Provider name 包含非法字符');
  });
});
