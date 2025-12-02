import * as vscode from 'vscode';
import * as path from 'path';

/**
 * LCCP v2.1 - VS Code Context Manager
 * Integrates LCCP Protocol directly with VS Code API.
 * Captures: Open Tabs, Unsaved Changes, Diagnostics (Errors), and File Tree.
 */

// ==========================================
// CONFIGURATION
// ==========================================
const CONFIG = {
  maxContentLines: 100, // Truncate files larger than this
  excludePatterns: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/out/**'],
  targetModel: 'GPT-5.1', // 'GPT-5.1', 'Claude', 'Gemini'
  aggressiveCompression: true
};

// ==========================================
// PART 1: THE CONTEXT MANAGER (VS Code API)
// ==========================================
export class ContextManager {
  private lccp: LCCPService;

  constructor() {
    this.lccp = new LCCPService({
      targetModel: CONFIG.targetModel,
      aggressiveCompression: CONFIG.aggressiveCompression
    });
  }

  /**
   * Main Entry: Captures state and returns the LCCP Prompt string.
   */
  public async getCompressedContext(userQuery?: string): Promise<string> {
    const context = {
      timestamp: new Date().toISOString(),
      activeTab: this.getActiveEditor(),
      openFiles: this.getOpenFiles(), // Captures unsaved changes
      diagnostics: this.getDiagnostics(), // Captures live errors
      workspaceTree: await this.getWorkspaceTree() // File structure
    };

    return this.lccp.transpile(context, userQuery);
  }

  // --- COLLECTORS ---

  private getActiveEditor() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return null;
    return {
      name: path.basename(editor.document.fileName),
      path: vscode.workspace.asRelativePath(editor.document.fileName),
      cursor: editor.selection.active.line, // Line number where user is focusing
      content: this.readDocument(editor.document)
    };
  }

  private getOpenFiles() {
    // VS Code API doesn't have a direct "getOpenTabs" that returns documents easily
    // This is a common heuristic: iterate known documents that aren't closed
    return vscode.workspace.textDocuments
      .filter(doc => !doc.isClosed && doc.uri.scheme === 'file')
      .map(doc => ({
        name: path.basename(doc.fileName),
        status: doc.isDirty ? 'Unsaved' : 'Saved',
        language: doc.languageId,
        content: this.readDocument(doc)
      }));
  }

  private getDiagnostics() {
    // Get all error/warning markers in the workspace
    const diagnostics = vscode.languages.getDiagnostics();
    const relevant = [];

    for (const [uri, diags] of diagnostics) {
      if (diags.length === 0) continue;
      // Filter out noisy info messages, keep Errors/Warnings
      const errors = diags.filter(d => d.severity === vscode.DiagnosticSeverity.Error || d.severity === vscode.DiagnosticSeverity.Warning);
      
      if (errors.length > 0) {
        relevant.push({
          file: vscode.workspace.asRelativePath(uri),
          errors: errors.map(d => `Line ${d.range.start.line}: ${d.message}`).join(' | ')
        });
      }
    }
    return relevant;
  }

  private async getWorkspaceTree() {
    // Lightweight scan: File names only, no content
    const uris = await vscode.workspace.findFiles('**/*', `{${CONFIG.excludePatterns.join(',')}}`, 50); // Limit to 50 files for safety
    return uris.map(uri => ({
      name: path.basename(uri.fsPath),
      path: vscode.workspace.asRelativePath(uri)
    }));
  }

  private readDocument(doc: vscode.TextDocument): string {
    const lineCount = doc.lineCount;
    if (lineCount > CONFIG.maxContentLines) {
      const start = doc.getText(new vscode.Range(0, 0, CONFIG.maxContentLines, 0));
      return `${start}\n... [Truncated ${lineCount - CONFIG.maxContentLines} lines] ...`;
    }
    return doc.getText();
  }
}

// ==========================================
// PART 2: THE LCCP SERVICE (Embedded)
// ==========================================
// This is the same logic as the CLI version, adapted for pure in-memory objects.
class LCCPService {
  private manifest = new Map<string, string>();
  private reverseManifest = new Map<string, string>();

  constructor(private config: { targetModel: string, aggressiveCompression: boolean }) {}

  public transpile(context: any, userQuery?: string): string {
    this.analyzeFrequencies(context);
    const blocks: string[] = [];

    // #M Block
    if (this.manifest.size > 0) {
      const mBlock = Array.from(this.reverseManifest.entries())
        .map(([alias, val]) => `${alias}=${val}`)
        .join('\n');
      blocks.push(`#M\n${mBlock}`);
    }

    // #STATE Block
    let stateBlock = '#STATE\n';
    if (this.config.targetModel === 'Claude') {
      stateBlock += this.toMinifiedYaml(context);
    } else {
      stateBlock += this.processValue(context, 0);
    }
    blocks.push(stateBlock);

    // #REQ Block
    if (userQuery) {
      blocks.push(`#REQ\n${this.applyTSC(userQuery)}`);
    }

    return blocks.join('\n\n');
  }

  // --- ENGINES (TSC, TOON, YAML) ---

  private applyTSC(text: string): string {
    let out = text
      .replace(/\b(leads to|causes|causing)\b/gi, '->')
      .replace(/\b(caused by|result of)\b/gi, '<-')
      .replace(/\b(therefore|implies)\b/gi, '=>')
      .replace(/\b(the|a|an|is|are|was|were)\b/gi, ' ');

    this.manifest.forEach((alias, original) => {
      const regex = new RegExp(`\\b${this.escapeRegExp(original)}\\b`, 'g');
      out = out.replace(regex, alias);
    });

    if (this.config.aggressiveCompression) {
      out = out.split(' ').map(w => this.compressWord(w)).join(' ');
    }
    return out.replace(/\s+/g, ' ').trim();
  }

  private compressWord(word: string): string {
    if (word.length < 4 || word.includes('_') || word.startsWith('$') || word.includes(':')) return word;
    const first = word.charAt(0);
    const rest = word.slice(1).replace(/[aeiouAEIOU]/g, '');
    return first + rest;
  }

  private processValue(data: any, depth: number): string {
    if (data === null || data === undefined) return '';
    if (depth > 2 && typeof data === 'object') return this.toMinifiedYaml(data, depth);
    if (Array.isArray(data)) return this.arrayToTOON(data, depth);
    if (typeof data === 'object') return this.objectToHybrid(data, depth);
    return typeof data === 'string' ? this.applyTSC(data) : String(data);
  }

  private arrayToTOON(arr: any[], depth: number): string {
    if (arr.length === 0) return '[]';
    
    // Check for objects
    const isObjArr = arr.every(i => typeof i === 'object' && i !== null && !Array.isArray(i));

    if (isObjArr) {
      // CONTENT GUARD: If content/code exists, switch to YAML list to preserve formatting
      const hasContent = arr.some(obj => Object.keys(obj).includes('content') || Object.keys(obj).includes('errors'));
      if (hasContent) return this.toMinifiedYaml(arr, depth);

      const keysSet = new Set<string>();
      arr.forEach(o => Object.keys(o).forEach(k => keysSet.add(k)));
      const keys = Array.from(keysSet);
      
      const header = `List[${arr.length}]{${keys.join(',')}}:`;
      const rows = arr.map(obj => 
        keys.map(k => {
          let val = this.processValue(obj[k], depth + 1);
          if (val.includes(',')) val = `"${val}"`;
          return val;
        }).join(',')
      ).join('\n');
      return `${header}\n${rows}`;
    }
    return `[${arr.map(v => this.processValue(v, depth)).join(',')}]`;
  }

  private objectToHybrid(obj: any, depth: number): string {
    let out = '';
    for (const [key, value] of Object.entries(obj)) {
      let valStr: string;
      // Skip TSC for sensitive fields
      if (['content', 'code', 'error', 'errors', 'diagnostics'].includes(key)) {
        valStr = typeof value === 'string' ? value : String(value);
      } else {
        valStr = this.processValue(value, depth + 1);
      }

      if (valStr.includes('\n')) {
        out += `${key}:\n${this.indent(valStr, 1)}\n`;
      } else {
        out += `${key}:${valStr}\n`;
      }
    }
    return out.trim();
  }

  private toMinifiedYaml(data: any, level = 0): string {
    const indent = '  '.repeat(level);
    
    if (Array.isArray(data)) {
      // Flow style for simple lists, block for complex
      if (data.every(i => typeof i !== 'object') && data.length < 5) return `[${data.join(',')}]`;
      return data.map(i => `\n${indent}- ${this.toMinifiedYaml(i, level + 1).trim()}`).join('');
    }
    
    if (typeof data === 'object' && data !== null) {
      return Object.entries(data).map(([k, v]) => {
        let val: string;
        // Block Literal for Code/Content
        if ((['content', 'errors'].includes(k)) && typeof v === 'string') {
          const lines = v.split('\n');
          const blockIndent = '  '.repeat(level + 1);
          val = '|\n' + lines.map(l => blockIndent + l).join('\n');
          return `\n${indent}${k}: ${val}`;
        } else {
          val = this.toMinifiedYaml(v, level + 1);
        }

        if (val.includes('\n') || (typeof v === 'object' && v !== null)) return `\n${indent}${k}:\n${val}`;
        return `\n${indent}${k}: ${val.trim()}`;
      }).join('').trim();
    }
    
    return typeof data === 'string' ? this.applyTSC(data) : String(data);
  }

  // --- UTILS ---
  private analyzeFrequencies(data: any) {
    const counts = new Map<string, number>();
    const visit = (n: any) => {
      // Don't analyze code content for frequency
      if (typeof n === 'string' && n.length > 5 && !n.includes('\n') && !n.includes(' ')) {
        counts.set(n, (counts.get(n) || 0) + 1);
      } else if (typeof n === 'object' && n) {
        Object.entries(n).forEach(([k, v]) => {
          if (k !== 'content') visit(v); // Skip content fields
        });
      }
    };
    visit(data);
    let idx = 1;
    Array.from(counts.entries())
      .filter(([_, c]) => c >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([str]) => {
        if (!this.manifest.has(str)) {
          this.manifest.set(str, `$${idx}`);
          this.reverseManifest.set(`$${idx}`, str);
          idx++;
        }
      });
  }

  private indent(s: string, l: number): string { return s.split('\n').map(x => '  '.repeat(l) + x).join('\n'); }
  private escapeRegExp(s: string): string { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
}
