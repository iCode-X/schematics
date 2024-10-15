import { Service } from 'typedi';
import { ProcessBlockModel } from '../../../../../process/common/models/process-block.model';
import { IMeanComponent } from '../../common/base.component';
import { BuildComponent } from '../../common/dto/component.builder.dto';
import { ExecComponentOutputDTO } from '../../common/dto/component.copilot.dto';
import { ComponentType } from '../../common/enums/component.enum';

@Service(ComponentType.<%= classify(name) %>)
export class <%= classify(name) %>ComponentService extends IMeanComponent.Core {
  modifyStructure: boolean = <%= type === 'executors' ? 'false' : 'true' %>;

  verify(processBlock: ProcessBlockModel): boolean {
    throw new Error('Method not implemented.');
  }

  async execute(params: IMeanComponent.ExecuteParams): Promise<void> {
     this.execResult.type = ComponentType.Test;

    throw new Error('Method not implemented.');
  }

  async final(params: IMeanComponent.ExecuteParams, result: ExecComponentOutputDTO): Promise<ExecComponentOutputDTO> {
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
