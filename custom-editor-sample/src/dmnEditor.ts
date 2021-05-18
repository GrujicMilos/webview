import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class DmnEditorProvider implements vscode.CustomTextEditorProvider {

	private static readonly viewType = 'editors.dmnEditor';
	private editorRoute: string = 'dmn-editor';
	private extensionPath: string;
	private readonly webviewsAppName: string = 'studio-webviews';
	
	public static register(context: vscode.ExtensionContext): vscode.Disposable {
		const provider = new DmnEditorProvider(context);
		const providerRegistration = vscode.window.registerCustomEditorProvider(this.viewType, provider);
		return providerRegistration;
	}

	constructor(
		private readonly context: vscode.ExtensionContext
	) {
		this.extensionPath = context.extensionPath;
	 }

	/**
	 * Called when our custom editor is opened.
	 * 
	 * 
	 */
	public async resolveCustomTextEditor(
		document: vscode.TextDocument,
		webviewPanel: vscode.WebviewPanel,
		_token: vscode.CancellationToken
	): Promise<void> {
		// Setup initial content for the webview
		webviewPanel.webview.options = {
			enableScripts: true,
			localResourceRoots: this.getLocalResourceRoots(),
		};
		webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

		function updateWebview() {
			webviewPanel.webview.postMessage({
				type: 'update',
				text: document.getText(),
			});
		}

		// Hook up event handlers so that we can synchronize the webview with the text document.
		//
		// The text document acts as our model, so we have to sync change in the document to our
		// editor and sync changes in the editor back to the document.
		// 
		// Remember that a single text document can also be shared between multiple custom
		// editors (this happens for example when you split a custom editor)

		const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
			if (e.document.uri.toString() === document.uri.toString()) {
				updateWebview();
			}
		});

		// Make sure we get rid of the listener when our editor is closed.
		webviewPanel.onDidDispose(() => {
			changeDocumentSubscription.dispose();
		});

		// Receive message from the webview.
		webviewPanel.webview.onDidReceiveMessage(e => {
		});

		updateWebview();
	}

	/**
	 * Get the static html used for the editor webviews.
	 */
	private getHtmlForWebview(webview: vscode.Webview): string {
		return this.getHtml();
	}

	 /**
     * Gets root folders where local resources are stored.
     */
	  protected getLocalResourceRoots(): vscode.Uri[] {
        return [
            vscode.Uri.file(path.join(this.extensionPath, 'media')),
            vscode.Uri.file(path.join(this.extensionPath, 'out', 'webviews', 'dist')),
            vscode.Uri.file(
                path.join(
                    path.dirname(this.extensionPath),
                    this.webviewsAppName,
                    'dist',
                    this.webviewsAppName
                )
            ),
            vscode.Uri.file(path.join(path.dirname(this.extensionPath), this.webviewsAppName)),
        ];
    }

	/**
     * Gets html for webview.
     */
	 protected getHtml(): string {
        let html: string;

		const editorPath = path.join(
			path.dirname(this.extensionPath),
			this.webviewsAppName,
			'dist',
			this.webviewsAppName
		);
		html = this.getHtmlFromPrebuiltApp(editorPath);

        // if (StudioConfiguration.developmentMode) {
        //     // html served prebuilt app
        //     const editorPath = path.join(
        //         path.dirname(this.extensionPath),
        //         this.webviewsAppName,
        //         'dist',
        //         this.webviewsAppName
        //     );
        //     html = this.getHtmlFromPrebuiltApp(editorPath);
        // } else {
        //     // extension running standalone
        //     const editorPath = path.join(this.extensionPath, 'out', 'webviews', 'dist');
        //     html = this.getHtmlFromPrebuiltApp(editorPath);
        // }

        return html;
    }

	private getHtmlFromPrebuiltApp(editorPath: string): string {
        const editorPathOnDisk = vscode.Uri.file(editorPath);
        const editorPathSheme = editorPathOnDisk.with({ scheme: 'vscode-resource' });
        const text = fs.readFileSync(path.join(editorPath, 'index.html'), 'utf8');

        const settings = undefined; // this.getSettings();
        const settingsStringified = settings ? JSON.stringify(settings) : undefined;

        const editorPathString = editorPathSheme.toString();
        const nodeModulesPath = `${editorPathString.replace(/\/dist\/.*/g, '/dist')}/node_modules`;
		// StudioConfiguration.developmentMode ? `${editorPathString.replace(/\/dist\/.*/g, '/dist')}/node_modules`
        //     : `${editorPathString}/node_modules`;

        const html = text
            .replace(/src="/g, `src="${editorPathSheme.toString()}/`) // adjust script & css paths
            .replace(/href="styles/g, `href="${editorPathSheme.toString()}/styles`) // Angular prod build uses <link rel="stylesheet" href="styles.css"> for css
            .replace(
                /let webviewInitRoute = undefined/g,
                `let webviewInitRoute = '/${this.editorRoute}'`
            )
            .replace(
                /let editorSettings = undefined/g,
                'let editorSettings = ' + settingsStringified
            )
            .replace(
                /window.__adinsure__extension__webviews__ = undefined/g,
                `window.__adinsure__extension__webviews__ = '${editorPathSheme.toString()}/'`
            )
            .replace(
                /window.__adinsure__extension__node_modules__ = "node_modules"/g,
                `window.__adinsure__extension__node_modules__ = '${nodeModulesPath}'`
            );
            //.replace(/<meta charset=\"utf-8\">/g, 
            // `<meta charset="UTF-8"> \r\n <meta http-equiv="Content-Security-Policy" content="default-src * 'unsafe-inline' 'unsafe-eval'; script-src * 'unsafe-inline' 'unsafe-eval'; connect-src * 'unsafe-inline'; img-src * data: blob: 'unsafe-inline'; frame-src *; style-src * 'unsafe-inline';">`);

        return html;
    }
}
