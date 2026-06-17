/**
 * CortexPrism Goal Decomposition Engine
 *
 * Breaks complex goals into dependency-ordered subtasks.
 * #5 in the official plugin registry.
 */

import type { PluginContext, Tool, ToolCallResult, ToolContext } from './types.ts';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GoalDecomposerConfig {
  maxSubtasks: number;
  autoAssign: boolean;
}

interface Subtask {
  id: string;
  title: string;
  description: string;
  dependencies: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  assignedTo?: string;
  priority: 'high' | 'medium' | 'low';
}

interface Goal {
  id: string;
  goal: string;
  context?: string;
  subtasks: Subtask[];
  createdAt: string;
  status: 'active' | 'completed' | 'blocked';
}

// ---------------------------------------------------------------------------
// Module-level config (closure pattern)
// ---------------------------------------------------------------------------

let config: GoalDecomposerConfig = {
  maxSubtasks: 8,
  autoAssign: true,
};

// ---------------------------------------------------------------------------
// In-memory goal store
// ---------------------------------------------------------------------------

const goals = new Map<string, Goal>();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let goalIdCounter = 0;

function generateGoalId(): string {
  goalIdCounter += 1;
  return `goal_${Date.now()}_${goalIdCounter}`;
}

function generateSubtaskId(goalId: string, index: number): string {
  return `${goalId}_subtask_${index + 1}`;
}

function decomposeGoalInternal(
  goalText: string,
  contextText: string | undefined,
  maxSubtasks: number,
): Subtask[] {
  const count = Math.min(maxSubtasks, 10);
  const subtasks: Subtask[] = [];
  const goalId = generateGoalId();

  const templates = [
    {
      title: 'Analyze requirements',
      description: `Analyze requirements and constraints for: ${goalText}`,
      priority: 'high' as const,
    },
    {
      title: 'Research and gather context',
      description: `Research domain, gather context, and review existing solutions.${
        contextText ? ` Context: ${contextText}` : ''
      }`,
      priority: 'high' as const,
    },
    {
      title: 'Design solution architecture',
      description: 'Design solution architecture and component relationships.',
      priority: 'high' as const,
    },
    {
      title: 'Implement core logic',
      description: 'Implement the core logic and primary functionality.',
      priority: 'high' as const,
    },
    {
      title: 'Write unit tests',
      description: 'Write comprehensive unit tests for all components.',
      priority: 'medium' as const,
    },
    {
      title: 'Integration testing',
      description: 'Perform end-to-end integration testing.',
      priority: 'medium' as const,
    },
    {
      title: 'Documentation',
      description: 'Write documentation, usage examples, and API references.',
      priority: 'medium' as const,
    },
    {
      title: 'Code review and refinement',
      description: 'Code review, refactoring, and addressing feedback.',
      priority: 'medium' as const,
    },
    {
      title: 'Performance optimization',
      description: 'Profile and optimize performance-critical paths.',
      priority: 'low' as const,
    },
    {
      title: 'Deployment and monitoring',
      description: 'Deploy and set up monitoring and alerting.',
      priority: 'low' as const,
    },
  ];

  for (let i = 0; i < count; i++) {
    const tpl = templates[i % templates.length];
    const deps: string[] = i > 0 ? [generateSubtaskId(goalId, i - 1)] : [];
    subtasks.push({
      id: generateSubtaskId(goalId, i),
      title: tpl.title,
      description: tpl.description,
      dependencies: deps,
      status: 'pending',
      priority: tpl.priority,
    });
  }

  return subtasks;
}

// ---------------------------------------------------------------------------
// Tool: decompose_goal
// ---------------------------------------------------------------------------

const decomposeGoal: Tool = {
  definition: {
    name: 'decompose_goal',
    description: 'Break a complex goal into dependency-ordered subtasks',
    params: [
      {
        name: 'goal',
        type: 'string',
        description: 'The complex goal to decompose',
        required: true,
      },
      {
        name: 'context',
        type: 'string',
        description: 'Optional additional context',
        required: false,
      },
      {
        name: 'max_subtasks',
        type: 'number',
        description: 'Maximum number of subtasks to generate',
        required: false,
      },
    ],
    capabilities: [],
  },

  execute: async (args: Record<string, unknown>, _ctx: ToolContext): Promise<ToolCallResult> => {
    const start = Date.now();
    const toolName = 'decompose_goal';
    try {
      if (!args.goal || typeof args.goal !== 'string') {
        return {
          toolName,
          success: false,
          output: '',
          error: 'Goal must be a non-empty string',
          durationMs: Date.now() - start,
        };
      }

      const goalText = args.goal as string;
      const contextText = args.context as string | undefined;
      const maxSubtasks = typeof args.max_subtasks === 'number' && args.max_subtasks > 0
        ? args.max_subtasks
        : config.maxSubtasks;

      const goalId = generateGoalId();
      const subtasks = decomposeGoalInternal(goalText, contextText, maxSubtasks);

      const goal: Goal = {
        id: goalId,
        goal: goalText,
        context: contextText,
        subtasks,
        createdAt: new Date().toISOString(),
        status: 'active',
      };

      goals.set(goalId, goal);

      return {
        toolName,
        success: true,
        output: JSON.stringify({
          goalId,
          goal: goalText,
          context: contextText ?? null,
          subtasks,
          totalSubtasks: subtasks.length,
          message:
            `Goal decomposed into ${subtasks.length} dependency-ordered subtasks. Use assign_subtasks to assign agents.`,
        }),
        durationMs: Date.now() - start,
      };
    } catch (error) {
      return {
        toolName,
        success: false,
        output: '',
        error: `Decomposition failed: ${error instanceof Error ? error.message : String(error)}`,
        durationMs: Date.now() - start,
      };
    }
  },
};

// ---------------------------------------------------------------------------
// Tool: assign_subtasks
// ---------------------------------------------------------------------------

const assignSubtasks: Tool = {
  definition: {
    name: 'assign_subtasks',
    description: 'Assign subtasks to agents/roles',
    params: [
      {
        name: 'subtasks',
        type: 'string',
        description: 'JSON array of subtask objects',
        required: true,
      },
      {
        name: 'agents',
        type: 'string',
        description: 'JSON array of available agents',
        required: false,
      },
    ],
    capabilities: [],
  },

  execute: async (args: Record<string, unknown>, _ctx: ToolContext): Promise<ToolCallResult> => {
    const start = Date.now();
    const toolName = 'assign_subtasks';
    try {
      if (!args.subtasks || typeof args.subtasks !== 'string') {
        return {
          toolName,
          success: false,
          output: '',
          error: 'subtasks must be a non-empty string',
          durationMs: Date.now() - start,
        };
      }

      let subtasks: Subtask[];
      try {
        subtasks = JSON.parse(args.subtasks as string);
      } catch {
        return {
          toolName,
          success: false,
          output: '',
          error: 'subtasks must be valid JSON',
          durationMs: Date.now() - start,
        };
      }

      if (!Array.isArray(subtasks) || subtasks.length === 0) {
        return {
          toolName,
          success: false,
          output: '',
          error: 'subtasks must be a non-empty JSON array',
          durationMs: Date.now() - start,
        };
      }

      let agentList: string[] = [];
      if (args.agents && typeof args.agents === 'string') {
        try {
          const parsed = JSON.parse(args.agents);
          agentList = Array.isArray(parsed) ? parsed.map(String) : [];
        } catch {
          agentList = args.agents.split(',').map((a) => a.trim()).filter(Boolean);
        }
      }

      const assignments: Array<{ subtaskId: string; title: string; assignedTo: string }> = [];
      for (let i = 0; i < subtasks.length; i++) {
        const agent = agentList.length > 0 ? agentList[i % agentList.length] : `agent_${i + 1}`;
        subtasks[i].assignedTo = agent;
        assignments.push({
          subtaskId: subtasks[i].id,
          title: subtasks[i].title,
          assignedTo: agent,
        });
      }

      return {
        toolName,
        success: true,
        output: JSON.stringify({
          assignments,
          totalAssigned: assignments.length,
          agents: agentList.length > 0 ? agentList : ['auto-assigned'],
        }),
        durationMs: Date.now() - start,
      };
    } catch (error) {
      return {
        toolName,
        success: false,
        output: '',
        error: `Assignment failed: ${error instanceof Error ? error.message : String(error)}`,
        durationMs: Date.now() - start,
      };
    }
  },
};

// ---------------------------------------------------------------------------
// Tool: track_progress
// ---------------------------------------------------------------------------

const trackProgress: Tool = {
  definition: {
    name: 'track_progress',
    description: 'Track completion of subtasks',
    params: [
      { name: 'goal_id', type: 'string', description: 'The goal identifier', required: true },
      {
        name: 'subtask_id',
        type: 'string',
        description: 'Specific subtask to update',
        required: false,
      },
      {
        name: 'status',
        type: 'string',
        description: 'Status to set',
        required: false,
        enum: ['pending', 'in_progress', 'completed', 'blocked'],
      },
    ],
    capabilities: [],
  },

  execute: async (args: Record<string, unknown>, _ctx: ToolContext): Promise<ToolCallResult> => {
    const start = Date.now();
    const toolName = 'track_progress';
    try {
      if (!args.goal_id || typeof args.goal_id !== 'string') {
        return {
          toolName,
          success: false,
          output: '',
          error: 'goal_id must be a non-empty string',
          durationMs: Date.now() - start,
        };
      }

      const goalId = args.goal_id as string;
      const goal = goals.get(goalId);

      if (!goal) {
        return {
          toolName,
          success: false,
          output: '',
          error: `Goal "${goalId}" not found`,
          durationMs: Date.now() - start,
        };
      }

      if (args.subtask_id && typeof args.subtask_id === 'string') {
        const subtask = goal.subtasks.find((s) => s.id === args.subtask_id);
        if (!subtask) {
          return {
            toolName,
            success: false,
            output: '',
            error: `Subtask "${args.subtask_id}" not found in goal "${goalId}"`,
            durationMs: Date.now() - start,
          };
        }

        const validStatuses = ['pending', 'in_progress', 'completed', 'blocked'] as const;
        const newStatus = args.status as string | undefined;
        if (newStatus && validStatuses.includes(newStatus as typeof validStatuses[number])) {
          subtask.status = newStatus as Subtask['status'];
        }

        return {
          toolName,
          success: true,
          output: JSON.stringify({ goalId, updatedSubtask: subtask }),
          durationMs: Date.now() - start,
        };
      }

      if (args.status && typeof args.status === 'string') {
        const validStatuses = ['pending', 'in_progress', 'completed', 'blocked'] as const;
        if (validStatuses.includes(args.status as typeof validStatuses[number])) {
          for (const subtask of goal.subtasks) {
            subtask.status = args.status as Subtask['status'];
          }
        }
      }

      const completed = goal.subtasks.filter((s) => s.status === 'completed').length;
      const total = goal.subtasks.length;

      return {
        toolName,
        success: true,
        output: JSON.stringify({
          goalId,
          progress: `${completed}/${total} completed`,
          percentage: Math.round((completed / total) * 100),
          subtasks: goal.subtasks.map((s) => ({
            id: s.id,
            title: s.title,
            status: s.status,
            assignedTo: s.assignedTo,
          })),
        }),
        durationMs: Date.now() - start,
      };
    } catch (error) {
      return {
        toolName,
        success: false,
        output: '',
        error: `Progress tracking failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
        durationMs: Date.now() - start,
      };
    }
  },
};

// ---------------------------------------------------------------------------
// Tool: goal_status
// ---------------------------------------------------------------------------

const goalStatus: Tool = {
  definition: {
    name: 'goal_status',
    description: 'Get status of a decomposed goal',
    params: [
      { name: 'goal_id', type: 'string', description: 'The goal identifier', required: true },
    ],
    capabilities: [],
  },

  execute: async (args: Record<string, unknown>, _ctx: ToolContext): Promise<ToolCallResult> => {
    const start = Date.now();
    const toolName = 'goal_status';
    try {
      if (!args.goal_id || typeof args.goal_id !== 'string') {
        return {
          toolName,
          success: false,
          output: '',
          error: 'goal_id must be a non-empty string',
          durationMs: Date.now() - start,
        };
      }

      const goalId = args.goal_id as string;
      const goal = goals.get(goalId);

      if (!goal) {
        return {
          toolName,
          success: false,
          output: '',
          error: `Goal "${goalId}" not found`,
          durationMs: Date.now() - start,
        };
      }

      const statusCounts = { pending: 0, in_progress: 0, completed: 0, blocked: 0 };
      for (const s of goal.subtasks) {
        statusCounts[s.status]++;
      }
      const total = goal.subtasks.length;
      const progress = Math.round((statusCounts.completed / total) * 100);

      return {
        toolName,
        success: true,
        output: JSON.stringify({
          goalId,
          goal: goal.goal,
          context: goal.context ?? null,
          createdAt: goal.createdAt,
          status: goal.status,
          progress: `${statusCounts.completed}/${total}`,
          percentage: progress,
          breakdown: statusCounts,
          subtasks: goal.subtasks.map((s) => ({
            id: s.id,
            title: s.title,
            status: s.status,
            assignedTo: s.assignedTo ?? 'unassigned',
            priority: s.priority,
            dependencies: s.dependencies,
          })),
        }),
        durationMs: Date.now() - start,
      };
    } catch (error) {
      return {
        toolName,
        success: false,
        output: '',
        error: `Status retrieval failed: ${error instanceof Error ? error.message : String(error)}`,
        durationMs: Date.now() - start,
      };
    }
  },
};

// ---------------------------------------------------------------------------
// Tool: replan
// ---------------------------------------------------------------------------

const replan: Tool = {
  definition: {
    name: 'replan',
    description: 'Replan remaining subtasks if something changes',
    params: [
      { name: 'goal_id', type: 'string', description: 'The goal identifier', required: true },
      {
        name: 'change_description',
        type: 'string',
        description: 'Description of what changed',
        required: true,
      },
    ],
    capabilities: [],
  },

  execute: async (args: Record<string, unknown>, _ctx: ToolContext): Promise<ToolCallResult> => {
    const start = Date.now();
    const toolName = 'replan';
    try {
      if (!args.goal_id || typeof args.goal_id !== 'string') {
        return {
          toolName,
          success: false,
          output: '',
          error: 'goal_id must be a non-empty string',
          durationMs: Date.now() - start,
        };
      }
      if (!args.change_description || typeof args.change_description !== 'string') {
        return {
          toolName,
          success: false,
          output: '',
          error: 'change_description must be a non-empty string',
          durationMs: Date.now() - start,
        };
      }

      const goalId = args.goal_id as string;
      const changeDescription = args.change_description as string;
      const goal = goals.get(goalId);

      if (!goal) {
        return {
          toolName,
          success: false,
          output: '',
          error: `Goal "${goalId}" not found`,
          durationMs: Date.now() - start,
        };
      }

      const remaining = goal.subtasks.filter((s) => s.status !== 'completed');
      const completed = goal.subtasks.filter((s) => s.status === 'completed');

      const newSubtasks: Subtask[] = [];
      for (const subtask of remaining) {
        newSubtasks.push({
          ...subtask,
          status: 'pending',
          description: `${subtask.description} [Replanned: ${changeDescription}]`,
        });
      }

      goal.subtasks = [...completed, ...newSubtasks];

      return {
        toolName,
        success: true,
        output: JSON.stringify({
          goalId,
          changeDescription,
          completedCount: completed.length,
          replannedCount: newSubtasks.length,
          message:
            `Replanned ${newSubtasks.length} remaining subtasks. All pending subtasks reset to accommodate changes.`,
          replannedSubtasks: newSubtasks.map((s) => ({ id: s.id, title: s.title })),
        }),
        durationMs: Date.now() - start,
      };
    } catch (error) {
      return {
        toolName,
        success: false,
        output: '',
        error: `Replan failed: ${error instanceof Error ? error.message : String(error)}`,
        durationMs: Date.now() - start,
      };
    }
  },
};

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

export async function onLoad(ctx: PluginContext): Promise<void> {
  const maxSubtasks = await ctx.config.get<number>('maxSubtasks');
  const autoAssign = await ctx.config.get<boolean>('autoAssign');

  config = {
    maxSubtasks: typeof maxSubtasks === 'number' ? maxSubtasks : 8,
    autoAssign: autoAssign ?? true,
  };

  ctx.logger.info('[cortex-plugin-goal-decomposer] Loaded with 5 goal decomposition tools');
}

export async function onUnload(_ctx: PluginContext): Promise<void> {
  goals.clear();
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const tools: Tool[] = [
  decomposeGoal,
  assignSubtasks,
  trackProgress,
  goalStatus,
  replan,
];
