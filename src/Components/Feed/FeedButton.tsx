import CareIcon from "../../CAREUI/icons/CareIcon";
import KeyboardShortcut from "../../CAREUI/interactive/KeyboardShortcut";
import { classNames, isAppleDevice } from "../../Utils/utils";

interface Props {
  className?: string;
  children?: React.ReactNode;
  shortcut: string[];
  onTrigger: () => void;
  helpText?: string;
  shortcutsDisabled?: boolean;
  tooltipClassName?: string;
}

function FeedButton(props: Props) {
  const child = (
    <button
      className={classNames(
        "flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-800/50 bg-zinc-800/50 shadow-none transition hover:bg-zinc-800 hover:shadow active:shadow-2xl",
        props.className
      )}
      type="button"
      onClick={props.onTrigger}
    >
      {props.children}
    </button>
  );

  if (props.shortcutsDisabled) {
    return child;
  }

  return (
    <KeyboardShortcut
      shortcut={props.shortcut}
      onTrigger={props.onTrigger}
      helpText={props.helpText}
      tooltipClassName={props.tooltipClassName}
    >
      {child}
    </KeyboardShortcut>
  );
}

interface TemplateButtonProps {
  onTrigger: () => void;
  shortcutsDisabled?: boolean;
  className?: string;
}

const Fullscreen = (props: TemplateButtonProps) => {
  return (
    <FeedButton shortcut={["F"]} {...props}>
      <CareIcon icon="l-expand-arrows-alt" />
    </FeedButton>
  );
};

const Reset = (props: TemplateButtonProps) => {
  return (
    <FeedButton shortcut={["Shift", "R"]} {...props}>
      <CareIcon icon="l-redo" />
    </FeedButton>
  );
};

const SavePreset = (props: TemplateButtonProps) => {
  return (
    <FeedButton shortcut={["Shift", "S"]} {...props}>
      <CareIcon icon="l-save" />
    </FeedButton>
  );
};

const ZoomIn = (props: TemplateButtonProps) => {
  return (
    <FeedButton
      shortcut={[isAppleDevice ? "Meta" : "Ctrl", "I"]}
      tooltipClassName="tooltip-left translate-y-2 translate-x-1"
      helpText="Zoom In"
      {...props}
    >
      <CareIcon icon="l-search-plus" />
    </FeedButton>
  );
};

const ZoomOut = (props: TemplateButtonProps) => {
  return (
    <FeedButton
      shortcut={[isAppleDevice ? "Meta" : "Ctrl", "O"]}
      tooltipClassName="tooltip-left translate-y-2 translate-x-1"
      helpText="Zoom Out"
      {...props}
    >
      <CareIcon icon="l-search-minus" />
    </FeedButton>
  );
};

const TogglePrecisionMode = (props: TemplateButtonProps) => {
  return <FeedButton shortcut={["Shift", "P"]} {...props} />;
};

const MoveUp = (props: TemplateButtonProps) => {
  return (
    <FeedButton
      shortcut={[isAppleDevice ? "Meta" : "Ctrl", "Shift", "ArrowUp"]}
      tooltipClassName="tooltip-bottom -translate-x-1/2 translate-y-1"
      {...props}
    >
      <CareIcon icon="l-triangle" />
    </FeedButton>
  );
};

const MoveDown = (props: TemplateButtonProps) => {
  return (
    <FeedButton
      shortcut={[isAppleDevice ? "Meta" : "Ctrl", "Shift", "ArrowDown"]}
      tooltipClassName="tooltip-top -translate-x-1/2 -translate-y-1"
      {...props}
    >
      <CareIcon icon="l-triangle" className="rotate-180" />
    </FeedButton>
  );
};

const MoveLeft = (props: TemplateButtonProps) => {
  return (
    <FeedButton
      shortcut={[isAppleDevice ? "Meta" : "Ctrl", "Shift", "ArrowLeft"]}
      tooltipClassName="tooltip-top -translate-x-1/3 -translate-y-1"
      {...props}
    >
      <CareIcon icon="l-triangle" className="-rotate-90" />
    </FeedButton>
  );
};

const MoveRight = (props: TemplateButtonProps) => {
  return (
    <FeedButton
      shortcut={[isAppleDevice ? "Meta" : "Ctrl", "Shift", "ArrowRight"]}
      tooltipClassName="tooltip-top -translate-x-2/3 -translate-y-1"
      {...props}
    >
      <CareIcon icon="l-triangle" className="rotate-90" />
    </FeedButton>
  );
};

const FeedButtons = {
  Fullscreen,
  Reset,
  SavePreset,
  ZoomIn,
  ZoomOut,
  TogglePrecisionMode,
  MoveUp,
  MoveDown,
  MoveLeft,
  MoveRight,
};

export default FeedButtons;
