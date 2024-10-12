import { BuildComponent, ComponentType, ExecComponentOutputDTO, IMeanComponent } from '#component/common/index';
import { Service } from 'typedi';
import { ProcessBlockModel } from '../../../../../process/common/models/process-block.model';

@Service(ComponentType.<%= classify(name) %>)
export class <%= classify(name) %>ComponentService extends IMeanComponent.Core {
  modifyStructure: boolean = <%= type === 'executors' ? 'false' : 'true' %>;

  verify(processBlock: ProcessBlockModel): boolean {
    throw new Error('Method not implemented.');
  }

  execute(params: IMeanComponent.ExecuteParams): Promise<void> {
    throw new Error('Method not implemented.');
  }

  final(params: IMeanComponent.ExecuteParams, result: ExecComponentOutputDTO): Promise<ExecComponentOutputDTO> {
    throw new Error('Method not implemented.');
  }

  duplicateMetadata(
    metadata: BuildComponent.<%= classify(name) %>BuilderDTO,
    paramIdMapping: Map<string, string>,
    nodeIdMapping: Map<string, string>
  ): typeof BuildComponent.MetadataOutput {
    throw new Error('Method not implemented.');
  }
}
