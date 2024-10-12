import { join, Path, strings } from '@angular-devkit/core';
import {
  apply,
  branchAndMerge,
  chain,
  mergeWith,
  move,
  Rule,
  SchematicContext,
  SchematicsException,
  template,
  Tree,
  url,
} from '@angular-devkit/schematics';
import { isNullOrUndefined } from 'util';
import { normalizeToKebabOrSnakeCase } from '../../utils/formatting';
import { Location, NameParser } from '../../utils/name.parser';
import { mergeSourceRoot } from '../../utils/source-root.helpers';
import { ComponentOptions } from './component.schema';

export function main(options: ComponentOptions): Rule {
  // 转换和规范化选项
  options = transform(options);
  return (tree: Tree, context: SchematicContext) => {
    try {
      const result = branchAndMerge(
        chain([
          // 合并源路径, 确保文件生成的源路径正确
          mergeSourceRoot(options),
          // 根据模板生成服务文件
          mergeWith(generate(options)),
          // 添加声明到模块
          // addDeclarationToModule(options),
        ]),
      )(tree, context);

      return result;
    } catch (e) {
      console.error(e);
    }
  };
}

function transform(source: ComponentOptions): ComponentOptions {
  const target: ComponentOptions = Object.assign({}, source);

  if (isNullOrUndefined(target.name)) {
    throw new SchematicsException('Option (name) is required.');
  }
  const location: Location = new NameParser().parse(target);
  target.name = normalizeToKebabOrSnakeCase(location.name);
  // TODO 转换为graphql-service 中 component 的路径， 根据target.type去拼接
  target.path = join(normalizeToKebabOrSnakeCase(location.path) as Path, target.name);

  return target;
}

function generate(options: ComponentOptions) {
  return (context: SchematicContext) =>
    //  Schematics 的核心函数，用于将一系列规则应用到某个源（文件模板）
    apply(url(join('./files' as Path, options.language ?? 'ts')), [
      // 将模板中的占位符替换为实际值的函数
      template({
        ...strings,
        ...options,
      }),
      // 将生成的文件移动到指定的目录
      move(options.path!),
    ])(context);
}

// function addDeclarationToModule(options: ComponentOptions): Rule {
//   return (tree: Tree) => {
//     if (options.skipImport !== undefined && options.skipImport) {
//       return tree;
//     }
//     options.module = new ModuleFinder(tree).find({
//       name: options.name,
//       path: options.path as Path,
//     });
//     if (!options.module) {
//       return tree;
//     }
//     const content = tree.read(options.module).toString();
//     const declarator: ModuleDeclarator = new ModuleDeclarator();
//     tree.overwrite(options.module, declarator.declare(content, options as DeclarationOptions));
//     return tree;
//   };
// }
