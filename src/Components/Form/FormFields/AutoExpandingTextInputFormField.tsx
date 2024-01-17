import React, { useEffect } from "react";
import TextAreaFormField, { TextAreaFormFieldProps } from "./TextAreaFormField";

type AutoExpandingTextInputFormFieldProps = TextAreaFormFieldProps & {
  id: string;
  maxHeight?: number;
};

const AutoExpandingTextInputFormField = (
  props: AutoExpandingTextInputFormFieldProps
) => {
  const textArea = document.getElementById(props.id);
  useEffect(() => {
    if (textArea == null) return;
    const text = textArea.textContent?.split("\n");
    const len = (text?.length == 0 ? 1 : text?.length) || 1;
    const height = Math.min(len * 18, (props.maxHeight || 160) - 28) + 28;
    textArea.style.cssText =
      "min-height:36px; height:46px; height:" + height + "px";
  }, [textArea?.textContent]);

  return <TextAreaFormField {...props} className="w-full" />;
};

export default AutoExpandingTextInputFormField;
