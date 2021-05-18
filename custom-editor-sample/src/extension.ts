import * as vscode from 'vscode';
import { DmnEditorProvider } from './dmnEditor';
import * as path from 'path';
import { FileExplorerProvider } from './fileExplorer';

export function activate(context: vscode.ExtensionContext) {
	// Register our custom editor providers
	context.subscriptions.push(DmnEditorProvider.register(context));

	const fileExplorerProvider = new FileExplorerProvider(path.join(vscode.workspace.rootPath as string, 'custom-editor-sample', 'exampleFiles'));
	vscode.window.registerTreeDataProvider('fileExplorer', fileExplorerProvider);
}
