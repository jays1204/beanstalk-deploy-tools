import {Deploy, DeployOption} from "../../src";
import { existsSync } from 'graceful-fs';

describe('Deploy', () => {
  jest.setTimeout(1000 * 60);

  const deploy = new Deploy('ap-northeast-2', 'test_app', 'test_app_env');
  let archivedFilePath: string | null = null;

  // it('do archive well', async () => {
  //   const deployOption = new DeployOption('test_version');
  //   const option = deployOption
  //     .withArchiveDirectoryPath(process.cwd() + '/test')
  //     .build();
  //
  //   // console.log('ddddd', deployOption)
  //   archivedFilePath = await deploy.createArchiveFile(option);
  //   expect(existsSync(archivedFilePath)).toBeTruthy;
  // });

  it('do archive exclude well', async () => {
    const deployOption = new DeployOption('test_version');
    const option = deployOption
      .withArchiveDirectoryPath(process.cwd() + '/test')
      .withExcludePaths(['test_pack_data/hello.txt', 'lib'])
      .build();

    // console.log('ddddd', deployOption)
    archivedFilePath = await deploy.createArchiveFile(option);
    expect(existsSync(archivedFilePath)).toBeTruthy;
  });

  // afterEach(() => {
  //   if (archivedFilePath) {
  //     unlinkSync(archivedFilePath);
  //   }
  // });
});