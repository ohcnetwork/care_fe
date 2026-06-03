# Override Framework – Minimal Integration Plan

## 🎯 Goal

Introduce a **non-intrusive override system** into the React app such that:

- Developers **do not change how components are used**
- Any component can become **overrideable by default**
- Overrides are **context-aware (page, role, tree position)**
- Performance remains **near O(1) at render time**

---

## 🧩 Core Philosophy

We only introduce **two primitives**:

1. `register()` → wraps components to make them overrideable
2. `<App>` → provides the global override + resolution context

Everything else (DSL, plugins, rules) builds on top of this.

---

# 1. `register()` – Making Components Overrideable

## ✅ Developer Experience

Developers only do:

```tsx
function PatientCard(props) {
  return <div>Base Card</div>;
}

export default register("PatientCard", PatientCard);
```

No change in usage:

```tsx
<PatientCard />
```

---

## 🧠 What `register()` Does

It wraps the component and handles:

1. Fetching the **resolved component**
2. Maintaining the **render stack (context chain)**
3. Rendering the correct version

---

## ⚙️ Implementation

```tsx
function register(key, BaseComponent) {
  // Ensure registry entry exists
  registry[key] = registry[key] || {
    base: BaseComponent,
    overrides: [],
    hasStackConditions: false,
  };

  return function RegisteredComponent(props) {
    // 1. Get global resolution map (fast path)
    const resolutionMap = React.useContext(ResolutionContext);

    // 2. Get parent stack (linked structure)
    const parentStack = React.useContext(StackContext);

    const entry = registry[key];

    // 🚀 FAST PATH (no stack conditions)
    if (!entry.hasStackConditions) {
      const Component = resolutionMap[key] || BaseComponent;
      return <Component {...props} />;
    }

    // 🔥 STACK-AWARE PATH (only when needed)

    const stack = {
      value: { name: key },
      parent: parentStack,
    };

    const overrideContext = {
      ...useOverrideContext(),
      renderStack: stack,
    };

    const Component = resolveWithStack(key, overrideContext);

    return (
      <StackContext.Provider value={stack}>
        <Component {...props} />
      </StackContext.Provider>
    );
  };
}
```

---

## 🔑 Key Design Decisions

### 1. Linked Stack (O(1))

```ts
{
  value: { name: "PatientCard" },
  parent: previousStack
}
```

- No array cloning
- Cheap to construct
- Traversable when needed

---

### 2. Fast Path vs Stack Path

| Type of Override   | Execution          |
| ------------------ | ------------------ |
| Global (page/role) | Precomputed map    |
| Stack-based        | Runtime resolution |

👉 Most components use **fast path**

---

### 3. Invisible to Developers

- No hooks required
- No prop drilling
- No API learning curve

---

# 2. `<App>` – Providing Global Context

This is where all **heavy computation happens once**.

---

## 🧠 Responsibilities

1. Compute **Resolution Map**
2. Provide **global override context**
3. Initialize **stack root**

---

## ⚙️ Contexts

### 1. OverrideContext (global state)

```ts
type OverrideContextType = {
  page?: string;
  route?: string;
  userRole?: string;
  facilityType?: string;
};
```

---

### 2. ResolutionContext (precomputed map)

```ts
type ResolutionMap = {
  [componentName: string]: React.ComponentType<any>;
};
```

---

### 3. StackContext (linked stack)

```ts
type RenderStackNode = {
  value: { name: string };
  parent: RenderStackNode | null;
};
```

---

## ⚙️ App Setup

```tsx
function App() {
  const overrideContext = {
    page: getCurrentPage(),
    userRole: getUserRole(),
    facilityType: getFacilityType(),
  };

  const resolutionMap = React.useMemo(() => {
    return computeResolutionMap(overrideContext, registry);
  }, [overrideContext]);

  return (
    <OverrideContext.Provider value={overrideContext}>
      <ResolutionContext.Provider value={resolutionMap}>
        <StackContext.Provider value={null}>
          <AppRoutes />
        </StackContext.Provider>
      </ResolutionContext.Provider>
    </OverrideContext.Provider>
  );
}
```

---

# 3. Resolution Flow (End-to-End)

## 🧭 Without Stack

```txt
<App>
  → computeResolutionMap()

<PatientCard>
  → resolutionMap["PatientCard"]
  → render component (O(1))
```

---

## 🧭 With Stack

```txt
<PatientHome>
  → stack: [PatientHome]

<PatientCard>
  → stack: [PatientHome, PatientCard]

<PatientButton>
  → stack: [PatientHome, PatientCard, PatientButton]
  → resolve with stack conditions
```

---

# 4. Registry Structure

```ts
registry = {
  PatientCard: {
    base: BasePatientCard,
    overrides: [...],
    hasStackConditions: false
  },
  PatientButton: {
    base: BaseButton,
    overrides: [...],
    hasStackConditions: true
  }
};
```

---

# 5. Performance Characteristics

| Operation                  | Cost              |
| -------------------------- | ----------------- |
| Resolution map computation | O(N rules) (once) |
| Component lookup           | O(1)              |
| Stack creation             | O(1)              |
| Stack traversal            | O(depth) (rare)   |

---

## ✅ Why This Scales

- No per-component rule evaluation (fast path)
- Stack only used when necessary
- Context usage is localized

---

# 6. What This Enables

With just these two changes:

### ✅ Every component becomes overrideable

### ✅ Plugins can inject behavior

### ✅ UI becomes context-aware

### ✅ No breaking changes to existing code

---

# 7. Guardrails (Important)

### ❌ Avoid

- Overusing stack-based conditions
- Deep stackPath matching
- Exposing StackContext to general components

---

### ✅ Enforce

- Use stack only for edge cases
- Prefer global context (page, role)
- Add debug tooling early

---

# 8. Minimal Adoption Plan

### Step 1

Introduce:

- `register()`
- Contexts in `<App>`

---

### Step 2

Start registering key components:

```ts
export default register("PatientCard", PatientCard);
```

---

### Step 3

Add first override rules (internal)

---

### Step 4

Introduce plugin-based overrides

---

# 🧠 Final Mental Model

```txt
Before:
Component → renders itself

After:
Component → asks system what it should be → renders that
```

---

# 🚀 Summary

You’ve introduced a system where:

- The **App decides behavior**
- Components remain **pure and simple**
- Overrides are **declarative and scalable**

And most importantly:

> **This is achieved with only two changes: `register()` and `<App>` context.**
