import React, { useEffect } from "react";
import TextAreaFormField, { TextAreaFormFieldProps } from "./TextAreaFormField";

type AutoExpandingTextInputFormFieldProps = TextAreaFormFieldProps & {
  id: string;
};

const AutoExpandingTextInputFormField = (
  props: AutoExpandingTextInputFormFieldProps
) => {
  const textArea = document.getElementById(props.id);
  useEffect(() => {
    if (textArea == null) return;
    const text = textArea.textContent?.split("\n");
    const len = (text?.length == 0 ? 1 : text?.length) || 1;
    if (len > 7) {
      textArea.style.cssText =
        "min-height:36px; max-height:160px; height:160px;";
    } else {
      const height = Math.min(len * 18, 132) + 28;
      textArea.style.cssText =
        "min-height:36px; max-height:160px; height:46px; height:" +
        height +
        "px";
    }
  }, [textArea?.textContent]);

  return <TextAreaFormField {...props} className="max-h-40 w-full" />;
};

export default AutoExpandingTextInputFormField;
