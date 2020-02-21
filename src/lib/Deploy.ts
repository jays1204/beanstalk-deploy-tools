import * as AWS from 'aws-sdk';
import * as _ from 'lodash';
import * as archiver from "archiver";
import * as ElasticBeanstalk from "aws-sdk/clients/elasticbeanstalk";
import {
  ApplicationVersionDescription,
  EnvironmentDescription,
  EnvironmentDescriptionsList, UpdateEnvironmentMessage
} from "aws-sdk/clients/elasticbeanstalk";
import {ApplicationVersionDescriptionList} from "aws-sdk/clients/elasticbeanstalk";
import {DeployOption} from "../index";
import { join } from 'path';
import { createWriteStream } from 'graceful-fs';

AWS.config.setPromisesDependency(Promise);

export default class Deploy {
  eb: ElasticBeanstalk;
  region: string;
  app_name: string;
  app_env_name: string;

  // credential을 여기서 받는게 제일 좋긴하다.
  constructor(region: string, app_name: string, app_env_name: string) {
    this.eb = new AWS.ElasticBeanstalk();
    this.region = region;
    this.app_name = app_name;
    this.app_env_name = app_env_name;
  }

  // optional
  setAwsCredentials(access_key_id: string, secret_access_key: string) {
    AWS.config.accessKeyId = access_key_id;
    AWS.config.secretAccessKey = secret_access_key;
  }

  // check env status
  async isReadyForDeploy(): Promise<boolean> {
    const params = {
      ApplicationName: this.app_name,
      EnvironmentNames: [ this.app_env_name ]
    };

    let describedInfo;
    try {
      describedInfo = await this.eb.describeEnvironments(params).promise();
    } catch (e) {
      console.error('[FAIl_CHECK_ENV_HEALTH]', e);
      throw e;
    }

    // TODO 아예 없는 환경일 경우 등 에러..
    if (describedInfo && describedInfo.Environments) {
      const healthList: EnvironmentDescriptionsList = describedInfo.Environments;

      if (healthList.length < 1) {
        console.error(`[NOT_FOUND_HEALTH_INFO] - app_name:${this.app_name}, app_env_name:${this.app_env_name}`);
        throw new Error('NOT_FOUND_HEALTH_INFO');
      }

      const envDescription: EnvironmentDescription = healthList[0];

      if (envDescription.EnvironmentName !== this.app_env_name || envDescription.ApplicationName !== this.app_name) {
        console.info(`[WRONG_ENV_INFO] - app_name:${this.app_name}, app_env_name:${this.app_env_name}`);
        throw new Error('WRONG_ENV_INFO');
      }

      if (envDescription.Status === "Ready") {
        return true;
      }

      console.info(`[NOT_READY_STATUS] - status:${envDescription.Status}`);
    }

    return false;
  }

  async isAlreadyExistVersion(version_label: string): Promise<boolean> {
    const params = {
      ApplicationName: this.app_name,
      VersionLabels: [ version_label ]
    };

    const data = await this.eb.describeApplicationVersions(params).promise();

    if (data && data.ApplicationVersions) {
      const versions: ApplicationVersionDescriptionList = data.ApplicationVersions;

      const sameVersionExistCount: number = versions.filter((versionDescription: ApplicationVersionDescription) => {
        return versionDescription.VersionLabel === version_label;
      }).length;

      return sameVersionExistCount > 0 ? true : false;
    } else {
      // error
      throw new Error('');
    }
  }

  async createArchiveFile(deployOption: DeployOption): Promise<string> {
    const zipArchiver = archiver('zip');
    const archiveDirectoryPath: string = deployOption.archive_directory_path;
    const filename = `eb-app-${(new Date()).getTime()}.zip`;
    const destPath: string = join(deployOption.archive_temp_path_prefix, filename);

    console.info(`[BEGIN_ARCHIVE] - src:${archiveDirectoryPath}, dest:${destPath}`);
    zipArchiver.glob('**', {
      // FIXME exclude가 안된다.
        ignore: deployOption.exclude_paths,
        cwd: archiveDirectoryPath
      });
    zipArchiver.on('error', (err) => {
      console.error('[FAIL_ARCHIVE]', err);
      throw err;
    });
    zipArchiver.pipe(createWriteStream(destPath));
    zipArchiver.directory(archiveDirectoryPath, './');
    await zipArchiver.finalize();

    console.info('[DONE_ARCHIVE]');
    return destPath;
  }

  async uploadApp(deployOption: DeployOption): Promise<EnvironmentDescription> {
    if (_.isNil(deployOption.deploy_version)) {
      console.error('DEPLOY_VERSION_MUST_BE_SPECIFIED');
      throw new Error('');
    }

    const params: UpdateEnvironmentMessage = {
      ApplicationName: this.app_name,
      EnvironmentName: this.app_env_name,
      VersionLabel: deployOption.deploy_version
    };

    if (deployOption.description) {
      params.Description = deployOption.description;
      console.info(`[SET_DESCRIPTION] - desc:${deployOption.description}`);
    }

    if (deployOption.option_settings && deployOption.option_settings.length > 0) {
      params.OptionSettings = deployOption.option_settings;
      console.info('[SET_CUSTOM_OPTION_SETTINGS]', JSON.stringify( deployOption.option_settings));
    }

    const result: EnvironmentDescription = await this.eb.updateEnvironment(params).promise();
    return result;
  }

  // TODO NODE_ENV 의 환경변수 값도 배포시에 고를수 있는지 보자.
  async deploy(deployOption: DeployOption): Promise<void> {
    // check env status
    // check already version exist
    // (optional) no exist, archive and upload zip
    // update appliation by version
    const isAlreadyExistVersion: boolean = await this.isAlreadyExistVersion(deployOption.deploy_version);
    if (isAlreadyExistVersion) {
      if (deployOption.exit_on_exist_version) {
        console.info(`[EXIST_DEPLOY_PROCESS] SET_EXIT_VALUE]`);
        return;
      } else {
        console.info(`[ALREADY_EXIST_VERSION] - version_name:${deployOption.deploy_version}`);
      }
    } else {
      // TODO upload
    }

  }
}
