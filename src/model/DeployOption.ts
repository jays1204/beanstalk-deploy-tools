import {ConfigurationOptionSettingsList} from "aws-sdk/clients/elasticbeanstalk";
import { readFileSync, existsSync } from 'graceful-fs';
import { resolve } from 'path';

export default class DeployOption {
  deploy_version: string;
  private _description: string | null = null;
  private _option_settings: ConfigurationOptionSettingsList = [];
  private _exclude_paths: string[] = [];

  private _archive_temp_path_prefix: string = '/tmp';

  private _exit_on_exist_version: boolean = true;
  private _archive_directory_path: string = process.cwd();

  constructor(deploy_version: string) {
    this.deploy_version = deploy_version;

    const gitIgnorePath = resolve(this._archive_directory_path, '.gitignore');
    const isExistGitIgnore = existsSync(gitIgnorePath);
    if (isExistGitIgnore) {
      const ignoreList = readFileSync(gitIgnorePath).toString('utf8').split(/\n/);
      this._exclude_paths = ignoreList;
    }
  }

  get description(): string | null {
    return this._description;
  }
  withDescription(description: string): DeployOption {
    this._description = description;
    return this;
  }

  get option_settings(): ConfigurationOptionSettingsList {
    return this._option_settings;
  }
  withCustomOptionSettings(option_settings: ConfigurationOptionSettingsList): DeployOption {
    this._option_settings = option_settings;
    return this;
  }

  get exit_on_exist_version(): boolean {
    return this._exit_on_exist_version;
  }
  withExistOnExistVersion(is_exit: boolean): DeployOption {
    this._exit_on_exist_version = is_exit;
    return this;
  }

  get exclude_paths(): string[] {
    return this._exclude_paths;
  }
  withExcludePaths(exclude_paths: string[]): DeployOption {
    this._exclude_paths = exclude_paths;
    return this;
  }

  get archive_temp_path_prefix(): string {
    return this._archive_temp_path_prefix;
  }
  withArchiveTempPathPrefix(archive_temp_path_prefix: string): DeployOption {
    this._archive_temp_path_prefix = archive_temp_path_prefix;
    return this;
}

  withExcludeArchivePath(): DeployOption {
    return this;
  }

  get archive_directory_path(): string {
    return this._archive_directory_path;
  }
  withArchiveDirectoryPath(archive_directory_path: string): DeployOption {
    this._archive_directory_path = archive_directory_path;
    return this;
  }


  build(): DeployOption {
    return this;
  }
}