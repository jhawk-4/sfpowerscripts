import PackageMetadata from "../PackageMetadata";
import AssignPermissionSetsImpl from "../sfdxwrappers/AssignPermissionSetsImpl";
import child_process = require("child_process");
import { onExit } from "../utils/OnExit";
import fs = require("fs");
const path = require("path");

export default class InstallDataPackageImpl {
  public constructor(
    private targetusername: string,
    private projectDirectory: string,
    private packageDirectory: string,
    private packageMetadata: PackageMetadata
  ) {}

  public async exec(): Promise<void> {
    try {
      if (
        new RegExp("AssignPermissionSets", "i").test(this.packageMetadata.preDeploymentSteps?.toString()) &&
        this.packageMetadata.permissionSetsToAssign
      ) {
        let assignPermissionSetsImpl: AssignPermissionSetsImpl = new AssignPermissionSetsImpl(
          this.targetusername,
          this.packageMetadata.permissionSetsToAssign,
          this.projectDirectory
        )

        console.log("Executing pre-deployment step: AssignPermissionSets");
        assignPermissionSetsImpl.exec();
      }

      let command = this.buildExecCommand();
      let child = child_process.exec(
        command,
        { cwd: path.resolve(this.projectDirectory), encoding: "utf8" }
      );

      child.stdout.on("data", (data) => {
        console.log(data.toString());
      });

      child.stderr.on("data", (data) => {
        console.log(data.toString());
      });

      await onExit(child);

    } catch (err) {
      throw err;
    } finally {
      let csvIssuesReportFilepath: string = path.join(this.projectDirectory, this.packageDirectory, `CSVIssuesReport.csv`)
      if (fs.existsSync(csvIssuesReportFilepath)) {
        console.log(`\n---------------------WARNING: SFDMU detected CSV issues, verify the following files -------------------------------`);
        console.log(fs.readFileSync(csvIssuesReportFilepath, 'utf8'));
      }
    }
  }

  private buildExecCommand(): string {
    let command = `sfdx sfdmu:run --path ${this.packageDirectory} -s csvfile -u ${this.targetusername} --noprompt`;

    console.log(`Generated Command ${command}`);
    return command;
  }
}
