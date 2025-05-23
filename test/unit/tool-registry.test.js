import test from 'node:test';
import assert from 'node:assert/strict';
import esbuild from 'esbuild';

async function loadToolRegistry() {
  const result = await esbuild.build({
    entryPoints: ['src-new/service-api/core/tool-registry.ts'],
    bundle: true,
    platform: 'node',
    format: 'esm',
    write: false,
    plugins: [{
      name: 'stub-obsidian',
      setup(build) {
        build.onResolve({ filter: /^obsidian$/ }, args => ({ path: args.path, namespace: 'stub-obsidian' }));
        build.onLoad({ filter: /.*/, namespace: 'stub-obsidian' }, () => ({
          contents: 'export const MarkdownView=class {}; export const WorkspaceLeaf=class {}; export default {};',
          loader: 'js'
        }));
      }
    }]
  });
  const code = result.outputFiles[0].text;
  const url = `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
  return import(url);
}

let toolRegistry;

test.before(async () => {
  const originalLog = console.log;
  console.log = () => {};
  const mod = await loadToolRegistry();
  console.log = originalLog;
  toolRegistry = mod.toolRegistry;
});

test('getRegisteredToolNames で複数のツール名を取得できる', () => {
  const names = toolRegistry.getRegisteredToolNames();
  assert(names.length > 1, '少なくとも2つのツールが登録されている');
  assert(names.includes('create_storyboard_file'), 'create_storyboard_file が含まれる');
  assert(names.includes('rename_file_extension'), 'rename_file_extension が含まれる');
});

test('getTool で正しいツールを返す', () => {
  const tool = toolRegistry.getTool('create_storyboard_file');
  assert(tool, 'ツールが取得できる');
  assert.equal(tool.name, 'create_storyboard_file');
});

test('isAiEnabled と hasToolRegistered を検証', () => {
  assert.equal(toolRegistry.hasToolRegistered('create_storyboard_file'), true);
  assert.equal(toolRegistry.isAiEnabled('create_storyboard_file'), false);
});
