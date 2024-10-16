import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { compileFromFile } from 'json-schema-to-typescript';
import path from 'path';
import { Schema2tsOptions } from './schema2ts.schema';

export function main(options: Schema2tsOptions): Rule {
  return async (tree: Tree, context: SchematicContext) => {
    try {
      // 获取指定的源路径
      const startDir = options.sourceRoot || 'src'; // 相对路径

      // 查找当前目录及其子目录中的 schema.json 文件
      const schemaFiles = findSchemaFiles(tree, startDir);

      if (schemaFiles.length === 0) {
        context.logger.error('No schema.json files found.');
        return;
      }

      // 为每个找到的 schema.json 文件生成对应的 schema.d.ts 文件
      for (const schemaFile of schemaFiles) {
        // 获取 schema.json 所在的文件夹路径
        const dir = path.dirname(schemaFile);
        const dtsFilePath = path.join(dir, `${path.basename(dir)}.schema.d.ts`);

        try {
          await generateDtsWithCustomName(tree, schemaFile, dtsFilePath, context);
        } catch (error) {
          context.logger.error(`Error generating ${dtsFilePath}: ${(error as Error).message}`);
        }
      }

      return;
    } catch (e) {
      console.error(e);
    }
  };
}

// 使用 Tree 查找 schema.json 文件
function findSchemaFiles(tree: Tree, dir: string): string[] {
  let results: string[] = [];

  // 获取当前项目根目录
  const root = tree.root.path;

  // 递归遍历目录
  tree.getDir(dir).visit((filePath) => {
    // 确保路径是相对路径，并且没有多余的相对路径符号
    const relativePath = path.relative(root, filePath);

    if (relativePath.endsWith('schema.json')) {
      results.push(relativePath); // 存储相对路径
    }
  });

  return results;
}

// 使用 Tree 生成文件
async function generateDtsWithCustomName(
  tree: Tree,
  schemaFilePath: string,
  outputFilePath: string,
  context: SchematicContext,
) {
  const schemaContent = tree.read(schemaFilePath);
  if (!schemaContent) {
    context.logger.error(`Unable to read file: ${schemaFilePath}`);
    return;
  }

  const schema = JSON.parse(schemaContent.toString('utf-8'));
  const title = schema.title || '';
  const customInterfaceName = extractComponentName(title);

  const tsContent = await compileFromFile(schemaFilePath);

  const updatedContent = replaceInterfaceName(tsContent, customInterfaceName);

  if (tree.exists(outputFilePath)) {
    tree.overwrite(outputFilePath, updatedContent);
  } else {
    tree.create(outputFilePath, updatedContent);
  }
}

// 从 title 中提取格式化后的接口名称
function extractComponentName(title: string): string {
  const match = title.match(/(\w+)\s+Options/);
  if (match) {
    return `${match[1]}Options`;
  }
  return 'Options';
}

// 动态替换 .d.ts 文件中的接口名称
function replaceInterfaceName(tsContent: string, newInterfaceName: string): string {
  return tsContent.replace(/export interface (\w+)/, `export interface ${newInterfaceName}`);
}
