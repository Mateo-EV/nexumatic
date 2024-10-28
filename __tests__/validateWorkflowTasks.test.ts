import {
  workflowTasksSchema,
  type workflowTasksSchemaType,
} from "../src/lib/validators/both";

function validatedWorkflowTasks(
  data: workflowTasksSchemaType,
  services: Service[],
) {
  const { success, data: d } = workflowTasksSchema.safeParse(data);

  if (success) {
    const { taskDependencies, tasks } = d;

    const serviceTypeMap: Record<string, "trigger" | "action"> = {};
    services.forEach((service) => {
      serviceTypeMap[service.id] = service.type;
    });

    const triggerTasks = tasks.filter(
      (task) => serviceTypeMap[task.serviceId] === "trigger",
    );
    if (triggerTasks.length > 1) {
      throw new Error("Only one trigger task is allowed in the workflow.");
    }

    if (triggerTasks.length === 1) {
      const triggerTask = triggerTasks[0]!;
      const triggerHasDependency = taskDependencies.some(
        (dep) => dep.taskTempId === triggerTask.tempId,
      );
      if (triggerHasDependency) {
        throw new Error("The trigger task cannot have any dependencies.");
      }
    }

    const adjacencyList = taskDependencies.reduce(
      (acc, { taskTempId, taskDependencyTempId }) => {
        if (!acc[taskDependencyTempId]) acc[taskDependencyTempId] = [];
        acc[taskDependencyTempId].push(taskTempId);
        return acc;
      },
      {} as Record<string, string[]>,
    );

    const childToParentMap = new Map();
    for (const { taskTempId, taskDependencyTempId } of taskDependencies) {
      if (childToParentMap.has(taskTempId)) {
        throw new Error(
          "A task cannot have more than one dependency (parent).",
        );
      }
      childToParentMap.set(taskTempId, taskDependencyTempId);
    }

    const hasCycle = (
      taskDependencyTempId: string,
      visited = new Set(),
      stack = new Set(),
    ) => {
      if (stack.has(taskDependencyTempId)) return true;
      if (visited.has(taskDependencyTempId)) return false;

      visited.add(taskDependencyTempId);
      stack.add(taskDependencyTempId);

      const neighbourTasks = adjacencyList[taskDependencyTempId] ?? [];

      for (const neighbour of neighbourTasks) {
        if (hasCycle(neighbour, visited, stack)) return true;
      }

      stack.delete(taskDependencyTempId);
      return false;
    };

    const allTasks = Object.keys(adjacencyList);
    for (const task of allTasks) {
      if (hasCycle(task)) {
        throw new Error(
          "Circular dependencies are not allowed in the workflow.",
        );
      }
    }

    return true;
  }

  return false;
}

interface Service {
  id: string;
  type: "trigger" | "action";
}

describe("Workflow task validation", () => {
  it("should allow one trigger and multiple action tasks", async () => {
    const inputData: workflowTasksSchemaType = {
      workflowId: "workflow-1",
      tasks: [
        { serviceId: "service-1", tempId: "task-1", position: { x: 0, y: 0 } },
        { serviceId: "service-2", tempId: "task-2", position: { x: 1, y: 1 } },
        { serviceId: "service-3", tempId: "task-3", position: { x: 2, y: 2 } },
      ],
      taskDependencies: [
        { taskTempId: "task-2", taskDependencyTempId: "task-1" },
        { taskTempId: "task-3", taskDependencyTempId: "task-2" },
      ],
    };

    const services: Service[] = [
      { id: "service-1", type: "trigger" },
      { id: "service-2", type: "action" },
      { id: "service-3", type: "action" },
    ];

    const result = validatedWorkflowTasks(inputData, services);
    expect(result).toBeTruthy();
  });

  it("should throw an error if there are multiple triggers", async () => {
    const inputData: workflowTasksSchemaType = {
      workflowId: "workflow-2",
      tasks: [
        { serviceId: "service-1", tempId: "task-1", position: { x: 0, y: 0 } },
        { serviceId: "service-2", tempId: "task-2", position: { x: 1, y: 1 } },
      ],
      taskDependencies: [],
    };

    const services: Service[] = [
      { id: "service-1", type: "trigger" },
      { id: "service-2", type: "trigger" },
    ];

    expect(() => {
      validatedWorkflowTasks(inputData, services);
    }).toThrow("Only one trigger task is allowed in the workflow.");
  });

  it("should throw an error if there are circular dependencies", async () => {
    const inputData: workflowTasksSchemaType = {
      workflowId: "workflow-3",
      tasks: [
        { serviceId: "service-1", tempId: "task-1", position: { x: 0, y: 0 } },
        { serviceId: "service-2", tempId: "task-2", position: { x: 1, y: 1 } },
        { serviceId: "service-3", tempId: "task-3", position: { x: 2, y: 2 } },
      ],
      taskDependencies: [
        { taskTempId: "task-2", taskDependencyTempId: "task-1" },
        { taskTempId: "task-3", taskDependencyTempId: "task-2" },
        { taskTempId: "task-1", taskDependencyTempId: "task-3" },
      ],
    };

    const services: Service[] = [
      { id: "service-1", type: "action" },
      { id: "service-2", type: "action" },
      { id: "service-3", type: "action" },
    ];

    expect(() => {
      validatedWorkflowTasks(inputData, services);
    }).toThrow("Circular dependencies are not allowed in the workflow.");
  });

  it("should throw an error if a task has multiple parents", async () => {
    const inputData: workflowTasksSchemaType = {
      workflowId: "workflow-4",
      tasks: [
        { serviceId: "service-1", tempId: "task-1", position: { x: 0, y: 0 } },
        { serviceId: "service-2", tempId: "task-2", position: { x: 1, y: 1 } },
        { serviceId: "service-3", tempId: "task-3", position: { x: 2, y: 2 } },
      ],
      taskDependencies: [
        { taskTempId: "task-3", taskDependencyTempId: "task-1" },
        { taskTempId: "task-3", taskDependencyTempId: "task-2" },
      ],
    };

    const services: Service[] = [
      { id: "service-1", type: "action" },
      { id: "service-2", type: "action" },
      { id: "service-3", type: "action" },
    ];

    expect(() => {
      validatedWorkflowTasks(inputData, services);
    }).toThrow("A task cannot have more than one dependency (parent).");
  });

  it("should throw an error if a trigger has dependencies", async () => {
    const inputData: workflowTasksSchemaType = {
      workflowId: "workflow-5",
      tasks: [
        { serviceId: "service-1", tempId: "task-1", position: { x: 0, y: 0 } },
        { serviceId: "service-2", tempId: "task-2", position: { x: 1, y: 1 } },
      ],
      taskDependencies: [
        { taskTempId: "task-1", taskDependencyTempId: "task-2" },
      ],
    };

    const services: Service[] = [
      { id: "service-1", type: "trigger" },
      { id: "service-2", type: "action" },
    ];

    expect(() => {
      validatedWorkflowTasks(inputData, services);
    }).toThrow("The trigger task cannot have any dependencies.");
  });
});
