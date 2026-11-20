import type { Question } from "@/types/questionnaire/question";

/** Tarjan's linear-time cycle detection includes groups controlling child answers. */
export function circularConditionQuestionIds(
  questions: Question[],
): Set<string> {
  const nodes = new Map<string, { question: Question; parent?: string }>();
  const links = new Map<string, string>();
  const collect = (list: Question[], parent?: string) => {
    for (const question of list) {
      nodes.set(question.id, { question, parent });
      links.set(question.link_id, question.id);
      collect(question.questions ?? [], question.id);
    }
  };
  collect(questions);

  const positions = new Map<string, number>();
  const lowLinks = new Map<string, number>();
  const stack: string[] = [];
  const onStack = new Set<string>();
  const circular = new Set<string>();
  let nextPosition = 0;
  const visit = (id: string) => {
    const node = nodes.get(id)!;
    const position = nextPosition++;
    positions.set(id, position);
    lowLinks.set(id, position);
    stack.push(id);
    onStack.add(id);
    const dependencies = new Set<string>();
    if (node.parent) dependencies.add(node.parent);
    for (const condition of node.question.enable_when ?? []) {
      const controller = links.get(condition.question);
      if (controller) dependencies.add(controller);
    }
    for (const dependency of dependencies) {
      if (!positions.has(dependency)) {
        visit(dependency);
        lowLinks.set(
          id,
          Math.min(lowLinks.get(id)!, lowLinks.get(dependency)!),
        );
      } else if (onStack.has(dependency)) {
        lowLinks.set(
          id,
          Math.min(lowLinks.get(id)!, positions.get(dependency)!),
        );
      }
    }
    if (lowLinks.get(id) !== position) return;
    const component: string[] = [];
    let member: string;
    do {
      member = stack.pop()!;
      onStack.delete(member);
      component.push(member);
    } while (member !== id);
    if (component.length > 1 || dependencies.has(id)) {
      component.forEach((questionId) => circular.add(questionId));
    }
  };
  for (const id of nodes.keys()) {
    if (!positions.has(id)) visit(id);
  }
  return circular;
}
