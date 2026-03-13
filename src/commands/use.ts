import { listProfiles } from '../core/profile.js';
import { switchProfile } from '../core/switch.js';
import inquirer from 'inquirer';

export async function useCommand(name?: string): Promise<void> {
  try {
    // 如果没有指定名称，交互式选择
    if (!name) {
      const profiles = await listProfiles();
      if (profiles.length === 0) {
        console.log('❌ 还没有配置任何 Profile');
        console.log('使用 `cce create <name>` 创建一个新的 Profile');
        process.exit(1);
      }

      const { selected } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selected',
          message: '选择要激活的 Profile:',
          choices: profiles.map(p => ({
            name: `${p.name}${p.description ? ` - ${p.description}` : ''}`,
            value: p.name,
          })),
        },
      ]);

      name = selected;
    }

    if (!name) {
      console.log('❌ 未选择 Profile');
      process.exit(1);
    }

    // 切换 profile
    const result = await switchProfile(name);

    if (!result.success) {
      console.log();
      console.log('❌ 激活 Profile 失败');
      for (const error of result.errors) {
        console.log(`  - ${error}`);
      }
      process.exit(1);
    }

    process.exit(0);
  } catch (err) {
    console.log('❌ 激活 Profile 失败:', err);
    process.exit(1);
  }
}
