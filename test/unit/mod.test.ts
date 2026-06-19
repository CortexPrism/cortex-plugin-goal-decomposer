// deno-lint-ignore-file require-await
import { assertEquals, assertStringIncludes } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { tools } from '../../mod.ts';
import type { PluginContext } from 'cortex/plugins';

const mockContext: PluginContext = {
  pluginId: 'cortex-plugin-goal-decomposer',
  pluginDir: '/tmp/plugins/cortex-plugin-goal-decomposer',
  state: {
    get: async () => null,
    set: async () => {},
  },
  config: {},
};

function findTool(name: string) {
  return tools.find((t) => t.definition.name === name);
}

Deno.test('decompose_goal - decomposes a goal successfully', async () => {
  const tool = findTool('decompose_goal');
  if (!tool) throw new Error('decompose_goal tool not found');

  const result = await tool.execute({ goal: 'Build a REST API' }, mockContext);
  assertEquals(result.success, true);
  const output = JSON.parse(result.output);
  assertStringIncludes(output.goal, 'Build a REST API');
  assertEquals(output.subtasks.length > 0, true);
  assertEquals(output.totalSubtasks > 0, true);
});

Deno.test('decompose_goal - accepts max_subtasks param', async () => {
  const tool = findTool('decompose_goal');
  if (!tool) throw new Error('decompose_goal tool not found');

  const result = await tool.execute({ goal: 'Build a REST API', max_subtasks: 3 }, mockContext);
  assertEquals(result.success, true);
  const output = JSON.parse(result.output);
  assertEquals(output.totalSubtasks, 3);
});

Deno.test('decompose_goal - rejects missing goal', async () => {
  const tool = findTool('decompose_goal');
  if (!tool) throw new Error('decompose_goal tool not found');

  const result = await tool.execute({}, mockContext);
  assertEquals(result.success, false);
  assertStringIncludes(result.error, 'non-empty string');
});

Deno.test('decompose_goal - rejects non-string goal', async () => {
  const tool = findTool('decompose_goal');
  if (!tool) throw new Error('decompose_goal tool not found');

  const result = await tool.execute({ goal: 123 }, mockContext);
  assertEquals(result.success, false);
});

Deno.test('assign_subtasks - assigns subtasks successfully', async () => {
  const tool = findTool('assign_subtasks');
  if (!tool) throw new Error('assign_subtasks tool not found');

  const subtasks = JSON.stringify([
    {
      id: 'sub_1',
      title: 'Task 1',
      description: 'Desc 1',
      dependencies: [],
      status: 'pending',
      priority: 'high',
    },
    {
      id: 'sub_2',
      title: 'Task 2',
      description: 'Desc 2',
      dependencies: ['sub_1'],
      status: 'pending',
      priority: 'medium',
    },
  ]);

  const result = await tool.execute({ subtasks }, mockContext);
  assertEquals(result.success, true);
  const output = JSON.parse(result.output);
  assertEquals(output.totalAssigned, 2);
});

Deno.test('assign_subtasks - assigns with agent list', async () => {
  const tool = findTool('assign_subtasks');
  if (!tool) throw new Error('assign_subtasks tool not found');

  const subtasks = JSON.stringify([
    {
      id: 'sub_1',
      title: 'Task 1',
      description: 'Desc',
      dependencies: [],
      status: 'pending',
      priority: 'high',
    },
  ]);
  const agents = JSON.stringify(['architect', 'coder']);

  const result = await tool.execute({ subtasks, agents }, mockContext);
  assertEquals(result.success, true);
  const output = JSON.parse(result.output);
  assertEquals(output.totalAssigned, 1);
  assertEquals(output.assignments[0].assignedTo, 'architect');
});

Deno.test('assign_subtasks - rejects missing subtasks', async () => {
  const tool = findTool('assign_subtasks');
  if (!tool) throw new Error('assign_subtasks tool not found');

  const result = await tool.execute({}, mockContext);
  assertEquals(result.success, false);
  assertStringIncludes(result.error, 'non-empty string');
});

Deno.test('assign_subtasks - rejects invalid JSON', async () => {
  const tool = findTool('assign_subtasks');
  if (!tool) throw new Error('assign_subtasks tool not found');

  const result = await tool.execute({ subtasks: 'not-json' }, mockContext);
  assertEquals(result.success, false);
  assertStringIncludes(result.error, 'valid JSON');
});

Deno.test('assign_subtasks - rejects empty array', async () => {
  const tool = findTool('assign_subtasks');
  if (!tool) throw new Error('assign_subtasks tool not found');

  const result = await tool.execute({ subtasks: '[]' }, mockContext);
  assertEquals(result.success, false);
  assertStringIncludes(result.error, 'non-empty JSON array');
});

Deno.test('track_progress - rejects missing goal_id', async () => {
  const tool = findTool('track_progress');
  if (!tool) throw new Error('track_progress tool not found');

  const result = await tool.execute({}, mockContext);
  assertEquals(result.success, false);
  assertStringIncludes(result.error, 'goal_id');
});

Deno.test('track_progress - rejects unknown goal_id', async () => {
  const tool = findTool('track_progress');
  if (!tool) throw new Error('track_progress tool not found');

  const result = await tool.execute({ goal_id: 'nonexistent' }, mockContext);
  assertEquals(result.success, false);
  assertStringIncludes(result.error, 'not found');
});

Deno.test('track_progress - tracks progress after decomposition', async () => {
  const decompose = findTool('decompose_goal');
  if (!decompose) throw new Error('decompose_goal tool not found');

  const decResult = await decompose.execute({ goal: 'Test goal' }, mockContext);
  const { goalId } = JSON.parse(decResult.output);

  const track = findTool('track_progress');
  if (!track) throw new Error('track_progress tool not found');

  const result = await track.execute({ goal_id: goalId }, mockContext);
  assertEquals(result.success, true);
  const output = JSON.parse(result.output);
  assertEquals(output.goalId, goalId);
});

Deno.test('goal_status - rejects missing goal_id', async () => {
  const tool = findTool('goal_status');
  if (!tool) throw new Error('goal_status tool not found');

  const result = await tool.execute({}, mockContext);
  assertEquals(result.success, false);
  assertStringIncludes(result.error, 'goal_id');
});

Deno.test('goal_status - gets status after decomposition', async () => {
  const decompose = findTool('decompose_goal');
  if (!decompose) throw new Error('decompose_goal tool not found');

  const decResult = await decompose.execute({ goal: 'Test goal' }, mockContext);
  const { goalId } = JSON.parse(decResult.output);

  const tool = findTool('goal_status');
  if (!tool) throw new Error('goal_status tool not found');

  const result = await tool.execute({ goal_id: goalId }, mockContext);
  assertEquals(result.success, true);
  const output = JSON.parse(result.output);
  assertEquals(output.goalId, goalId);
  assertEquals(output.status, 'active');
});

Deno.test('replan - rejects missing params', async () => {
  const tool = findTool('replan');
  if (!tool) throw new Error('replan tool not found');

  const result = await tool.execute({}, mockContext);
  assertEquals(result.success, false);
  assertStringIncludes(result.error, 'goal_id');
});

Deno.test('replan - rejects missing change_description', async () => {
  const tool = findTool('replan');
  if (!tool) throw new Error('replan tool not found');

  const result = await tool.execute({ goal_id: 'goal_123' }, mockContext);
  assertEquals(result.success, false);
  assertStringIncludes(result.error, 'change_description');
});

Deno.test('replan - replans after decomposition', async () => {
  const decompose = findTool('decompose_goal');
  if (!decompose) throw new Error('decompose_goal tool not found');

  const decResult = await decompose.execute({ goal: 'Test goal' }, mockContext);
  const { goalId } = JSON.parse(decResult.output);

  const tool = findTool('replan');
  if (!tool) throw new Error('replan tool not found');

  const result = await tool.execute({
    goal_id: goalId,
    change_description: 'Priority changed',
  }, mockContext);
  assertEquals(result.success, true);
  const output = JSON.parse(result.output);
  assertEquals(output.goalId, goalId);
});

Deno.test('tools array exported', () => {
  assertEquals(tools.length, 5);
  assertEquals(tools[0].definition.name, 'decompose_goal');
  assertEquals(tools[1].definition.name, 'assign_subtasks');
  assertEquals(tools[2].definition.name, 'track_progress');
  assertEquals(tools[3].definition.name, 'goal_status');
  assertEquals(tools[4].definition.name, 'replan');
});
