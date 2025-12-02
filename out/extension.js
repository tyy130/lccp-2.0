"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const ContextManager_1 = require("./ContextManager");
function activate(context) {
    console.log('✅ TacticDev LCCP v2.0 is now active!');
    // Initialize the LCCP Manager
    const contextManager = new ContextManager_1.ContextManager();
    // Register the Command
    const disposable = vscode.commands.registerCommand('tacticDev.generatePrompt', async () => {
        // 1. UX: Show Progress Indicator
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Scanning workspace & compressing context...",
            cancellable: false
        }, async () => {
            try {
                // 2. Optional: Get User Query
                // (If you want to skip this, pass undefined to generate a generic prompt)
                const query = await vscode.window.showInputBox({
                    prompt: "What task are you working on?",
                    placeHolder: "e.g., Debug the auth service memory leak"
                });
                // 3. Generate LCCP Prompt
                const lccpPrompt = await contextManager.getCompressedContext(query);
                // 4. Copy to Clipboard
                await vscode.env.clipboard.writeText(lccpPrompt);
                // 5. Success Message (with Stats)
                const size = lccpPrompt.length;
                vscode.window.showInformationMessage(`Context Compressed! Copied ${size} chars to clipboard.`);
            }
            catch (err) {
                console.error(err);
                vscode.window.showErrorMessage(`LCCP Failed: ${err.message}`);
            }
        });
    });
    context.subscriptions.push(disposable);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map