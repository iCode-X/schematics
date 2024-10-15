import { classify } from '@angular-devkit/core/src/utils/strings';
import { Rule, SchematicContext, SchematicsException, Tree } from '@angular-devkit/schematics';

const dtoFilePath = '/src/modules/workflow/sub-modules/component/common/dto/component.builder.dto.ts';

// 新增 DTO class 及更新 MetadataOutput 的规则
export function updateBuilderDTOWithComponentName(componentName: string): Rule {
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
    const execResultIndex = sourceText.indexOf(
      "@InputType('MetadataInput', { description: '每个字段都代表一个不同类型的元数据' })",
    );
    if (execResultIndex === -1) {
      context.logger.error('ExecResult union type not found in the file.');
      throw new SchematicsException('ExecResult union type not found.');
    }

    // Step 2: 插入新的 DTO class 到 `ExecResult` 之前
    const dtoClass = `@InputType('${classify(componentName)}MetadataInput')
  @ObjectType('${classify(componentName)}MetadataOutput', { implements: IMeanComponent.Content })
  export class ${classify(componentName)}BuilderDTO  implements IMeanComponent.Content {
    @Field(() => ComponentType)
    type!: ComponentType.${classify(componentName)};
  }

  `;
    const updatedSourceWithDTO = insertBeforePosition(sourceText, execResultIndex, dtoClass);

    // Step 3: 更新 MetadataInputDTO
    const metadataInputIndex = updatedSourceWithDTO.indexOf('// ⬆ 这里的类型是联合类型，代表了所有的元数据类型');
    if (metadataInputIndex === -1) {
      context.logger.error('ExecResult union type not found in the file.');
      throw new SchematicsException('ExecResult union type not found.');
    }

    const metadataInput = `@Field(() => ${classify(componentName)}BuilderDTO, { nullable: true })
    componentNameMetadata?: ${classify(componentName)}BuilderDTO;
    `;
    const updatedSourceWithMetadataInput = insertBeforePosition(
      updatedSourceWithDTO,
      metadataInputIndex,
      metadataInput,
    );

    // Step 4: 更新 MetadataOutput 的 types 数组
    const typesRegex = /types:\s*\(\)\s*=>\s*\[\s*([^]*?)\]/;
    const typesMatch = updatedSourceWithMetadataInput.match(typesRegex);

    if (typesMatch) {
      let typesArray = typesMatch[1].trim();

      if (!typesArray.includes(`${classify(componentName)}BuilderDTO `)) {
        typesArray = `${typesArray}\n        ${classify(componentName)}BuilderDTO ,`;
      }

      const updatedSourceWithTypes = updatedSourceWithMetadataInput.replace(
        typesRegex,
        `types: () =>
      [
        ${typesArray}
      ]`,
      );

      // Step 5: 在 switch 语句后插入新的 case 语句
      const switchRegex = /switch\s*\(value\.type\)\s*{/;
      const switchMatch = updatedSourceWithTypes.match(switchRegex);

      if (switchMatch) {
        const switchIndex = updatedSourceWithTypes.indexOf(switchMatch[0]) + switchMatch[0].length;
        const newCase = `\n        case ComponentType.${classify(componentName)}:\n          return ${classify(componentName)}BuilderDTO ;`;

        const updatedSourceWithSwitch = insertAtPosition(updatedSourceWithTypes, switchIndex, newCase);

        // Step 5: 写回修改后的内容
        tree.overwrite(dtoFilePath, updatedSourceWithSwitch);
        context.logger.info(`Successfully added ${classify(componentName)}BuilderDTO  to component.builder.dto.ts`);
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
