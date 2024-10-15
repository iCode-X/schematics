import { classify } from '@angular-devkit/core/src/utils/strings';
import { Rule, SchematicContext, SchematicsException, Tree } from '@angular-devkit/schematics';

const dtoFilePath = '/src/modules/workflow/sub-modules/component/common/dto/component.copilot.dto.ts';

// 新增 DTO class 及更新 ExecResult 的规则
export function updateCopilotDTOWithComponentName(componentName: string): Rule {
  return (tree: Tree, context: SchematicContext) => {
    if (!tree.exists(dtoFilePath)) {
      context.logger.error(`DTO file not found: ${dtoFilePath}`);
      throw new SchematicsException('DTO file not found.');
    }

    const fileBuffer = tree.read(dtoFilePath);
    if (!fileBuffer) {
      context.logger.error('Unable to read DTO file.');
      throw new SchematicsException('Unable to read DTO file.');
    }

    const sourceText = fileBuffer.toString('utf-8');

    // Step 1: 确定要插入 DTO class 的位置
    const execResultIndex = sourceText.indexOf('// ⬆ 组件的出参');
    if (execResultIndex === -1) {
      context.logger.error('ExecResult union type not found in the file.');
      throw new SchematicsException('ExecResult union type not found.');
    }

    // Step 2: 插入新的 DTO class 到 `ExecResult` 之前
    const dtoClass = `@ObjectType('${classify(componentName)}ExecOutput', { implements: IMeanComponent.Content })
  export class ${classify(componentName)}OutputDTO implements IMeanComponent.Content {
    @Field(() => ComponentType)
    type!: ComponentType.${classify(componentName)};
  }

  `;
    const updatedSourceWithDTO = insertBeforePosition(sourceText, execResultIndex, dtoClass);

    // Step 3: 更新 ExecResult 的 types 数组
    const typesRegex = /types:\s*\(\)\s*=>\s*\[\s*([^]*?)\]/;
    const typesMatch = updatedSourceWithDTO.match(typesRegex);

    if (typesMatch) {
      let typesArray = typesMatch[1].trim();

      if (!typesArray.includes(`${classify(componentName)}OutputDTO`)) {
        typesArray = `${typesArray}\n        ${classify(componentName)}OutputDTO,`;
      }

      const updatedSourceWithTypes = updatedSourceWithDTO.replace(
        typesRegex,
        `types: () =>
      [
        ${typesArray}
      ]`,
      );

      // Step 4: 在 switch 语句后插入新的 case 语句
      const switchRegex = /switch\s*\(value\.type\)\s*{/;
      const switchMatch = updatedSourceWithTypes.match(switchRegex);

      if (switchMatch) {
        const switchIndex = updatedSourceWithTypes.indexOf(switchMatch[0]) + switchMatch[0].length;
        const newCase = `\n        case ComponentType.${classify(componentName)}:\n          return ${classify(componentName)}OutputDTO;`;

        const updatedSourceWithSwitch = insertAtPosition(updatedSourceWithTypes, switchIndex, newCase);

        // Step 5: 写回修改后的内容
        tree.overwrite(dtoFilePath, updatedSourceWithSwitch);
        context.logger.info(`Successfully added ${classify(componentName)}OutputDTO to component.copilot.dto.ts`);
      } else {
        context.logger.error('switch statement not found in ExecResult.');
        throw new SchematicsException('switch statement not found in ExecResult.');
      }
    } else {
      context.logger.error('types array not found in ExecResult.');
      throw new SchematicsException('types array not found in ExecResult.');
    }

    return tree;
  };
}

// Helper 函数：在指定位置插入内容
function insertBeforePosition(content: string, position: number, toInsert: string): string {
  return content.slice(0, position) + toInsert + content.slice(position);
}

// Helper 函数：在指定位置插入内容
function insertAtPosition(content: string, position: number, toInsert: string): string {
  return content.slice(0, position) + toInsert + content.slice(position);
}
