import { classify } from '@angular-devkit/core/src/utils/strings';
import { Rule, SchematicContext, SchematicsException, Tree } from '@angular-devkit/schematics';

// 新增的更新 enum 文件的规则
export function updateEnumWithComponentName(componentName: string): Rule {
  return (tree: Tree, context: SchematicContext) => {
    console.log('updateEnumWithComponentName', componentName);

    // 1. 枚举文件的路径，硬编码为项目中的相对路径
    const enumFilePath = '/src/modules/workflow/sub-modules/component/common/enums/component.enum.ts';

    // 2. 检查文件是否存在
    if (!tree.exists(enumFilePath)) {
      context.logger.error(`Enum file not found: ${enumFilePath}`);
      throw new SchematicsException('Enum file not found.');
    }

    // 3. 读取文件内容
    const fileBuffer = tree.read(enumFilePath);
    if (!fileBuffer) {
      context.logger.error('Unable to read enum file.');
      throw new SchematicsException('Unable to read enum file.');
    }

    // 4. 将文件内容转换为字符串
    const fileContent = fileBuffer.toString('utf-8');

    // 5. 使用正则表达式匹配 ComponentType 枚举的内容
    const enumRegex = /enum\s+ComponentType\s*{([^}]*)}/;
    const match = fileContent.match(enumRegex);

    // 6. 如果匹配到 ComponentType 枚举
    if (match) {
      let enumContent = match[1]; // 获取枚举体部分

      // 7. 检查枚举中是否已经存在该组件名称
      if (enumContent.includes(componentName)) {
        context.logger.info(`${componentName} already exists in ComponentType enum.`);
        return tree; // 如果已经存在，则直接返回
      }

      // 8. 确保最后一个枚举值后面有逗号
      const lastCommaMatch = enumContent.trim().endsWith(',') ? '' : ',';

      // 9. 将新的 componentName 添加到枚举中
      enumContent = `
  ${enumContent.trim()}${lastCommaMatch}\n  ${classify(componentName)} = '${classify(componentName)},'`;

      // 10. 使用正则表达式替换旧的 ComponentType 内容
      const updatedFileContent = fileContent.replace(enumRegex, `enum ComponentType {${enumContent}\n}`);

      // 11. 覆盖原文件
      tree.overwrite(enumFilePath, updatedFileContent);
      context.logger.info(`Successfully added ${componentName} to ComponentType enum.`);
    } else {
      context.logger.error('ComponentType enum not found in the file.');
      throw new SchematicsException('ComponentType enum not found.');
    }

    return tree; // 返回修改后的虚拟文件树
  };
}
