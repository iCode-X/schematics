// TODO 考虑将此工具升级为一个独立的工具库

import { SchematicContext, Tree } from '@angular-devkit/schematics';
import fs from 'fs';
import path from 'path';

export class CodePrettier {
  private tree: Tree;
  private context: SchematicContext;

  constructor(tree: Tree, context: SchematicContext) {
    this.tree = tree;
    this.context = context;
  }

  // 处理 models 文件夹中的内容
  processModels(outputDir: string): this {
    const modelsDir = path.join(outputDir, 'models');
    const files = fs.readdirSync(modelsDir);

    files.forEach((fileName: string) => {
      const filePath = path.join(modelsDir, fileName);
      const fileContent = fs.readFileSync(filePath, 'utf-8');

      const updatedContent = this.processValueLogic(fileContent);
      const relativeFilePath = path.join(modelsDir, fileName);

      if (this.tree.exists(relativeFilePath)) {
        this.tree.overwrite(relativeFilePath, updatedContent);
      } else {
        this.tree.create(relativeFilePath, updatedContent);
      }
    });

    return this; // 允许链式调用
  }

  // 处理 apis 文件夹中的内容
  processApis(outputDir: string): this {
    const apisDir = path.join(outputDir, 'apis');
    const apiFiles = fs.readdirSync(apisDir);

    apiFiles.forEach((fileName: string) => {
      const filePath = path.join(apisDir, fileName);
      const fileContent = fs.readFileSync(filePath, 'utf-8');

      const updatedContent = this.processFunctionName(fileContent);
      const relativeFilePath = path.join(apisDir, fileName);

      if (this.tree.exists(relativeFilePath)) {
        this.tree.overwrite(relativeFilePath, updatedContent);
      } else {
        this.tree.create(relativeFilePath, updatedContent);
      }
    });

    return this; // 允许链式调用
  }

  // 处理 value 和 _value 逻辑
  private processValueLogic(fileContent: string): string {
    const regex = /export function (\w+)\((\w+): object\): (\w+) is (\w+) {([\s\S]*?)}/g;

    return fileContent.replace(regex, (match, fnName, paramName, paramType, returnType, fnBody) => {
      const valueUsedInBody = fnBody.includes('value[') || fnBody.includes(' in value');
      if (!valueUsedInBody && paramName === 'value') {
        return match.replace('value', '_value').replace('value is', '_value is');
      }
      return match;
    });
  }

  // 处理函数名称的转换逻辑
  private processFunctionName(fileContent: string): string {
    const regex = /(?<!private\s+)async\s+(\w+Controller)(\w+)\s*\(([\s\S]*?)\)/g;

    return fileContent.replace(regex, (match, controllerPrefix, coreFunctionName, params) => {
      const updatedName = coreFunctionName.charAt(0).toLowerCase() + coreFunctionName.slice(1);
      return `async ${updatedName}(${params})`;
    });
  }
}
