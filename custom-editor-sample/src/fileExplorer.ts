import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class FileExplorerProvider implements vscode.TreeDataProvider<FileTreeItem> {

	private _onDidChangeTreeData: vscode.EventEmitter<FileTreeItem | undefined | void> = new vscode.EventEmitter<FileTreeItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<FileTreeItem | undefined | void> = this._onDidChangeTreeData.event;

	constructor(private exampleFilesFolderPath: string) {
		vscode.commands.registerCommand('fileExplorer.openResource', resource => this.openResource(resource));
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: FileTreeItem): vscode.TreeItem {
		return element;
	}

	getChildren(element?: FileTreeItem): Thenable<FileTreeItem[]> {
		if (!this.exampleFilesFolderPath) {
			vscode.window.showInformationMessage(`Could not find any files in folder ${this.exampleFilesFolderPath}`);
			return Promise.resolve([]);
		}
		return Promise.resolve(this.getFiles(this.exampleFilesFolderPath));
	}

	private openResource(filePath: string): void {
		const uri = vscode.Uri.file(path.join(this.exampleFilesFolderPath, filePath));
    	vscode.commands.executeCommand('vscode.openWith', uri, 'editors.dmnEditor');
	}

	private getFiles(folderPath: string): FileTreeItem[] {
		if (this.pathExists(folderPath)) {
			  	const files = fs.readdirSync(folderPath);
			  	let treeItems: FileTreeItem[] = [];

			  	files.forEach(file => {
					treeItems.push(new FileTreeItem(file, vscode.TreeItemCollapsibleState.None, {
						command: 'fileExplorer.openResource',
						title: '',
						arguments: [file]
					}));
				});

				return treeItems;
		} else {
			return [];
		}
	}

	private pathExists(p: string): boolean {
		try {
			fs.accessSync(p);
		} catch (err) {
			return false;
		}

		return true;
	}
}

export class FileTreeItem extends vscode.TreeItem {

	constructor(
		public readonly fileName: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly command?: vscode.Command
	) {
		super(fileName, collapsibleState);
		this.tooltip = `${this.fileName}`;
	}
}
