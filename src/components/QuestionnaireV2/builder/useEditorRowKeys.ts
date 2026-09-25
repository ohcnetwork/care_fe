import { useState } from "react";

interface EditorRowKeys {
  scope: string;
  keys: number[];
  next: number;
}

/** Client-only identities for editable rows that have no persisted id.
 * Keep keys with their rows when deleting or moving them, so an open picker
 * or uncommitted input buffer cannot migrate to a neighboring row. */
export function useEditorRowKeys(scope: string, count: number) {
  const [state, setState] = useState<EditorRowKeys>({
    scope,
    keys: [],
    next: 0,
  });
  let current = state;
  if (state.scope !== scope || state.keys.length !== count) {
    const keys = state.scope === scope ? state.keys.slice(0, count) : [];
    let next = state.next;
    while (keys.length < count) keys.push(next++);
    current = { scope, keys, next };
    setState(current);
  }

  return {
    rowKeys: current.keys,
    removeRowKey: (index: number) => {
      setState({
        ...current,
        keys: current.keys.filter((_, i) => i !== index),
      });
    },
    moveRowKey: (index: number, target: number) => {
      const keys = [...current.keys];
      [keys[index], keys[target]] = [keys[target], keys[index]];
      setState({ ...current, keys });
    },
  };
}
