import { branchAndMerge, chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { execSync } from 'child_process';
import path from 'path';
import { CodePrettier } from './code-helper';
import { OpenapiGenOptions } from './openapi-gen.schema';

export function main(options: OpenapiGenOptions): Rule {
  // 设置输入和输出路径，generator 是选项中的生成器
  const inputSpec = options.inputSpec;
  const outputDir = options.outputDir;
  const generator = options.generator;
  const templateDir = path.resolve(__dirname, `./templates/${options.generator}`);

  return (tree: Tree, context: SchematicContext) => {
    try {
      const result = branchAndMerge(
        chain([
          (tree: Tree, context: SchematicContext) => {
            // 执行命令生成代码
            execSync(
              `openapi-generator-cli generate -i ${inputSpec} -g ${generator} -t ${templateDir} -o ${outputDir}`,
              { stdio: 'ignore' },
            );

            // 使用 prettier 格式化生成的代码
            execSync(`npx prettier --write ${outputDir}/**/*.ts`, { stdio: 'ignore' });

            // 将生成的文件写入 Tree 中
            new CodePrettier(tree, context).processModels(outputDir).processApis(outputDir);

            return tree;
          },
        ]),
      )(tree, context);

      return result;
    } catch (e) {
      console.error(e);
    }
  };
}
